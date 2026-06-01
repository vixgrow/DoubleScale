<?php
/**
 * Outbound email notifications for the support module (Free).
 *
 * Subscribes to the ticket-lifecycle hooks emitted by {@see TicketService} and
 * sends the matching customer-facing email through {@see Emails::send()} (which
 * the SMTP module intercepts). This is the *outbound* half of the email
 * pipeline — the inbound IMAP/MTA engine that creates tickets FROM email is a
 * Pro feature and lives elsewhere.
 *
 * Sender identity: support mail uses the CRM's shared identity resolver
 * ({@see EmailIdentityResolver}) — the replying agent's personal connected
 * email when they have one, else the team's shared email, else the WP admin
 * address — the SAME chain the Inbox and Booking notifiers use. The support
 * mailbox is a routing/queue construct only and does NOT supply the From
 * identity, so an operator configures the sender once (CRM mailbox / SMTP
 * settings) rather than per support channel.
 *
 * Reliability: every listener is wrapped so a broken SMTP transport can never
 * abort the REST request that triggered it (an agent's reply must still be
 * saved even if the notification email fails). Failures are logged through
 * `doublescale_get_logger()` with `source='support-email-notifications'`.
 *
 * Design reference: {@see \DoubleScale\Modules\Booking\Services\EmailNotifications}.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Communication\EmailIdentityResolver;
use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Emails\Emails;
use DoubleScale\Modules\Support\Constants\TicketStatus;
use DoubleScale\Modules\Support\Models\TicketModel;

/**
 * EmailNotifications class.
 */
final class EmailNotifications {

	/**
	 * Default per-event toggle state. An operator can override each key under
	 * `doublescale_settings['support']['notifications']`; anything not present
	 * defaults to enabled so a fresh install emails out of the box.
	 *
	 * @var array<string, bool>
	 */
	private const NOTIFICATION_DEFAULTS = array(
		'ticket_created_to_customer' => true,
		'reply_to_customer'          => true,
		'status_change_to_customer'  => true,
	);

	/**
	 * Wire the hook listeners.
	 */
	public function __construct() {
		add_action( 'doublescale_support_ticket_created', array( $this, 'on_ticket_created' ), 10, 1 );
		add_action( 'doublescale_support_reply_created', array( $this, 'on_reply_created' ), 10, 2 );
		add_action( 'doublescale_support_ticket_updated', array( $this, 'on_ticket_updated' ), 10, 3 );
	}

	// ---------------------------------------------------------------------
	// Hook listeners
	// ---------------------------------------------------------------------

	/**
	 * Ticket opened → confirmation email to the customer.
	 *
	 * @param TicketModel $ticket Newly created ticket.
	 * @return void
	 */
	public function on_ticket_created( $ticket ): void {
		if ( ! $this->is_enabled( 'ticket_created_to_customer' ) ) {
			return;
		}
		$this->safely(
			$ticket,
			function ( TicketModel $t ) {
				$email = $this->customer_email( $t );
				if ( '' === $email ) {
					return;
				}

				/* translators: %s — ticket title. */
				$subject = sprintf( __( 'We received your request: %s', 'doublescale' ), $t->title );
				$body    = $this->wrap_body(
					$t,
					sprintf(
						/* translators: 1: customer first name, 2: ticket title. */
						__( 'Hi %1$s, thanks for reaching out. We have opened a support ticket for "%2$s" and will reply soon.', 'doublescale' ),
						$this->customer_first_name( $t ),
						$t->title
					)
				);

				$this->dispatch( $t, $email, $subject, $body, $this->assignee_user_id( $t ) );
			}
		);
	}

	/**
	 * Agent reply → email the customer.
	 *
	 * Only fires for AGENT replies: a reply activity carries a `user_id` when an
	 * agent authored it and NULL when the customer did (the portal forces
	 * `author_user_id = null`). Emailing on a NULL-author reply would send the
	 * customer their own message back.
	 *
	 * @param mixed       $activity The reply activity row (ActivityModel).
	 * @param TicketModel $ticket   The parent ticket.
	 * @return void
	 */
	public function on_reply_created( $activity, $ticket ): void {
		if ( ! $this->is_enabled( 'reply_to_customer' ) ) {
			return;
		}
		// Customer-authored reply (no agent user_id) — nothing to send outward.
		if ( ! is_object( $activity ) || empty( $activity->user_id ) ) {
			return;
		}

		$this->safely(
			$ticket,
			function ( TicketModel $t ) use ( $activity ) {
				$email = $this->customer_email( $t );
				if ( '' === $email ) {
					return;
				}

				$data    = is_array( $activity->data ) ? $activity->data : array();
				$content = isset( $data['content'] ) ? (string) $data['content'] : '';

				/* translators: %s — ticket title. */
				$subject = sprintf( __( 'Re: %s', 'doublescale' ), $t->title );
				$body    = $this->wrap_body( $t, $content );

				// Send AS the agent who authored the reply (personal identity),
				// falling through to shared/admin when they have none.
				$this->dispatch( $t, $email, $subject, $body, (int) $activity->user_id );
			}
		);
	}

	/**
	 * Status moved to resolved/closed → notify the customer.
	 *
	 * Only the status transition is emailed; other field changes (priority,
	 * agent reassignment) are agent-internal and produce no customer mail here.
	 *
	 * @param TicketModel $ticket    Ticket after the update.
	 * @param array       $effective Keys that changed, with new values.
	 * @param array       $before    Same keys, with pre-save values.
	 * @return void
	 */
	public function on_ticket_updated( $ticket, $effective, $before ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $before is required by the 3-arg hook signature; only the new value ($effective) is needed here.
		if ( ! $this->is_enabled( 'status_change_to_customer' ) ) {
			return;
		}
		if ( ! is_array( $effective ) || ! array_key_exists( 'status', $effective ) ) {
			return;
		}
		$new_status = (string) $effective['status'];
		if ( ! in_array( $new_status, array( TicketStatus::RESOLVED, TicketStatus::CLOSED ), true ) ) {
			return;
		}

		$this->safely(
			$ticket,
			function ( TicketModel $t ) use ( $new_status ) {
				$email = $this->customer_email( $t );
				if ( '' === $email ) {
					return;
				}

				$label = TicketStatus::get_label( $new_status );
				/* translators: 1: ticket title, 2: status label (Resolved/Closed). */
				$subject = sprintf( __( 'Your ticket "%1$s" was marked %2$s', 'doublescale' ), $t->title, $label );
				$body    = $this->wrap_body(
					$t,
					sprintf(
						/* translators: 1: customer first name, 2: status label. */
						__( 'Hi %1$s, your support ticket has been marked %2$s. Reply to this email if you still need help and we will re-open it.', 'doublescale' ),
						$this->customer_first_name( $t ),
						$label
					)
				);

				$this->dispatch( $t, $email, $subject, $body, $this->assignee_user_id( $t ) );
			}
		);
	}

	// ---------------------------------------------------------------------
	// Send
	// ---------------------------------------------------------------------

	/**
	 * Build an {@see Emails} instance with the CRM sender identity and send.
	 *
	 * @param TicketModel $ticket        Ticket (for logging context).
	 * @param string      $to            Recipient email.
	 * @param string      $subject       Subject line.
	 * @param string      $body          HTML body.
	 * @param int|null    $agent_user_id WP user id whose identity to send as
	 *                                   (the replying agent, or the assignee for
	 *                                   system notices). NULL → shared/admin.
	 * @return void
	 */
	private function dispatch( TicketModel $ticket, string $to, string $subject, string $body, ?int $agent_user_id = null ): void {
		$identity = $this->sender_identity( $agent_user_id );

		$emails               = new Emails();
		$emails->from_address = $identity['from_address'];
		$emails->from_name    = $identity['from_name'];
		$emails->reply_to     = $identity['reply_to'];

		$result = $emails->send( $to, $subject, $body );

		if ( $result ) {
			doublescale_get_logger()->info(
				'Support notification email sent',
				array(
					'source'    => 'support-email-notifications',
					'recipient' => $to,
					'subject'   => $subject,
					'ticket_id' => (int) $ticket->id,
				)
			);
		} else {
			doublescale_get_logger()->warning(
				'Failed to send support notification email',
				array(
					'source'    => 'support-email-notifications',
					'recipient' => $to,
					'subject'   => $subject,
					'ticket_id' => (int) $ticket->id,
				)
			);
		}
	}

	/**
	 * Resolve the From / Reply-To via the CRM's shared identity resolver.
	 *
	 * Delegates entirely to {@see EmailIdentityResolver::resolve()} so support
	 * mail uses the SAME sender identity as the rest of the CRM (Inbox, Booking):
	 *
	 *   1. The given agent's personal connected email (Settings → Mailbox →
	 *      personal `doublescale_user_email_account`), when they have one enabled.
	 *   2. The team's shared email (`email_inbound.from_email`).
	 *   3. The WordPress admin email.
	 *
	 * The support mailbox is a routing/queue construct only — it no longer
	 * contributes the From identity. This keeps one consistent sender across the
	 * whole product and means an operator configures the sender ONCE (in the CRM
	 * mailbox / SMTP settings) rather than per support channel.
	 *
	 * @param int|null $agent_user_id Replying agent (or ticket assignee for
	 *                                system notices); NULL for a pure shared send.
	 * @return array{from_address: string, from_name: string, reply_to: string}
	 */
	private function sender_identity( ?int $agent_user_id ): array {
		return EmailIdentityResolver::resolve( $agent_user_id );
	}

	// ---------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------

	/**
	 * Whether a given notification event is enabled.
	 *
	 * @param string $key Event key (see NOTIFICATION_DEFAULTS).
	 * @return bool
	 */
	private function is_enabled( string $key ): bool {
		$support = Settings::get( 'support', array() );
		$support = is_array( $support ) ? $support : array();
		$toggles = isset( $support['notifications'] ) && is_array( $support['notifications'] )
			? $support['notifications']
			: array();

		if ( array_key_exists( $key, $toggles ) ) {
			return (bool) $toggles[ $key ];
		}
		return self::NOTIFICATION_DEFAULTS[ $key ] ?? false;
	}

	/**
	 * The ticket's assigned agent WP user id, or NULL when unassigned.
	 *
	 * Used as the sender identity for system notices (ticket created, status
	 * change) that aren't authored by a specific agent — the assignee is the
	 * closest "human" to send as. {@see EmailIdentityResolver} degrades to the
	 * shared/admin identity when this is NULL.
	 *
	 * @param TicketModel $ticket Ticket.
	 * @return int|null
	 */
	private function assignee_user_id( TicketModel $ticket ): ?int {
		$agent_id = (int) $ticket->agent_user_id;
		return $agent_id > 0 ? $agent_id : null;
	}

	/**
	 * The ticket customer's email, or '' when unresolvable.
	 *
	 * @param TicketModel $ticket Ticket.
	 * @return string
	 */
	private function customer_email( TicketModel $ticket ): string {
		$contact = $ticket->contact;
		if ( $contact && is_email( (string) $contact->email ) ) {
			return (string) $contact->email;
		}
		return '';
	}

	/**
	 * The customer's first name, or a neutral greeting fallback.
	 *
	 * @param TicketModel $ticket Ticket.
	 * @return string
	 */
	private function customer_first_name( TicketModel $ticket ): string {
		$contact = $ticket->contact;
		$first   = $contact ? trim( (string) $contact->first_name ) : '';
		return '' !== $first ? $first : __( 'there', 'doublescale' );
	}

	/**
	 * Wrap message content in a minimal HTML shell.
	 *
	 * Kept intentionally simple — the booking module renders richer templated
	 * emails; support's outbound is plain so it reads well in any client. The
	 * content is already `wp_kses_post`-sanitised upstream by TicketService.
	 *
	 * @param TicketModel $ticket Ticket (reserved for future templating / footer).
	 * @param string      $inner  Inner HTML/body content.
	 * @return string
	 */
	private function wrap_body( TicketModel $ticket, string $inner ): string {
		unset( $ticket ); // Reserved for a future per-mailbox footer; not used yet.
		return '<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#1f2937;">'
			. $inner
			. '</div>';
	}

	/**
	 * Run a send closure guarded against a broken mailer.
	 *
	 * A thrown exception is logged and swallowed so it cannot bubble up and
	 * abort the ticket REST request that fired the lifecycle hook.
	 *
	 * @param mixed    $ticket Expected TicketModel; ignored if not.
	 * @param callable $send   Closure receiving the TicketModel.
	 * @return void
	 */
	private function safely( $ticket, callable $send ): void {
		if ( ! ( $ticket instanceof TicketModel ) ) {
			return;
		}
		try {
			$send( $ticket );
		} catch ( \Throwable $e ) {
			doublescale_get_logger()->error(
				'Support email notification failed',
				array(
					'source'    => 'support-email-notifications',
					'ticket_id' => (int) $ticket->id,
					'exception' => $e->getMessage(),
					'file'      => $e->getFile(),
					'line'      => $e->getLine(),
				)
			);
		}
	}
}
