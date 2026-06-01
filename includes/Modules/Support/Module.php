<?php
/**
 * Support module bootstrap.
 *
 * Owns: ticket workflow state (`support_tickets`), email channels
 * (`support_mailboxes`), and private attachments (`support_attachments`).
 * Conversations are folded into `doublescale_activities` and linked through
 * `activity_associations` with `entity_type=3`; tags are reused from
 * `doublescale_tags` via a JSON `tag_ids` column on the ticket; saved
 * replies, products, custom-field definitions, and notification toggles
 * live in `wp_options` under `doublescale_settings['support']`.
 *
 * Free baseline only. Pro extensions (AI service, advanced reports,
 * round-robin, CSAT, Slack/Teams notifications) attach via the standard
 * `doublescale_register_modules` filter and the slug-to-class map.
 *
 * Design references:
 *   - {@see Modules/Booking/Module.php} — module shape for a non-trivial domain
 *   - {@see docs/support-module-integration-plan.md} — full integration plan
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Admin\AdminLoader;
use DoubleScale\Admin\MenuRegistry;
use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;
use DoubleScale\Modules\Support\Models\MailboxModel;
use DoubleScale\Modules\Support\Renderer\PortalFrontendHandler;
use DoubleScale\Modules\Support\Services\ActivityLogger;
use DoubleScale\Modules\Support\Services\ContactResolver;
use DoubleScale\Modules\Support\Services\EmailNotifications;
use DoubleScale\Modules\Support\Services\TicketService;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'support';
	}

	public function label(): string {
		return __( 'Support', 'doublescale' );
	}

	public function description(): string {
		return __( 'Ticket-based customer support with mailbox channels, email piping, and a customer portal.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function is_toggleable(): bool {
		return true;
	}

	public function dependencies(): array {
		// `activities` carries ticket replies/notes; `contacts` holds the
		// customer identity; `emails` provides the outbound rendering /
		// `Emails::send()` helper that bypasses QS's old SMTP bridge.
		return array( 'core', 'contacts', 'emails', 'activities' );
	}

	/**
	 * Action Scheduler hook pairs that this module owns, so toggling the
	 * module off via the Settings → Modules option correctly unschedules
	 * IMAP polling (Phase 3 wires the scheduler; the contract is declared
	 * up front so {@see \DoubleScale\Core\ModuleManager::clearScheduledTasksForModule()}
	 * Just Works the moment we add the polling task).
	 *
	 * @return array<int, array{0: string, 1: string}>
	 */
	public function scheduledHooks(): array {
		return array(
			array( 'doublescale_support', 'doublescale_support_email_inbound' ),
		);
	}

	public function register( Container $container ): void {
		$container->singleton(
			ContactResolver::class,
			static fn() => new ContactResolver()
		);

		// TicketService is the single orchestration point for every ticket
		// state change (REST, IMAP, WP-CLI). Binding as a singleton means all
		// callers see the same instance and listeners registered against it
		// (e.g. ActivityLogger) only fire once per change. The factory closure
		// receives the underlying IlluminateContainer; use ->make() to resolve
		// previously-bound dependencies.
		$container->singleton(
			TicketService::class,
			static fn( $app ) => new TicketService( $app->make( ContactResolver::class ) )
		);

		// ActivityLogger needs TicketService to write SUPPORT_EVENT rows when
		// ticket-lifecycle hooks fire. The listener registration happens in
		// boot() (not here) — register() is for binding, boot() for hooks.
		$container->singleton(
			ActivityLogger::class,
			static fn( $app ) => new ActivityLogger( $app->make( TicketService::class ) )
		);

		// Public-facing portal renderer. Resolving this binding in boot()
		// is what wires `add_shortcode()` + `wp_enqueue_scripts`, so it
		// MUST stay a singleton — second-resolves would double-register
		// the shortcode handler.
		$container->singleton(
			PortalFrontendHandler::class,
			static fn() => new PortalFrontendHandler()
		);

		// Outbound email notifications. Resolving in boot() wires the
		// ticket-lifecycle hook listeners, so it MUST stay a singleton —
		// a second resolve would double-subscribe and send duplicate mail.
		$container->singleton(
			EmailNotifications::class,
			static fn() => new EmailNotifications()
		);
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestTicketController::class,
			Rest\Controllers\RestReplyController::class,
			Rest\Controllers\RestMailboxController::class,
			Rest\Controllers\RestPortalController::class,
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		// Resolve the resolver + service eagerly so any other module that
		// listens for support-side hooks can use them from `doublescale_loaded`.
		$container->get( ContactResolver::class );
		$container->get( TicketService::class );

		// Register the ticket-lifecycle listeners. Done here (not in register())
		// so the WP hook system is guaranteed to be available — register()
		// runs before WP is fully initialised in some bootstrap orderings.
		$container->get( ActivityLogger::class )->register();

		// Resolve the portal frontend handler. Its constructor wires the
		// `[doublescale_support_portal]` shortcode and the `wp_enqueue_scripts`
		// listener that conditionally ships the renderer bundle to pages
		// containing the shortcode (and only for logged-in visitors).
		$container->get( PortalFrontendHandler::class );

		// Resolve the outbound email notifier so its constructor subscribes to
		// the ticket-lifecycle hooks (reply / created / status-change → customer).
		$container->get( EmailNotifications::class );

		// One-time: ensure a single shared "General" mailbox exists so the
		// agent inbox's "New ticket" action and the portal are usable the
		// moment support is enabled (otherwise `hasNoMailboxes` disables the
		// button and the portal mailbox list comes back empty).
		$this->maybe_seed_default_mailbox();

		// Sidebar entry inside the DoubleScale top-level menu. Position 46
		// places Support immediately after Booking (45) so agent-facing tools
		// cluster visually. `group: 'sales'` matches the existing agent-tool
		// bucket (Pipelines / Booking) — Support is also an agent workflow,
		// not a setting. `requires_module: 'support'` makes the row disappear
		// the moment the module is toggled off via Settings → Modules.
		MenuRegistry::add(
			array(
				'page_title'      => __( 'Support', 'doublescale' ),
				'menu_title'      => __( 'Support', 'doublescale' ),
				'capability'      => 'doublescale_access',
				'slug'            => 'doublescale&path=support',
				'callback'        => array( AdminLoader::class, 'page_wrapper' ),
				'position'        => 46,
				'group'           => 'sales',
				'requires_module' => 'support',
			)
		);
	}

	/**
	 * Seed a single shared "General" mailbox the first time support boots so
	 * the agent inbox and customer portal are usable immediately.
	 *
	 * This is module-scoped (one row, site-wide) — NOT per-user. A support
	 * mailbox is a shared routing channel; there is no per-agent mailbox.
	 *
	 * Idempotency mirrors {@see \\DoubleScale\\Modules\\Booking\\Module::register_provisioner_hooks()}:
	 * the `doublescale_support_default_mailbox_seeded` option flag stops the
	 * check on every boot, BUT we also re-seed when the table is empty even if
	 * the flag is set. The flag lives in `wp_options` while mailboxes live in a
	 * plugin table, so the "drop plugin tables + reactivate" dev workflow (and a
	 * tester who deletes every mailbox) would otherwise leave the two out of
	 * sync — flag set, zero rows, "New ticket" button stuck disabled.
	 *
	 * @return void
	 */
	private function maybe_seed_default_mailbox(): void {
		$already_flagged = (bool) get_option( 'doublescale_support_default_mailbox_seeded' );
		$has_mailbox     = MailboxModel::query()->exists();

		// Nothing to do only when BOTH the flag is set AND a row exists.
		if ( $already_flagged && $has_mailbox ) {
			return;
		}

		// A mailbox already exists (admin created one via REST before this ran,
		// or a prior seed succeeded): don't insert a duplicate, just flip the
		// flag so we stop checking.
		if ( $has_mailbox ) {
			update_option( 'doublescale_support_default_mailbox_seeded', true );
			return;
		}

		try {
			$mailbox             = new MailboxModel();
			$mailbox->slug       = 'general';
			$mailbox->email      = (string) get_option( 'admin_email' );
			$mailbox->box_type   = 'web';
			$mailbox->is_default = true;
			$mailbox->data       = array( 'name' => __( 'General', 'doublescale' ) );
			$mailbox->save();

			update_option( 'doublescale_support_default_mailbox_seeded', true );
		} catch ( \Throwable $e ) {
			// A broken seed must never abort module boot. The inbox's existing
			// "create a mailbox" empty state is the fallback UX.
			doublescale_get_logger()->error(
				'Failed to seed the default support mailbox.',
				array(
					'source' => 'support-module',
					'error'  => $e->getMessage(),
					'file'   => $e->getFile(),
					'line'   => $e->getLine(),
				)
			);
		}
	}
}
