<?php
/**
 * Read-only activity timeline abilities.
 *
 * @package DoubleScale\Modules\Activities
 */

namespace DoubleScale\Modules\Activities\Abilities;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abilities\AbilityCategories;
use DoubleScale\Core\Abilities\AbilityResult;
use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Core\UserRoles\Permissions;
use DoubleScale\Modules\Activities\Services\ActivityManager;

/**
 * "What happened with this customer" is the question the timeline answers, and
 * it is the one an agent gets asked constantly.
 *
 * These delegate to {@see ActivityManager::get_unified_timeline()} rather than
 * querying the table: that method already merges tasks into the stream and runs
 * its own deal/project access checks, so reimplementing it here would mean
 * maintaining two versions of the same authorisation logic.
 *
 * The `activities` module is never toggleable, so Gate 1 always passes; Gate 2
 * defers to contact-read access because a timeline is only ever read in the
 * context of a contact.
 */
final class ActivityAbilities {

	/**
	 * Ability definitions.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function definitions(): array {
		$permission = array( Permissions::class, 'can_read_contacts' );

		return array(
			'doublescale/get-contact-timeline' => array(
				'module_slug'      => 'activities',
				'label'            => __( 'Get contact timeline', 'doublescale' ),
				'description'      => __( 'Everything that has happened with one contact in chronological order — notes, calls, emails, meetings, and tasks. This is the fastest way to answer "what is going on with this customer".', 'doublescale' ),
				'category'         => AbilityCategories::CONTACTS,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'contact_id' => array(
							'type'        => 'integer',
							'description' => 'Contact id. Use list-contacts to find one.',
						),
						'date_from'  => array(
							'type'        => 'string',
							'description' => 'Inclusive lower bound, YYYY-MM-DD.',
						),
						'date_to'    => array(
							'type'        => 'string',
							'description' => 'Inclusive upper bound, YYYY-MM-DD.',
						),
						'limit'      => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 50,
							'default' => 20,
						),
					),
					'required'   => array( 'contact_id' ),
				),
				'execute_callback' => array( self::class, 'get_contact_timeline' ),
			),

			'doublescale/list-activity-types'  => array(
				'module_slug'      => 'activities',
				'label'            => __( 'List activity types', 'doublescale' ),
				'description'      => __( 'The activity type vocabulary, split into types a person can author (notes, calls, meetings) and types the system generates automatically.', 'doublescale' ),
				'category'         => AbilityCategories::CONTACTS,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => new \stdClass(),
				),
				'execute_callback' => array( self::class, 'list_activity_types' ),
			),
		);
	}

	/**
	 * Timeline for one contact.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|\WP_Error
	 */
	public static function get_contact_timeline( array $input ) {
		$contact_id = isset( $input['contact_id'] ) ? (int) $input['contact_id'] : 0;
		if ( $contact_id <= 0 ) {
			return AbilityResult::not_found( __( 'Provide a valid contact id.', 'doublescale' ) );
		}

		$limit = AbilityResult::limit( $input, 20, 50 );

		$filters = array( 'contact_id' => $contact_id );
		if ( ! empty( $input['date_from'] ) ) {
			$filters['date_from'] = (string) $input['date_from'];
		}
		if ( ! empty( $input['date_to'] ) ) {
			$filters['date_to'] = (string) $input['date_to'];
		}

		$timeline = ActivityManager::instance()->get_unified_timeline( $filters, $limit, 1 );

		$rows = is_array( $timeline['data'] ?? null ) ? $timeline['data'] : array();
		$meta = is_array( $timeline['meta'] ?? null ) ? $timeline['meta'] : array();

		// The service reports permission refusals through meta.error rather than
		// throwing, so surface that as a real refusal instead of "no results".
		if ( ! empty( $meta['error'] ) ) {
			return AbilityResult::forbidden(
				__( 'You do not have permission to view this timeline.', 'doublescale' )
			);
		}

		$items = array();
		foreach ( $rows as $row ) {
			$items[] = self::shape_entry( $row );
		}

		return array(
			'contact_id' => $contact_id,
			'items'      => $items,
			'total'      => (int) ( $meta['total'] ?? count( $items ) ),
			'limit'      => $limit,
			'has_more'   => (int) ( $meta['total'] ?? 0 ) > count( $items ),
		);
	}

	/**
	 * The activity type vocabulary.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>
	 */
	public static function list_activity_types( array $input ): array {
		unset( $input );

		return array(
			'editable_types' => ActivityTypes::get_editable_types(),
			'system_types'   => ActivityTypes::get_system_types(),
			'note'           => __( 'Editable types are authored by people; system types are generated automatically by the CRM and are not written by hand.', 'doublescale' ),
		);
	}

	/**
	 * Shape one timeline entry.
	 *
	 * Rows arrive from a UNION query, so they are plain objects/arrays whose
	 * shape differs between activities and tasks — read defensively.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $row Timeline row.
	 * @return array<string, mixed>
	 */
	private static function shape_entry( $row ): array {
		$data = is_object( $row ) ? get_object_vars( $row ) : (array) $row;

		// The service already renders a human sentence ("Someone linked invoice
		// INV-000001 to this deal"). Prefer it over the raw payload: it is what
		// a reader would recognise, and the `data` column is a per-type blob
		// that means nothing without knowing the type.
		$body = '';
		foreach ( array( 'formatted_message', 'title', 'content', 'description' ) as $key ) {
			if ( ! empty( $data[ $key ] ) && is_string( $data[ $key ] ) ) {
				$body = $data[ $key ];
				break;
			}
		}

		if ( '' === $body && ! empty( $data['data'] ) ) {
			$payload = is_array( $data['data'] ) ? $data['data'] : array();
			if ( ! empty( $payload['title'] ) && is_string( $payload['title'] ) ) {
				$body = $payload['title'];
			}
		}

		$shaped = AbilityResult::truncate( $body, 500 );

		$author = $data['user'] ?? null;

		return array(
			'id'        => isset( $data['id'] ) ? (int) $data['id'] : null,
			'kind'      => $data['item_type'] ?? 'activity',
			'type'      => $data['activity_type'] ?? null,
			'date'      => $data['activity_date'] ?? $data['created_at'] ?? null,
			'author'    => is_array( $author ) ? ( $author['display_name'] ?? null ) : ( is_object( $author ) ? ( $author->display_name ?? null ) : null ),
			'system'    => ! empty( $data['is_system'] ),
			'summary'   => $shaped['text'],
			'truncated' => $shaped['truncated'],
		);
	}
}
