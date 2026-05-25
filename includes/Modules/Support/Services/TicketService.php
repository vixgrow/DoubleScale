<?php
/**
 * TicketService — single orchestration point for every ticket state change.
 *
 * Every path that creates or mutates a ticket (REST controllers, IMAP poller
 * in Phase 3, WP-CLI commands) goes through this service so the canonical
 * domain events fire exactly once per change regardless of caller:
 *
 *   - doublescale_support_ticket_created    (Ticket $ticket)
 *   - doublescale_support_ticket_updated    (Ticket $ticket, array $updates, array $before)
 *   - doublescale_support_ticket_deleted    (int $ticket_id)
 *   - doublescale_support_reply_created     (Activity $activity, Ticket $ticket)
 *   - doublescale_support_note_created      (Activity $activity, Ticket $ticket)
 *
 * Conversations (replies + notes + system events) are stored as
 * `doublescale_activities` rows with `activity_type='support_reply'`,
 * `'support_note'`, or `'support_event'`, linked back to the ticket through
 * `doublescale_activity_associations` with `entity_type=3` (TICKET).
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Modules\Activities\Models\ActivityAssociationModel;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Support\Constants\TicketPriority;
use DoubleScale\Modules\Support\Constants\TicketStatus;
use DoubleScale\Modules\Support\Models\TicketModel;
use Illuminate\Database\Capsule\Manager as Capsule;
use WP_Error;

/**
 * TicketService class.
 */
class TicketService {

	/**
	 * Columns on `support_tickets` that are user-controllable through
	 * {@see update_ticket()}. Any other key in the $updates array is
	 * silently dropped to prevent mass-assignment surprises (e.g. someone
	 * trying to overwrite `hash` or `response_count` via the REST patch
	 * endpoint).
	 */
	private const UPDATABLE_COLUMNS = array(
		'title',
		'status',
		'priority',
		'mailbox_id',
		'agent_user_id',
		'product',
		'tag_ids',
		'custom_data',
	);

	/**
	 * @var ContactResolver
	 */
	private $contact_resolver;

	/**
	 * @param ContactResolver $contact_resolver Resolves email → ContactModel.
	 */
	public function __construct( ContactResolver $contact_resolver ) {
		$this->contact_resolver = $contact_resolver;
	}

	/**
	 * Create a ticket and its opening message in a single transaction.
	 *
	 * Required keys in $data:
	 *   - `title`            string  Ticket subject line.
	 *   - `content`          string  HTML body of the opening message.
	 *   - One of: `contact_id` int OR `email` string (+ optional first_name/last_name)
	 *
	 * Optional keys:
	 *   - `status`           string  Defaults to TicketStatus::OPEN.
	 *   - `priority`         string  Defaults to TicketPriority::NORMAL.
	 *   - `mailbox_id`       int     Routing channel.
	 *   - `agent_user_id`    int     Initial agent assignment.
	 *   - `product`          string  Free-text product label.
	 *   - `message_id`       string  Email Message-ID (set by IMAP path; web path leaves NULL).
	 *   - `content_hash`     string  MD5 of body (set by IMAP path for dedupe; web path leaves NULL).
	 *   - `source`           string  Where the opening message came from: 'web'|'email'. Default 'web'.
	 *   - `tag_ids`          int[]   Tag IDs.
	 *   - `custom_data`      array   Per-ticket custom field values.
	 *   - `author_user_id`   int     WP user creating on behalf of the customer (logged-in agent).
	 *
	 * @param array<string, mixed> $data Ticket fields + opening message body.
	 * @return TicketModel|WP_Error
	 */
	public function create_ticket( array $data ) {
		if ( empty( $data['title'] ) || ! is_string( $data['title'] ) ) {
			return new WP_Error( 'missing_title', __( 'Ticket title is required.', 'doublescale' ), array( 'status' => 400 ) );
		}
		$content = isset( $data['content'] ) ? (string) $data['content'] : '';
		if ( '' === trim( wp_strip_all_tags( $content ) ) ) {
			return new WP_Error( 'missing_content', __( 'Opening message content is required.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$contact = $this->resolve_contact( $data );
		if ( is_wp_error( $contact ) ) {
			return $contact;
		}

		$ticket_attrs = array(
			'title'         => $this->sanitize_title( $data['title'] ),
			'status'        => $this->normalize_status( $data['status'] ?? TicketStatus::OPEN ),
			'priority'      => $this->normalize_priority( $data['priority'] ?? TicketPriority::NORMAL ),
			'mailbox_id'    => isset( $data['mailbox_id'] ) ? (int) $data['mailbox_id'] : null,
			'contact_id'    => $contact->id,
			'agent_user_id' => isset( $data['agent_user_id'] ) ? (int) $data['agent_user_id'] : null,
			'product'       => isset( $data['product'] ) ? $this->sanitize_short_string( $data['product'] ) : null,
			'message_id'    => isset( $data['message_id'] ) ? (string) $data['message_id'] : null,
			'content_hash'  => isset( $data['content_hash'] ) ? (string) $data['content_hash'] : null,
			'tag_ids'       => $this->normalize_tag_ids( $data['tag_ids'] ?? null ),
			'custom_data'   => isset( $data['custom_data'] ) && is_array( $data['custom_data'] ) ? $data['custom_data'] : null,
		);

		$source         = $this->normalize_source( $data['source'] ?? 'web' );
		$author_user_id = $this->resolve_author_user_id( $data, $source );

		try {
			$ticket = Capsule::transaction(
				function () use ( $ticket_attrs, $content, $author_user_id, $source ) {
					$ticket = TicketModel::create( $ticket_attrs );

					// Opening message — always attributed to whoever wrote it.
					// For email source with no agent SENT match, author is NULL
					// (the customer wrote it; we don't fall back to the assigned
					// agent because the agent didn't author this message). For
					// web source, the logged-in user (typically an agent filing
					// on behalf of a customer) is credited.
					$this->record_conversation_activity(
						$ticket,
						ActivityTypes::SUPPORT_REPLY,
						array(
							'content' => $content,
							'source'  => $source,
						),
						$author_user_id
					);

					return $ticket;
				}
			);
		} catch ( \Throwable $e ) {
			doublescale_get_logger()->error(
				'Support ticket creation failed',
				array(
					'source'    => 'support-ticket-service',
					'exception' => $e->getMessage(),
					'file'      => $e->getFile(),
					'line'      => $e->getLine(),
				)
			);
			return new WP_Error( 'ticket_create_failed', $e->getMessage(), array( 'status' => 500 ) );
		}

		// Eager-load the relations listeners typically want so hooks can read
		// $ticket->contact / ->agent / ->mailbox without re-querying. We use
		// load() (not with()->find()) because we already hold the model — no
		// reason to re-SELECT the ticket row we just inserted.
		$ticket->load( array( 'contact', 'agent', 'mailbox' ) );

		/**
		 * Fires after a support ticket is created (including its opening message).
		 *
		 * @param TicketModel $ticket Newly created ticket with relations loaded.
		 */
		do_action( 'doublescale_support_ticket_created', $ticket );

		return $ticket;
	}

	/**
	 * Add a customer-visible reply to an existing ticket.
	 *
	 * Required keys in $data:
	 *   - `content` string HTML reply body.
	 *
	 * Optional keys:
	 *   - `source`         string  'web' (default) | 'email'.
	 *   - `message_id`     string  Outbound Message-ID for email pipeline.
	 *   - `in_reply_to`    string  Parent Message-ID (for email threading).
	 *   - `content_hash`   string  Set by IMAP path for inbound dedupe.
	 *   - `author_user_id` int     Agent posting. Defaults to current user.
	 *
	 * @param TicketModel|int      $ticket Ticket model or id.
	 * @param array<string, mixed> $data   Reply fields.
	 * @return ActivityModel|WP_Error
	 */
	public function add_reply( $ticket, array $data ) {
		$ticket = $this->resolve_ticket( $ticket );
		if ( is_wp_error( $ticket ) ) {
			return $ticket;
		}

		$content = isset( $data['content'] ) ? (string) $data['content'] : '';
		if ( '' === trim( wp_strip_all_tags( $content ) ) ) {
			return new WP_Error( 'missing_content', __( 'Reply content is required.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$source = $this->normalize_source( $data['source'] ?? 'web' );
		$author = $this->resolve_author_user_id( $data, $source );

		$activity_data = array(
			'content' => $content,
			'source'  => $source,
		);
		foreach ( array( 'message_id', 'in_reply_to', 'content_hash' ) as $key ) {
			if ( ! empty( $data[ $key ] ) ) {
				$activity_data[ $key ] = (string) $data[ $key ];
			}
		}

		try {
			$activity = Capsule::transaction(
				function () use ( $ticket, $activity_data, $author ) {
					$activity = $this->record_conversation_activity(
						$ticket,
						ActivityTypes::SUPPORT_REPLY,
						$activity_data,
						$author
					);

					// Replies AFTER the opening message bump the counter; the
					// opening message goes through `record_conversation_activity`
					// from `create_ticket()` without this call.
					$ticket->increment( 'response_count' );

					return $activity;
				}
			);
		} catch ( \Throwable $e ) {
			doublescale_get_logger()->error(
				'Support reply creation failed',
				array(
					'source'    => 'support-ticket-service',
					'exception' => $e->getMessage(),
					'ticket_id' => $ticket->id,
				)
			);
			return new WP_Error( 'reply_create_failed', $e->getMessage(), array( 'status' => 500 ) );
		}

		/**
		 * Fires when a customer-visible reply is added to a ticket.
		 *
		 * @param ActivityModel $activity The reply activity row.
		 * @param TicketModel   $ticket   The parent ticket.
		 */
		do_action( 'doublescale_support_reply_created', $activity, $ticket );

		return $activity;
	}

	/**
	 * Add an internal-only note to a ticket. Not visible to the customer.
	 *
	 * Required keys in $data:
	 *   - `content` string HTML note body.
	 *
	 * Optional keys:
	 *   - `author_user_id` int Agent posting. Defaults to current user.
	 *
	 * @param TicketModel|int      $ticket Ticket model or id.
	 * @param array<string, mixed> $data   Note fields.
	 * @return ActivityModel|WP_Error
	 */
	public function add_note( $ticket, array $data ) {
		$ticket = $this->resolve_ticket( $ticket );
		if ( is_wp_error( $ticket ) ) {
			return $ticket;
		}

		$content = isset( $data['content'] ) ? (string) $data['content'] : '';
		if ( '' === trim( wp_strip_all_tags( $content ) ) ) {
			return new WP_Error( 'missing_content', __( 'Note content is required.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$author = $this->resolve_author_user_id( $data, 'web' );

		try {
			$activity = $this->record_conversation_activity(
				$ticket,
				ActivityTypes::SUPPORT_NOTE,
				array(
					'content' => $content,
					'source'  => 'web',
				),
				$author
			);
		} catch ( \Throwable $e ) {
			doublescale_get_logger()->error(
				'Support note creation failed',
				array(
					'source'    => 'support-ticket-service',
					'exception' => $e->getMessage(),
					'ticket_id' => $ticket->id,
				)
			);
			return new WP_Error( 'note_create_failed', $e->getMessage(), array( 'status' => 500 ) );
		}

		/**
		 * Fires when an internal note is added to a ticket.
		 *
		 * @param ActivityModel $activity The note activity row.
		 * @param TicketModel   $ticket   The parent ticket.
		 */
		do_action( 'doublescale_support_note_created', $activity, $ticket );

		return $activity;
	}

	/**
	 * Update mutable ticket fields. Only keys in {@see self::UPDATABLE_COLUMNS}
	 * are applied; everything else is dropped. Empty deltas are no-ops (no
	 * event fires, no DB write).
	 *
	 * @param TicketModel|int      $ticket  Ticket model or id.
	 * @param array<string, mixed> $updates Field → new value map.
	 * @return TicketModel|WP_Error
	 */
	public function update_ticket( $ticket, array $updates ) {
		$ticket = $this->resolve_ticket( $ticket );
		if ( is_wp_error( $ticket ) ) {
			return $ticket;
		}

		$effective = array();
		$before    = array();
		foreach ( $updates as $key => $value ) {
			if ( ! in_array( $key, self::UPDATABLE_COLUMNS, true ) ) {
				continue;
			}
			$normalized = $this->normalize_update_value( $key, $value );
			$current    = $ticket->{$key};
			if ( $current === $normalized ) {
				continue; // No-op — value unchanged.
			}
			$effective[ $key ] = $normalized;
			// Snapshot the pre-save value while it's still readable from the
			// hydrated model. `getOriginal()` would also work, but reading
			// the attribute directly preserves the cast (e.g. `tag_ids` stays
			// an array on both sides of the comparison) so the listener sees
			// the same canonical shape on `from` and `to`.
			$before[ $key ] = $current;
		}

		if ( empty( $effective ) ) {
			return $ticket;
		}

		try {
			$ticket->fill( $effective )->save();
		} catch ( \Throwable $e ) {
			doublescale_get_logger()->error(
				'Support ticket update failed',
				array(
					'source'    => 'support-ticket-service',
					'exception' => $e->getMessage(),
					'ticket_id' => $ticket->id,
					'updates'   => array_keys( $effective ),
				)
			);
			return new WP_Error( 'ticket_update_failed', $e->getMessage(), array( 'status' => 500 ) );
		}

		/**
		 * Fires when a ticket's workflow state changes.
		 *
		 * @param TicketModel $ticket    The ticket after the update.
		 * @param array       $effective Only the keys that actually changed, with their new values.
		 * @param array       $before    Same keys, with their pre-save values, so listeners can log {from, to}.
		 */
		do_action( 'doublescale_support_ticket_updated', $ticket, $effective, $before );

		return $ticket;
	}

	/**
	 * Delete a ticket. The model's `deleting` boot event cascades to
	 * attachments and activity associations.
	 *
	 * @param TicketModel|int $ticket Ticket model or id.
	 * @return bool|WP_Error
	 */
	public function delete_ticket( $ticket ) {
		$ticket = $this->resolve_ticket( $ticket );
		if ( is_wp_error( $ticket ) ) {
			return $ticket;
		}
		$id = (int) $ticket->id;

		try {
			$ticket->delete();
		} catch ( \Throwable $e ) {
			doublescale_get_logger()->error(
				'Support ticket delete failed',
				array(
					'source'    => 'support-ticket-service',
					'exception' => $e->getMessage(),
					'ticket_id' => $id,
				)
			);
			return new WP_Error( 'ticket_delete_failed', $e->getMessage(), array( 'status' => 500 ) );
		}

		/**
		 * Fires after a ticket has been removed (post-cascade).
		 *
		 * @param int $ticket_id The id of the deleted ticket.
		 */
		do_action( 'doublescale_support_ticket_deleted', $id );

		return true;
	}

	/**
	 * Record a system-generated activity on the ticket timeline (status
	 * changes, assignments, etc.). Used by {@see ActivityLogger}.
	 *
	 * @param TicketModel|int $ticket    Ticket model or id.
	 * @param string          $event_key Short identifier — e.g. 'status_changed', 'assigned'. Stored in data.event_key.
	 * @param array           $data      Extra payload merged into activity.data.
	 * @param int|null        $user_id   Acting WP user; defaults to current user (NULL for system actions).
	 * @return ActivityModel|WP_Error
	 */
	public function log_event( $ticket, $event_key, array $data = array(), $user_id = null ) {
		$ticket = $this->resolve_ticket( $ticket );
		if ( is_wp_error( $ticket ) ) {
			return $ticket;
		}

		$payload = array_merge( $data, array( 'event_key' => (string) $event_key ) );

		return $this->record_conversation_activity(
			$ticket,
			ActivityTypes::SUPPORT_EVENT,
			$payload,
			null === $user_id ? $this->current_user_id_or_null() : (int) $user_id
		);
	}

	// ---------------------------------------------------------------------
	// Internals
	// ---------------------------------------------------------------------

	/**
	 * Persist the activity row + the ticket↔activity association in one place
	 * so every conversation entry (reply / note / event) has the same shape.
	 *
	 * @param TicketModel $ticket        Parent ticket.
	 * @param string      $activity_type ActivityTypes::SUPPORT_REPLY|SUPPORT_NOTE|SUPPORT_EVENT.
	 * @param array       $payload       Goes into activity.data. `ticket_id` is added automatically.
	 * @param int|null    $user_id       WP user id of the actor; null for system / customer-via-email.
	 * @return ActivityModel
	 */
	private function record_conversation_activity( TicketModel $ticket, $activity_type, array $payload, $user_id ) {
		$payload['ticket_id'] = $ticket->id;

		$activity = ActivityModel::create(
			array(
				'contact_id'    => $ticket->contact_id,
				'activity_type' => $activity_type,
				'data'          => $payload,
				'user_id'       => $user_id,
			)
		);

		ActivityAssociationModel::create(
			array(
				'activity_id' => $activity->id,
				'entity_type' => ActivityAssociationModel::ENTITY_TYPE_TICKET,
				'entity_id'   => $ticket->id,
			)
		);

		return $activity;
	}

	/**
	 * Resolve $data into a ContactModel. Either `contact_id` is provided
	 * directly, or `email` (+ optional name) is passed and the contact is
	 * looked up / created via {@see ContactResolver}.
	 *
	 * @param array $data Input array.
	 * @return \DoubleScale\Modules\Contacts\Models\ContactModel|WP_Error
	 */
	private function resolve_contact( array $data ) {
		if ( ! empty( $data['contact_id'] ) ) {
			$contact = \DoubleScale\Modules\Contacts\Models\ContactModel::find( (int) $data['contact_id'] );
			if ( ! $contact ) {
				return new WP_Error( 'contact_not_found', __( 'Contact not found.', 'doublescale' ), array( 'status' => 404 ) );
			}
			return $contact;
		}

		if ( empty( $data['email'] ) ) {
			return new WP_Error( 'missing_customer', __( 'Either contact_id or email is required.', 'doublescale' ), array( 'status' => 400 ) );
		}

		try {
			return $this->contact_resolver->find_or_create(
				$data['email'],
				$data['first_name'] ?? null,
				$data['last_name'] ?? null
			);
		} catch ( \InvalidArgumentException $e ) {
			return new WP_Error( 'invalid_email', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	private function resolve_ticket( $ticket ) {
		if ( $ticket instanceof TicketModel ) {
			return $ticket;
		}
		$found = TicketModel::find( (int) $ticket );
		if ( ! $found ) {
			return new WP_Error( 'ticket_not_found', __( 'Ticket not found.', 'doublescale' ), array( 'status' => 404 ) );
		}
		return $found;
	}

	private function normalize_status( $status ) {
		return TicketStatus::is_valid( (string) $status ) ? (string) $status : TicketStatus::OPEN;
	}

	private function normalize_priority( $priority ) {
		return TicketPriority::is_valid( (string) $priority ) ? (string) $priority : TicketPriority::NORMAL;
	}

	/**
	 * @param mixed $source Raw source string.
	 */
	private function normalize_source( $source ): string {
		$allowed = array( 'web', 'email', 'system', 'email_sent' );
		$source  = is_string( $source ) ? strtolower( $source ) : 'web';
		return in_array( $source, $allowed, true ) ? $source : 'web';
	}

	private function sanitize_title( $title ): string {
		return mb_substr( sanitize_text_field( (string) $title ), 0, 255 );
	}

	private function sanitize_short_string( $value ): string {
		return mb_substr( sanitize_text_field( (string) $value ), 0, 100 );
	}

	/**
	 * @param mixed $tag_ids Raw value from the caller.
	 * @return int[]|null
	 */
	private function normalize_tag_ids( $tag_ids ): ?array {
		if ( null === $tag_ids ) {
			return null;
		}
		if ( ! is_array( $tag_ids ) ) {
			return array();
		}
		$normalized = array_values( array_unique( array_filter( array_map( 'intval', $tag_ids ) ) ) );
		return $normalized;
	}

	/**
	 * Apply per-column normalization for {@see update_ticket()} so the
	 * comparison against the existing model value works against canonical
	 * forms (e.g. 'OPEN' → 'open', '5' → 5).
	 *
	 * @param string $key   Column name.
	 * @param mixed  $value Raw value.
	 * @return mixed Normalized value or null when the caller cleared it.
	 */
	private function normalize_update_value( $key, $value ) {
		switch ( $key ) {
			case 'status':
				return $this->normalize_status( $value );
			case 'priority':
				return $this->normalize_priority( $value );
			case 'mailbox_id':
			case 'agent_user_id':
				return null === $value || '' === $value ? null : (int) $value;
			case 'title':
				return $this->sanitize_title( $value );
			case 'product':
				return null === $value || '' === $value ? null : $this->sanitize_short_string( $value );
			case 'tag_ids':
				return $this->normalize_tag_ids( $value );
			case 'custom_data':
				return is_array( $value ) ? $value : null;
			default:
				return $value;
		}
	}

	/**
	 * Pick a sensible WP user id to credit on an activity:
	 *  - Web source: prefer explicit `author_user_id` → current logged-in user → NULL.
	 *  - Email source: caller (IMAP handler) sets `author_user_id` only when the
	 *    inbound is from an agent's SENT folder; otherwise NULL (customer reply).
	 *
	 * @param array  $data   Input.
	 * @param string $source Normalized source.
	 * @return int|null
	 */
	private function resolve_author_user_id( array $data, $source ) {
		if ( ! empty( $data['author_user_id'] ) ) {
			return (int) $data['author_user_id'];
		}
		if ( 'web' === $source ) {
			return $this->current_user_id_or_null();
		}
		return null;
	}

	private function current_user_id_or_null(): ?int {
		if ( ! function_exists( 'get_current_user_id' ) ) {
			return null;
		}
		$id = (int) get_current_user_id();
		return $id > 0 ? $id : null;
	}
}
