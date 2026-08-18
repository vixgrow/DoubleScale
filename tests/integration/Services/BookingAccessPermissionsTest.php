<?php
/**
 * Booking read/manage permission checks for staff roles.
 *
 * @package DoubleScale\Tests\Integration\Services
 */

namespace DoubleScale\Tests\Integration\Services;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Booking\Capabilities;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Booking\Models\BookingHostsModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class BookingAccessPermissionsTest extends IntegrationTestCase {

	/** @var int */
	private $host_id;

	/** @var int */
	private $agent_id;

	/** @var int */
	private $calendar_id;

	/** @var int */
	private $booking_id;

	protected function setUp(): void {
		parent::setUp();

		// WP_UnitTestCase rolls each test back in a transaction, which leaves the
		// in-memory $wp_roles holding capabilities from a rolled-back state.
		// Rebuild it from the DB before syncing, or the sync writes onto a stale
		// role object and the agent silently ends up with no booking caps.
		$this->refresh_roles();
		Capabilities::sync_capabilities_for_user_roles();
		$this->refresh_roles();

		$this->host_id  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->agent_id = self::factory()->user->create( array( 'role' => UserRoles::BOOKING_AGENT ) );

		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars',
			array(
				'hash_id'    => wp_generate_password( 32, false, false ),
				'user_id'    => $this->host_id,
				'name'       => 'Host Calendar',
				'slug'       => 'host-cal-' . wp_generate_password( 6, false, false ),
				'status'     => 'active',
				'type'       => 'host',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$this->calendar_id = (int) $wpdb->insert_id;

		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_events',
			array(
				'hash_id'     => wp_generate_password( 32, false, false ),
				'calendar_id' => $this->calendar_id,
				'user_id'     => $this->host_id,
				'name'        => 'Test Event',
				'slug'        => 'test-event',
				'type'        => 'one-to-one',
				'status'      => 'active',
				'duration'    => 30,
				'created_at'  => current_time( 'mysql', true ),
				'updated_at'  => current_time( 'mysql', true ),
			)
		);
		$event_id = (int) $wpdb->insert_id;

		$wpdb->insert(
			$wpdb->prefix . 'doublescale_contacts',
			array(
				'email'      => 'guest@example.com',
				'first_name' => 'Guest',
				'last_name'  => 'User',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$contact_id = (int) $wpdb->insert_id;

		$wpdb->insert(
			$wpdb->prefix . 'doublescale_bookings',
			array(
				'hash_id'     => wp_generate_password( 32, false, false ),
				'event_id'    => $event_id,
				'calendar_id' => $this->calendar_id,
				'contact_id'  => $contact_id,
				'start_time'  => gmdate( 'Y-m-d H:i:s', strtotime( '+2 days' ) ),
				'end_time'    => gmdate( 'Y-m-d H:i:s', strtotime( '+2 days +30 minutes' ) ),
				'slot_time'   => 30,
				'status'      => 'scheduled',
				'created_at'  => current_time( 'mysql', true ),
				'updated_at'  => current_time( 'mysql', true ),
			)
		);
		$this->booking_id = (int) $wpdb->insert_id;
	}

	/**
	 * Drop the cached $wp_roles so it is rebuilt from the database.
	 *
	 * @return void
	 */
	private function refresh_roles(): void {
		global $wp_roles;
		$wp_roles = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		wp_roles();
	}

	public function test_host_owner_can_read_own_booking_despite_string_user_ids(): void {
		wp_set_current_user( $this->host_id );

		$booking = BookingModel::with( 'event', 'calendar', 'hosts' )->find( $this->booking_id );
		$this->assertIsInt( $booking->getOwnerUserId() );
		$this->assertTrue( $booking->userCanAccessAsStaff( $this->host_id ) );
		$this->assertTrue( Capabilities::can_read_booking( $this->booking_id ) );
	}

	public function test_assigned_team_host_can_read_booking(): void {
		$host_row             = new BookingHostsModel();
		$host_row->booking_id = $this->booking_id;
		$host_row->user_id    = $this->agent_id;
		$host_row->status     = 'scheduled';
		$host_row->save();

		wp_set_current_user( $this->agent_id );

		$this->assertTrue( Capabilities::can_read_booking( $this->booking_id ) );
	}

	public function test_unrelated_agent_cannot_read_booking(): void {
		$other_agent = self::factory()->user->create( array( 'role' => UserRoles::BOOKING_AGENT ) );
		wp_set_current_user( $other_agent );

		$this->assertFalse( Capabilities::can_read_booking( $this->booking_id ) );
	}
}
