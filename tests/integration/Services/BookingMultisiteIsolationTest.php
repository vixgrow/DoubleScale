<?php
/**
 * Booking multisite isolation — list/detail REST must not expose rows owned by
 * users who are not members of the current site (simulated via test filters).
 *
 * @package DoubleScale\Tests\Integration\Services
 */

namespace DoubleScale\Tests\Integration\Services;

use DoubleScale\Modules\Booking\Capabilities;
use DoubleScale\Modules\Booking\Helpers\MultisiteScope;
use DoubleScale\Modules\Booking\Services\BookingProvisioner;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group booking
 */
final class BookingMultisiteIsolationTest extends IntegrationTestCase {

	/** @var int */
	private $child_admin_id;

	/** @var int */
	private $foreign_host_id;

	/** @var int */
	private $foreign_calendar_id;

	/** @var int */
	private $foreign_booking_id;

	protected function setUp(): void {
		parent::setUp();

		$this->refresh_roles();
		Capabilities::sync_capabilities_for_user_roles();
		Capabilities::register_multisite_hooks();
		$this->refresh_roles();

		$this->child_admin_id  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->foreign_host_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		global $wpdb;

		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars',
			array(
				'hash_id'    => wp_generate_password( 32, false, false ),
				'user_id'    => $this->foreign_host_id,
				'name'       => 'Foreign Host Calendar',
				'slug'       => 'foreign-host-' . wp_generate_password( 6, false, false ),
				'status'     => 'active',
				'type'       => 'host',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$this->foreign_calendar_id = (int) $wpdb->insert_id;

		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_events',
			array(
				'hash_id'     => wp_generate_password( 32, false, false ),
				'calendar_id' => $this->foreign_calendar_id,
				'user_id'     => $this->foreign_host_id,
				'name'        => 'Foreign Event',
				'slug'        => 'foreign-event',
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
				'email'      => 'foreign-guest@example.test',
				'first_name' => 'Foreign',
				'last_name'  => 'Guest',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$contact_id = (int) $wpdb->insert_id;

		$wpdb->insert(
			$wpdb->prefix . 'doublescale_bookings',
			array(
				'hash_id'     => wp_generate_password( 32, false, false ),
				'calendar_id' => $this->foreign_calendar_id,
				'event_id'    => $event_id,
				'contact_id'  => $contact_id,
				'start_time'  => gmdate( 'Y-m-d H:i:s', strtotime( '+1 day' ) ),
				'end_time'    => gmdate( 'Y-m-d H:i:s', strtotime( '+1 day +30 minutes' ) ),
				'slot_time'   => 30,
				'status'      => 'scheduled',
				'created_at'  => current_time( 'mysql', true ),
				'updated_at'  => current_time( 'mysql', true ),
			)
		);
		$this->foreign_booking_id = (int) $wpdb->insert_id;

		MultisiteScope::reset_cache_for_tests();
		add_filter( 'doublescale_booking_multisite_scope_active', static fn() => true );
		add_filter(
			'doublescale_booking_multisite_member_user_ids',
			function () {
				return array( $this->child_admin_id );
			}
		);
	}

	protected function tearDown(): void {
		remove_all_filters( 'doublescale_booking_multisite_scope_active' );
		remove_all_filters( 'doublescale_booking_multisite_member_user_ids' );
		MultisiteScope::reset_cache_for_tests();
		parent::tearDown();
	}

	private function refresh_roles(): void {
		global $wp_roles;
		$wp_roles = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		wp_roles();
	}

	public function test_calendar_list_hides_foreign_owner_rows(): void {
		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/booking/calendars',
			array(
				'per_page' => 50,
				'user'     => 'all',
			),
			$this->child_admin_id
		);

		$this->assertSame( 200, $response->get_status() );
		$ids = array_map(
			static fn( $row ) => (int) $row['id'],
			(array) ( $response->get_data()['data'] ?? array() )
		);
		$this->assertNotContains( $this->foreign_calendar_id, $ids );
	}

	public function test_calendar_detail_denies_foreign_owner(): void {
		$this->assertFalse( Capabilities::can_read_calendar( $this->foreign_calendar_id ) );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/booking/calendars/' . $this->foreign_calendar_id,
			array(),
			$this->child_admin_id
		);

		$this->assertSame( 403, $response->get_status() );
	}

	public function test_booking_list_hides_foreign_owner_rows(): void {
		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/booking/bookings',
			array(
				'filter' => array(
					'user' => 'all',
				),
			),
			$this->child_admin_id
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertGreaterThan( 0, $this->foreign_booking_id );
		$rows = (array) ( $response->get_data()['bookings']['data'] ?? array() );
		$ids  = array();
		foreach ( $rows as $row ) {
			if ( is_array( $row ) && isset( $row['id'] ) ) {
				$ids[] = (int) $row['id'];
			} elseif ( is_object( $row ) && isset( $row->id ) ) {
				$ids[] = (int) $row->id;
			}
		}
		$this->assertNotContains( $this->foreign_booking_id, $ids );
	}

	public function test_booking_detail_denies_foreign_owner(): void {
		$this->assertFalse( Capabilities::can_read_booking( $this->foreign_booking_id ) );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/booking/bookings/' . $this->foreign_booking_id,
			array(),
			$this->child_admin_id
		);

		$this->assertSame( 403, $response->get_status() );
	}

	public function test_eligible_site_member_gets_host_calendar_provisioned(): void {
		MultisiteScope::reset_cache_for_tests();
		remove_all_filters( 'doublescale_booking_multisite_member_user_ids' );
		add_filter(
			'doublescale_booking_multisite_member_user_ids',
			fn() => array( $this->child_admin_id )
		);

		$provisioner = new BookingProvisioner();
		$calendar      = $provisioner->ensure_host_calendar( $this->child_admin_id );

		$this->assertNotNull( $calendar );
		$this->assertSame( 'host', $calendar->type );
		$this->assertSame( $this->child_admin_id, (int) $calendar->user_id );
	}
}
