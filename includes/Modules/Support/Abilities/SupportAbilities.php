<?php
/**
 * Read-only support ticket abilities.
 *
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Abilities;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abilities\AbilityCategories;
use DoubleScale\Core\Abilities\AbilityResult;
use DoubleScale\Core\Abilities\AbilityScope;
use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Core\UserRoles\Permissions;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Support\Constants\TicketPriority;
use DoubleScale\Modules\Support\Constants\TicketStatus;
use DoubleScale\Modules\Support\Models\TicketModel;

/**
 * Support scoping is keyed on `agent_user_id`.
 *
 * Support roles hold no sales capabilities at all, so this module exercises a
 * permission path that shares nothing with Documents — which is exactly why it
 * is in the first phase.
 */
final class SupportAbilities {

	/**
	 * Ability definitions.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function definitions(): array {
		$permission = array( Permissions::class, 'has_support_access' );

		return array(
			'doublescale/list-tickets'        => array(
				'module_slug'      => 'support',
				'label'            => __( 'List support tickets', 'doublescale' ),
				'description'      => __( 'List support tickets with title, status, priority, contact, and assigned agent. Unless you can manage all tickets you see only tickets assigned to you — check get-context first.', 'doublescale' ),
				'category'         => AbilityCategories::SUPPORT,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'status'     => array(
							'type'        => 'string',
							'description' => 'Filter by ticket status.',
							'enum'        => TicketStatus::all(),
						),
						'priority'   => array(
							'type'        => 'string',
							'description' => 'Filter by priority.',
							'enum'        => TicketPriority::all(),
						),
						'contact_id' => array(
							'type'        => 'integer',
							'description' => 'Only tickets opened by this contact.',
						),
						'search'     => array(
							'type'        => 'string',
							'description' => 'Match on ticket title.',
						),
						'limit'      => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 100,
							'default' => 20,
						),
						'offset'     => array(
							'type'    => 'integer',
							'minimum' => 0,
							'default' => 0,
						),
					),
				),
				'execute_callback' => array( self::class, 'list_tickets' ),
			),

			'doublescale/get-ticket'          => array(
				'module_slug'      => 'support',
				'label'            => __( 'Get support ticket', 'doublescale' ),
				'description'      => __( 'One support ticket with its status, priority, contact, agent, and reply count.', 'doublescale' ),
				'category'         => AbilityCategories::SUPPORT,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'id' => array(
							'type'        => 'integer',
							'description' => 'Ticket id.',
						),
					),
					'required'   => array( 'id' ),
				),
				'execute_callback' => array( self::class, 'get_ticket' ),
			),

			'doublescale/get-ticket-thread'   => array(
				'module_slug'      => 'support',
				'label'            => __( 'Get ticket thread', 'doublescale' ),
				'description'      => __( 'Chronological replies, internal notes, and events on one ticket. Long message bodies are truncated — check the truncated flag before quoting one as complete.', 'doublescale' ),
				'category'         => AbilityCategories::SUPPORT,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'ticket_id' => array(
							'type'        => 'integer',
							'description' => 'Ticket id.',
						),
						'kinds'     => array(
							'type'        => 'array',
							'description' => 'Restrict to some entry kinds. Defaults to all.',
							'items'       => array(
								'type' => 'string',
								'enum' => array( 'reply', 'note', 'event' ),
							),
						),
						'limit'     => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 50,
							'default' => 25,
						),
					),
					'required'   => array( 'ticket_id' ),
				),
				'execute_callback' => array( self::class, 'get_ticket_thread' ),
			),

			'doublescale/get-support-summary' => array(
				'module_slug'      => 'support',
				'label'            => __( 'Get support summary', 'doublescale' ),
				'description'      => __( 'Ticket counts grouped by status and priority, scoped to what you can see. If your support scope is "own", these are your tickets only.', 'doublescale' ),
				'category'         => AbilityCategories::SUPPORT,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'group_by' => array(
							'type'        => 'string',
							'description' => 'Grouping dimension. Defaults to status.',
							'enum'        => array( 'status', 'priority' ),
						),
					),
				),
				'execute_callback' => array( self::class, 'get_support_summary' ),
			),
		);
	}

	/**
	 * Whether the caller sees every ticket or only their own.
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	private static function sees_all_tickets(): bool {
		return Permissions::can_manage_all_tickets();
	}

	/**
	 * List tickets, scoped by agent_user_id.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>
	 */
	public static function list_tickets( array $input ): array {
		$limit  = AbilityResult::limit( $input );
		$offset = AbilityResult::offset( $input );

		$query = TicketModel::query()->with( array( 'contact', 'agent' ) );

		if ( ! empty( $input['status'] ) ) {
			$query->where( 'status', (string) $input['status'] );
		}
		if ( ! empty( $input['priority'] ) ) {
			$query->where( 'priority', (string) $input['priority'] );
		}
		if ( ! empty( $input['contact_id'] ) ) {
			$query->where( 'contact_id', (int) $input['contact_id'] );
		}

		$search = isset( $input['search'] ) ? trim( (string) $input['search'] ) : '';
		if ( '' !== $search ) {
			$query->where( 'title', 'LIKE', '%' . $search . '%' );
		}

		// Applied LAST and unconditionally, so no caller-supplied filter can
		// widen it. Mirrors RestTicketController's scope clause.
		AbilityScope::apply( $query, 'agent_user_id', self::sees_all_tickets() );

		$total = (int) $query->count();

		$rows = $query->orderBy( 'created_at', 'desc' )
			->limit( $limit )
			->offset( $offset )
			->get();

		$items = array();
		foreach ( $rows as $row ) {
			$items[] = self::shape_ticket( $row );
		}

		return AbilityResult::collection(
			$items,
			$total,
			$limit,
			$offset,
			array( 'scope' => AbilityScope::label( self::sees_all_tickets() ) )
		);
	}

	/**
	 * Get one ticket.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|\WP_Error
	 */
	public static function get_ticket( array $input ) {
		$ticket = self::resolve_ticket( isset( $input['id'] ) ? (int) $input['id'] : 0 );
		if ( is_wp_error( $ticket ) ) {
			return $ticket;
		}

		return self::shape_ticket( $ticket );
	}

	/**
	 * Get the conversation thread for one ticket.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|\WP_Error
	 */
	public static function get_ticket_thread( array $input ) {
		$ticket = self::resolve_ticket( isset( $input['ticket_id'] ) ? (int) $input['ticket_id'] : 0 );
		if ( is_wp_error( $ticket ) ) {
			return $ticket;
		}

		$limit = AbilityResult::limit( $input, 25, 50 );
		$types = self::resolve_kinds( $input['kinds'] ?? null );

		$query = ActivityModel::forTicket( $ticket->id )
			->whereIn( 'activity_type', $types )
			->with( 'user' );

		$total = (int) $query->count();

		$rows = $query->orderBy( 'activity_date', 'desc' )
			->limit( $limit )
			->get();

		$items = array();
		foreach ( $rows as $row ) {
			$body = self::extract_body( $row );

			$items[] = array(
				'id'        => (int) $row->id,
				'kind'      => self::kind_for_type( (string) $row->activity_type ),
				'author'    => is_object( $row->user ?? null ) ? $row->user->display_name : null,
				'date'      => $row->activity_date,
				'body'      => $body['text'],
				'truncated' => $body['truncated'],
			);
		}

		// Oldest first reads better as a conversation.
		$items = array_reverse( $items );

		return array(
			'ticket_id' => (int) $ticket->id,
			'title'     => self::decode_subject( (string) $ticket->title ),
			'items'     => $items,
			'total'     => $total,
			'limit'     => $limit,
			'has_more'  => $total > count( $items ),
		);
	}

	/**
	 * Ticket counts grouped by status or priority.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>
	 */
	public static function get_support_summary( array $input ): array {
		$group_by = isset( $input['group_by'] ) && 'priority' === $input['group_by'] ? 'priority' : 'status';

		$query = TicketModel::query();

		AbilityScope::apply( $query, 'agent_user_id', self::sees_all_tickets() );

		$counts = array();
		$total  = 0;

		foreach ( $query->get() as $row ) {
			$key = (string) $row->{$group_by};
			if ( ! isset( $counts[ $key ] ) ) {
				$counts[ $key ] = 0;
			}
			++$counts[ $key ];
			++$total;
		}

		return array(
			'group_by' => $group_by,
			'total'    => $total,
			'groups'   => $counts,
			'scope'    => AbilityScope::label( self::sees_all_tickets() ),
		);
	}

	/**
	 * Load a ticket and enforce Gate 3.
	 *
	 * @since 1.0.0
	 *
	 * @param int $id Ticket id.
	 * @return TicketModel|\WP_Error
	 */
	private static function resolve_ticket( int $id ) {
		if ( $id <= 0 ) {
			return AbilityResult::not_found( __( 'Provide a valid ticket id.', 'doublescale' ) );
		}

		$ticket = TicketModel::query()->with( array( 'contact', 'agent' ) )->where( 'id', $id )->first();
		if ( ! $ticket ) {
			return AbilityResult::not_found( __( 'No ticket found with that id.', 'doublescale' ) );
		}

		$forbidden = AbilityScope::assert_owns(
			$ticket,
			'agent_user_id',
			self::sees_all_tickets(),
			__( 'This ticket is not assigned to you.', 'doublescale' )
		);
		if ( $forbidden ) {
			return $forbidden;
		}

		return $ticket;
	}

	/**
	 * Map requested kind names to activity types.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $kinds Requested kinds.
	 * @return array<int, string>
	 */
	private static function resolve_kinds( $kinds ): array {
		$map = self::kind_map();

		if ( ! is_array( $kinds ) || array() === $kinds ) {
			return array_values( $map );
		}

		$allowed = array();
		foreach ( $kinds as $kind ) {
			$kind = strtolower( trim( (string) $kind ) );
			if ( isset( $map[ $kind ] ) ) {
				$allowed[] = $map[ $kind ];
			}
		}

		return array() === $allowed ? array_values( $map ) : $allowed;
	}

	/**
	 * Kind name => activity type.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, string>
	 */
	private static function kind_map(): array {
		return array(
			'reply' => ActivityTypes::SUPPORT_REPLY,
			'note'  => ActivityTypes::SUPPORT_NOTE,
			'event' => ActivityTypes::SUPPORT_EVENT,
		);
	}

	/**
	 * Activity type => kind name.
	 *
	 * @since 1.0.0
	 *
	 * @param string $type Activity type.
	 * @return string
	 */
	private static function kind_for_type( string $type ): string {
		$flipped = array_flip( self::kind_map() );
		return $flipped[ $type ] ?? 'event';
	}

	/**
	 * Pull the human-readable body out of an activity's data payload.
	 *
	 * @since 1.0.0
	 *
	 * @param object $activity Activity row.
	 * @return array{text: string, truncated: bool}
	 */
	private static function extract_body( $activity ): array {
		$data = $activity->data ?? array();
		if ( is_string( $data ) ) {
			$data = json_decode( $data, true );
		}
		if ( ! is_array( $data ) ) {
			$data = array();
		}

		$body = '';
		foreach ( array( 'content', 'message', 'body', 'note', 'description' ) as $key ) {
			if ( ! empty( $data[ $key ] ) && is_string( $data[ $key ] ) ) {
				$body = $data[ $key ];
				break;
			}
		}

		return AbilityResult::truncate( $body );
	}

	/**
	 * Decode an RFC 2047 encoded-word subject line.
	 *
	 * Tickets created from inbound email store the raw header, so a non-ASCII
	 * subject reaches us as "=?UTF-8?B?...?=". Passing that through would give
	 * an agent an unreadable title it cannot match, summarise, or quote back.
	 *
	 * @since 1.0.0
	 *
	 * @param string $subject Stored ticket title.
	 * @return string
	 */
	private static function decode_subject( string $subject ): string {
		if ( '' === $subject || false === strpos( $subject, '=?' ) ) {
			return $subject;
		}
		if ( ! function_exists( 'mb_decode_mimeheader' ) ) {
			return $subject;
		}

		$decoded = mb_decode_mimeheader( $subject );

		return '' !== trim( $decoded ) ? $decoded : $subject;
	}

	/**
	 * Shape a ticket row.
	 *
	 * @since 1.0.0
	 *
	 * @param object $ticket Ticket.
	 * @return array<string, mixed>
	 */
	private static function shape_ticket( $ticket ): array {
		$contact = $ticket->contact ?? null;
		$agent   = $ticket->agent ?? null;

		$contact_name = '';
		if ( is_object( $contact ) ) {
			$contact_name = trim( (string) $contact->first_name . ' ' . (string) $contact->last_name );
			if ( '' === $contact_name ) {
				$contact_name = (string) $contact->email;
			}
		}

		return array(
			'id'             => (int) $ticket->id,
			'title'          => self::decode_subject( (string) $ticket->title ),
			'status'         => $ticket->status,
			'priority'       => $ticket->priority,
			'contact'        => is_object( $contact )
				? array(
					'id'    => (int) $contact->id,
					'name'  => $contact_name,
					'email' => $contact->email,
				)
				: null,
			'agent'          => is_object( $agent )
				? array(
					'id'   => (int) $ticket->agent_user_id,
					'name' => $agent->display_name,
				)
				: null,
			'response_count' => (int) $ticket->response_count,
			'created_at'     => $ticket->created_at,
		);
	}
}
