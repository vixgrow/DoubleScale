<?php
/**
 * Knowledge Base module bootstrap.
 *
 * Free, self-hosted Knowledge Base modelled on BetterDocs + Perfex. Storage is
 * WordPress-native — a `doublescale_kb` custom post type plus the
 * `doublescale_kb_group` / `doublescale_kb_tag` taxonomies — so there are NO
 * content tables (and no content migrations). The admin SPA edits it through the
 * `doublescale/v1` REST surface; the public surface is the themed CPT
 * permalinks/archive plus the `[doublescale_knowledgebase]` shortcode.
 *
 * Three surfaces: admin SPA, logged-in portal tab, and the public anonymous
 * SEO-indexed site. The `public_access` setting + per-article/per-group
 * visibility are enforced at the WP front-end routing layer
 * ({@see Renderer\FrontendGuard}) because the public CPT serves its own pages.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Admin\AdminLoader;
use DoubleScale\Admin\MenuRegistry;
use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;
use DoubleScale\Modules\Knowledgebase\Integrations\KnowledgebaseAiProvider;
use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use DoubleScale\Modules\Knowledgebase\Renderer\FrontendGuard;
use DoubleScale\Modules\Knowledgebase\Renderer\KnowledgebaseShortcode;
use DoubleScale\Modules\Knowledgebase\Services\KnowledgebaseSettings;

/**
 * Module class.
 */
final class Module extends AbstractModule {

	/**
	 * Module slug — the single token used on every surface.
	 *
	 * @return string
	 */
	public function slug(): string {
		return 'knowledgebase';
	}

	/**
	 * Human label.
	 *
	 * @return string
	 */
	public function label(): string {
		return __( 'Knowledge Base', 'doublescale' );
	}

	/**
	 * Description.
	 *
	 * @return string
	 */
	public function description(): string {
		return __( 'Self-hosted help center: public, portal, and staff-internal articles with search and deflection.', 'doublescale' );
	}

	/**
	 * Version.
	 *
	 * @return string
	 */
	public function version(): string {
		return '1.0.0';
	}

	/**
	 * Toggleable so it renders in Settings → Modules.
	 *
	 * @return bool
	 */
	public function is_toggleable(): bool {
		return true;
	}

	/**
	 * Dependencies — Tier-3 tracking writes a contact-timeline activity, and both
	 * `contacts` and `activities` are always-on foundations, so these deps can
	 * never strand the module.
	 *
	 * @return array<int, string>
	 */
	public function dependencies(): array {
		return array( 'core', 'contacts', 'activities' );
	}

	/**
	 * Register DI bindings.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void {
		// Services are lightweight and self-constructing; no bindings required.
	}

	/**
	 * REST controllers (wired to rest_api_init by the parent boot()).
	 *
	 * @return array<int, string>
	 */
	public function restControllers(): array {
		return array(
			Rest\Controllers\RestArticleController::class,
			Rest\Controllers\RestGroupController::class,
			Rest\Controllers\RestPublicArticleController::class,
			Rest\Controllers\RestKnowledgebaseSettingsController::class,
		);
	}

	/**
	 * Boot WP hooks (enabled-only — the registry never boots a disabled module).
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function boot( Container $container ): void {
		parent::boot( $container );

		// Register the CPT + taxonomies + meta (and the deferred rewrite flush)
		// on init. Late priority so taxonomies/posts settle before the flush.
		add_action( 'init', array( KnowledgebasePostType::class, 'register' ), 9 );

		// Front-end routing guard for the themed CPT permalinks/archive.
		( new FrontendGuard() )->register();

		// Public SEO shortcode.
		( new KnowledgebaseShortcode() )->register();

		// "Was this helpful?" control on the themed single-article page. The CPT
		// serves its own template, so the control is appended via the_content +
		// a tiny enqueued script rather than a React mount.
		add_filter( 'the_content', array( $this, 'append_feedback_control' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_feedback_assets' ) );

		// AIAssistant knowledge-source wiring (no-op if the AI plugin is absent).
		( new KnowledgebaseAiProvider() )->register();

		// Client Portal: contribute the Knowledge Base section + inject its REST base.
		add_filter( 'doublescale_portal_sections', array( $this, 'register_portal_section' ) );
		add_filter( 'doublescale_client_portal_config', array( $this, 'inject_portal_config' ), 10, 2 );

		// Admin sidebar entry.
		MenuRegistry::add(
			array(
				'page_title'      => __( 'Knowledge Base', 'doublescale' ),
				'menu_title'      => __( 'Knowledge Base', 'doublescale' ),
				'capability'      => 'doublescale_manage_knowledgebase',
				'slug'            => 'doublescale&path=knowledgebase',
				'callback'        => array( AdminLoader::class, 'page_wrapper' ),
				'position'        => 47,
				'group'           => 'sales',
				'requires_module' => 'knowledgebase',
			)
		);
	}

	/**
	 * Contribute the Knowledge Base section to the Client Portal.
	 *
	 * @param array<int, array<string, mixed>> $sections Section descriptors.
	 * @return array<int, array<string, mixed>>
	 */
	public function register_portal_section( array $sections ): array {
		$sections[] = array(
			'slug'         => 'knowledgebase',
			'label'        => __( 'Knowledge Base', 'doublescale' ),
			'icon'         => 'book',
			'order'        => 20,
			'is_available' => static function (): bool {
				return doublescale_is_module_active( 'knowledgebase' )
					&& (bool) KnowledgebaseSettings::get( 'show_in_portal' );
			},
			'badge'        => static fn( $contact ) => 0,
		);

		return $sections;
	}

	/**
	 * Inject the KB public REST base into the Client Portal renderer config.
	 *
	 * @param array<string, mixed> $config Renderer config.
	 * @param \WP_User             $user   Current user (unused).
	 * @return array<string, mixed>
	 */
	public function inject_portal_config( array $config, $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$config['knowledgebase_rest_url'] = esc_url_raw( rest_url( 'doublescale/v1/knowledgebase/public' ) );

		return $config;
	}

	/**
	 * Append the "Was this helpful?" control to the themed single-article page.
	 *
	 * Visibility is already enforced upstream by {@see FrontendGuard} on
	 * `template_redirect`, so reaching the loop body means the viewer is cleared.
	 *
	 * @param string $content The post content.
	 * @return string
	 */
	public function append_feedback_control( string $content ): string {
		if ( is_admin()
			|| ! is_singular( KnowledgebasePostType::POST_TYPE )
			|| ! in_the_loop()
			|| ! is_main_query()
			|| ! KnowledgebaseSettings::get( 'enable_feedback' ) ) {
			return $content;
		}

		$post_id     = get_the_ID();
		$helpful     = (int) get_post_meta( $post_id, KnowledgebasePostType::META_HELPFUL, true );
		$not_helpful = (int) get_post_meta( $post_id, KnowledgebasePostType::META_NOT_HELPFUL, true );
		$slug        = get_post_field( 'post_name', $post_id );

		ob_start();
		?>
		<div class="doublescale-kb-feedback" data-kb-slug="<?php echo esc_attr( $slug ); ?>">
			<p class="doublescale-kb-feedback__prompt"><?php esc_html_e( 'Was this article helpful?', 'doublescale' ); ?></p>
			<div class="doublescale-kb-feedback__actions">
				<button type="button" class="doublescale-kb-feedback__btn" data-kb-vote="1">
					<?php
					/* translators: %d: number of readers who found the article helpful. */
					echo esc_html( sprintf( __( '👍 Yes (%d)', 'doublescale' ), $helpful ) );
					?>
				</button>
				<button type="button" class="doublescale-kb-feedback__btn" data-kb-vote="0">
					<?php
					/* translators: %d: number of readers who did not find the article helpful. */
					echo esc_html( sprintf( __( '👎 No (%d)', 'doublescale' ), $not_helpful ) );
					?>
				</button>
			</div>
			<p class="doublescale-kb-feedback__thanks" hidden><?php esc_html_e( 'Thanks for your feedback!', 'doublescale' ); ?></p>
		</div>
		<?php
		return $content . (string) ob_get_clean();
	}

	/**
	 * Enqueue the tiny feedback script on single-article pages (feedback on only).
	 *
	 * @return void
	 */
	public function enqueue_feedback_assets(): void {
		if ( ! is_singular( KnowledgebasePostType::POST_TYPE ) || ! KnowledgebaseSettings::get( 'enable_feedback' ) ) {
			return;
		}

		wp_register_script( 'doublescale-kb-feedback', '', array(), DOUBLESCALE_VERSION, true );
		wp_enqueue_script( 'doublescale-kb-feedback' );

		$config = wp_json_encode(
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => is_user_logged_in() ? wp_create_nonce( 'wp_rest' ) : '',
			)
		);

		$js = <<<JS
window.DoubleScaleKbFeedback = {$config};
(function () {
	var box = document.querySelector('.doublescale-kb-feedback');
	if (!box) { return; }
	var slug = box.getAttribute('data-kb-slug');
	var cfg = window.DoubleScaleKbFeedback || {};
	box.addEventListener('click', function (e) {
		var btn = e.target.closest('[data-kb-vote]');
		if (!btn) { return; }
		var helpful = btn.getAttribute('data-kb-vote') === '1';
		box.querySelectorAll('[data-kb-vote]').forEach(function (b) { b.disabled = true; });
		var headers = { 'Content-Type': 'application/json' };
		if (cfg.nonce) { headers['X-WP-Nonce'] = cfg.nonce; }
		fetch(cfg.root + 'doublescale/v1/knowledgebase/public/articles/' + encodeURIComponent(slug) + '/feedback', {
			method: 'POST', headers: headers, credentials: 'same-origin',
			body: JSON.stringify({ helpful: helpful })
		}).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
			.then(function () {
				var thanks = box.querySelector('.doublescale-kb-feedback__thanks');
				if (thanks) { thanks.hidden = false; }
			}).catch(function () {
				box.querySelectorAll('[data-kb-vote]').forEach(function (b) { b.disabled = false; });
			});
	});
})();
JS;

		wp_add_inline_script( 'doublescale-kb-feedback', $js );
	}
}
