<?php
/**
 * Insert booking event rows directly into wp_doublescale_booking_events.
 *
 * @package DoubleScale\Tests\Integration\Factories
 */

namespace DoubleScale\Tests\Integration\Factories;

/**
 * @see /includes/Modules/Booking/Migrations/EventsTable.php
 */
final class BookingEventFactory {

	/**
	 * @param array<string, mixed> $overrides
	 * @return int Inserted event ID.
	 */
	public static function create( array $overrides = array() ) {
		global $wpdb;

		$slug = 'event-' . wp_generate_password( 6, false, false );

		$defaults = array(
			'hash_id'           => wp_generate_password( 32, false, false ),
			'calendar_id'       => 1,
			'user_id'           => 1,
			'name'              => 'Test Event',
			'slug'              => $slug,
			'status'            => 'active',
			'type'              => 'one-to-one',
			'is_disabled'       => 0,
			'duration'          => 30,
			'color'             => '#0099ff',
			'visibility'        => 'public',
			'availability_type' => 'existing',
			'created_at'        => current_time( 'mysql', true ),
			'updated_at'        => current_time( 'mysql', true ),
		);

		$data = array_merge( $defaults, $overrides );

		$wpdb->insert( $wpdb->prefix . 'doublescale_booking_events', $data );

		return (int) $wpdb->insert_id;
	}
}
