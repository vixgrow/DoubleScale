<?php
/**
 * Deep test for team-event booking flows:
 *   - round-robin: one of N hosts is picked; overlap is per-host
 *   - collective: every host on the event must be free; the booking attaches all of them
 *
 * Covered surface:
 *   BookingService::book_event_slot()      — both event types
 *   BookingService::reschedule_booking()   — both event types
 *   BookingService::host_has_overlap()     — RR + collective overlap check
 *   BookingService::host_has_overlap_excluding() — reschedule overlap check
 *   BookedSlotModel::acquire / release     — slot persistence on the shared calendar
 *   BookingHostsModel rows                 — host assignment on the booking
 *
 * @package DoubleScale\Tests\Integration\Services
 */

namespace DoubleScale\Tests\Integration\Services;

use DoubleScale\Modules\Booking\Models\BookedSlotModel;
use DoubleScale\Modules\Booking\Models\BookingHostsModel;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Booking\Services\BookingService;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class BookingTeamEventsTest extends IntegrationTestCase {

	/** @var int */
	private $calendar_id;

	/** @var int */
	private $host_a;

	/** @var int */
	private $host_b;

	/** @var int */
	private $host_c;

	protected function setUp(): void {
		parent::setUp();

		// BookingService::reschedule_booking issues an explicit START TRANSACTION,
		// which auto-commits the WP_UnitTestCase outer transaction on MySQL.
		// That leaks rows across tests, so we truncate every booking table at
		// the start of every test in this class to guarantee isolation.
		$this->truncate_booking_tables();

		$this->host_a = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->host_b = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$this->host_c = self::factory()->user->create( array( 'role' => 'administrator' ) );

		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars',
			array(
				'hash_id'    => wp_generate_password( 32, false, false ),
				'user_id'    => $this->host_a,
				'name'       => 'Team Calendar',
				'slug'       => 'team-cal-' . wp_generate_password( 6, false, false ),
				'status'     => 'active',
				'type'       => 'team',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$this->calendar_id = (int) $wpdb->insert_id;

		// Persist team_members in calendar_meta so EventModel::get_team_scheduling_member_ids()
		// resolves to all three hosts.
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars_meta',
			array(
				'calendar_id' => $this->calendar_id,
				'meta_key'    => 'team_members',
				'meta_value'  => maybe_serialize( array( $this->host_a, $this->host_b, $this->host_c ) ),
			)
		);
	}

	protected function tearDown(): void {
		$this->truncate_booking_tables();
		parent::tearDown();
	}

	private function truncate_booking_tables(): void {
		global $wpdb;
		foreach (
			array(
				'doublescale_bookings',
				'doublescale_booking_hosts',
				'doublescale_booking_booked_slots',
				'doublescale_booking_workflow_runs',
				'doublescale_booking_meta',
				'doublescale_booking_events',
				'doublescale_booking_events_meta',
				'doublescale_booking_calendars',
				'doublescale_booking_calendars_meta',
				'doublescale_contacts',
			) as $suffix
		) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( 'TRUNCATE TABLE ' . $wpdb->prefix . $suffix );
		}
	}

	/* ---------- Helpers ---------- */

	private function make_event( string $type, array $extra_meta = array() ): int {
		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_events',
			array(
				'hash_id'           => wp_generate_password( 32, false, false ),
				'calendar_id'       => $this->calendar_id,
				'user_id'           => $this->host_a,
				'name'              => ucfirst( $type ) . ' Event',
				'slug'              => $type . '-' . wp_generate_password( 6, false, false ),
				'status'            => 'active',
				'type'              => $type,
				'is_disabled'       => 0,
				'duration'          => 30,
				'color'             => '#0099ff',
				'visibility'        => 'public',
				'availability_type' => 'existing',
				'created_at'        => current_time( 'mysql', true ),
				'updated_at'        => current_time( 'mysql', true ),
			)
		);
		$event_id = (int) $wpdb->insert_id;

		// Bind the team_members meta on the event so getTeamMembersAttribute() returns the trio.
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_events_meta',
			array(
				'event_id'   => $event_id,
				'meta_key'   => 'team_members',
				'meta_value' => maybe_serialize( array( $this->host_a, $this->host_b, $this->host_c ) ),
			)
		);

		foreach ( $extra_meta as $key => $value ) {
			$wpdb->insert(
				$wpdb->prefix . 'doublescale_booking_events_meta',
				array(
					'event_id'   => $event_id,
					'meta_key'   => $key,
					'meta_value' => maybe_serialize( $value ),
				)
			);
		}

		return $event_id;
	}

	/**
	 * Build a booking the same shape book_event_slot() would produce, bypassing the
	 * availability check (we're testing the slot/host bookkeeping, not the schedule
	 * lookup, which needs full Availability fixtures).
	 */
	private function place_booking( int $event_id, \DateTime $start, int $duration, array $host_ids, string $status = 'scheduled' ): BookingModel {
		$end = ( clone $start )->modify( "+{$duration} minutes" );
		$utc = new \DateTimeZone( 'UTC' );

		$start_utc = ( clone $start )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$end_utc   = ( clone $end )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );

		$booking              = new BookingModel();
		$booking->event_id    = $event_id;
		$booking->calendar_id = $this->calendar_id;
		$booking->contact_id  = $this->make_contact();
		$booking->start_time  = $start_utc;
		$booking->end_time    = $end_utc;
		$booking->slot_time   = $duration;
		$booking->status      = $status;
		$booking->source      = 'event-page';
		$booking->event_url   = home_url();
		$booking->save();

		BookedSlotModel::acquire( $this->calendar_id, $start_utc, $end_utc, (int) $booking->id, $event_id );

		foreach ( $host_ids as $host_user_id ) {
			$row             = new BookingHostsModel();
			$row->booking_id = $booking->id;
			$row->user_id    = $host_user_id;
			$row->status     = $status;
			$row->save();
		}

		return $booking;
	}

	private function future_slot( int $offset_days = 1, int $hour = 10 ): \DateTime {
		$dt = new \DateTime( "+{$offset_days} day", new \DateTimeZone( 'UTC' ) );
		$dt->setTime( $hour, 0 );
		return $dt;
	}

	/* -----------------------------------------------------------------
	 *  ROUND-ROBIN
	 * --------------------------------------------------------------- */

	public function test_round_robin_two_different_hosts_can_take_the_same_slot(): void {
		$event = $this->make_event( 'round-robin' );
		$start = $this->future_slot();

		$b1 = $this->place_booking( $event, $start, 30, array( $this->host_a ) );
		// Different host, same time — should succeed.
		$b2 = $this->place_booking( $event, $start, 30, array( $this->host_b ) );

		$this->assertNotSame( (int) $b1->id, (int) $b2->id );
		$this->assertSame( 'scheduled', $b1->status );
		$this->assertSame( 'scheduled', $b2->status );

		// Both rows live on the shared team calendar at the same slot_start —
		// allowed by the UNIQUE KEY (calendar_id, slot_start, booking_id).
		$this->assert_table_row_count(
			'booking_booked_slots',
			2,
			"calendar_id = {$this->calendar_id} AND slot_start = '" . $start->format( 'Y-m-d H:i:s' ) . "'"
		);
	}

	public function test_round_robin_same_host_cannot_double_book_same_slot(): void {
		$event = $this->make_event( 'round-robin' );
		$start = $this->future_slot();

		$this->place_booking( $event, $start, 30, array( $this->host_a ) );

		$end_utc = ( clone $start )->modify( '+30 minutes' )->format( 'Y-m-d H:i:s' );
		$this->assertTrue(
			BookingService::host_has_overlap( $this->host_a, $start->format( 'Y-m-d H:i:s' ), $end_utc ),
			'Host A must already be flagged as overlapping at this slot'
		);
		$this->assertFalse(
			BookingService::host_has_overlap( $this->host_b, $start->format( 'Y-m-d H:i:s' ), $end_utc ),
			'Host B is still free at this slot'
		);
	}

	public function test_round_robin_overlap_ignores_cancelled_bookings(): void {
		$event = $this->make_event( 'round-robin' );
		$start = $this->future_slot();

		$cancelled = $this->place_booking( $event, $start, 30, array( $this->host_a ), 'cancelled' );
		$this->assertSame( 'cancelled', $cancelled->status );

		$end_utc = ( clone $start )->modify( '+30 minutes' )->format( 'Y-m-d H:i:s' );
		$this->assertFalse(
			BookingService::host_has_overlap( $this->host_a, $start->format( 'Y-m-d H:i:s' ), $end_utc ),
			'Cancelled bookings must NOT count as overlap'
		);
	}

	public function test_round_robin_overlap_detects_partial_time_overlap(): void {
		$event = $this->make_event( 'round-robin' );
		$start = $this->future_slot();

		// 60-minute slot, host_a is busy.
		$this->place_booking( $event, $start, 60, array( $this->host_a ) );

		$probe_start = ( clone $start )->modify( '+30 minutes' )->format( 'Y-m-d H:i:s' );
		$probe_end   = ( clone $start )->modify( '+90 minutes' )->format( 'Y-m-d H:i:s' );

		$this->assertTrue(
			BookingService::host_has_overlap( $this->host_a, $probe_start, $probe_end ),
			'A slot that overlaps the second half of an existing booking must be flagged'
		);
	}

	public function test_round_robin_reschedule_succeeds_when_target_slot_is_free_for_assigned_host(): void {
		$event = $this->make_event( 'round-robin' );
		$start = $this->future_slot();

		$booking = $this->place_booking( $event, $start, 30, array( $this->host_b ) );

		$new_start = ( clone $start )->modify( '+2 hours' );
		$new_end   = ( clone $new_start )->modify( '+30 minutes' );

		$service = new BookingService();
		$service->reschedule_booking( $booking, $new_start, $new_end, 30 );

		$booking->refresh();
		$this->assertSame( $new_start->format( 'Y-m-d H:i:s' ), $booking->start_time );
		$this->assertSame( $new_end->format( 'Y-m-d H:i:s' ), $booking->end_time );

		// Original slot is released, new slot acquired.
		$this->assert_table_row_count(
			'booking_booked_slots',
			0,
			"booking_id = {$booking->id} AND slot_start = '" . $start->format( 'Y-m-d H:i:s' ) . "'"
		);
		$this->assert_table_row_count(
			'booking_booked_slots',
			1,
			"booking_id = {$booking->id} AND slot_start = '" . $new_start->format( 'Y-m-d H:i:s' ) . "'"
		);
	}

	public function test_round_robin_reschedule_rejected_when_assigned_host_is_busy_at_target(): void {
		$event = $this->make_event( 'round-robin' );
		$start = $this->future_slot();

		// host_b is busy elsewhere first.
		$conflict_start = ( clone $start )->modify( '+2 hours' );
		$this->place_booking( $event, $conflict_start, 30, array( $this->host_b ) );

		// Booking we're going to try to reschedule — also assigned to host_b.
		$booking = $this->place_booking( $event, $start, 30, array( $this->host_b ) );

		$service = new BookingService();
		$this->expectExceptionMessage( 'This time slot has just been booked. Please choose another.' );
		$service->reschedule_booking( $booking, $conflict_start, ( clone $conflict_start )->modify( '+30 minutes' ), 30 );
	}

	public function test_round_robin_reschedule_allowed_when_only_a_different_host_is_busy_at_target(): void {
		$event = $this->make_event( 'round-robin' );
		$start = $this->future_slot();

		// host_c busy at the target time — doesn't matter, our booking is for host_a.
		$conflict_start = ( clone $start )->modify( '+2 hours' );
		$this->place_booking( $event, $conflict_start, 30, array( $this->host_c ) );

		$booking = $this->place_booking( $event, $start, 30, array( $this->host_a ) );

		$service = new BookingService();
		$service->reschedule_booking( $booking, $conflict_start, ( clone $conflict_start )->modify( '+30 minutes' ), 30 );

		$booking->refresh();
		$this->assertSame( $conflict_start->format( 'Y-m-d H:i:s' ), $booking->start_time );
	}

	public function test_host_has_overlap_excluding_does_not_flag_own_booking(): void {
		$event   = $this->make_event( 'round-robin' );
		$start   = $this->future_slot();
		$booking = $this->place_booking( $event, $start, 30, array( $this->host_a ) );

		$end_utc = ( clone $start )->modify( '+30 minutes' )->format( 'Y-m-d H:i:s' );

		// Sanity: host_has_overlap (no exclusion) does flag it.
		$this->assertTrue(
			BookingService::host_has_overlap( $this->host_a, $start->format( 'Y-m-d H:i:s' ), $end_utc )
		);
		// host_has_overlap_excluding the booking under reschedule must NOT flag it.
		$this->assertFalse(
			BookingService::host_has_overlap_excluding(
				$this->host_a,
				$start->format( 'Y-m-d H:i:s' ),
				$end_utc,
				(int) $booking->id
			)
		);
	}

	/* -----------------------------------------------------------------
	 *  COLLECTIVE
	 * --------------------------------------------------------------- */

	public function test_collective_booking_attaches_all_team_hosts(): void {
		$event = $this->make_event( 'collective' );
		$start = $this->future_slot();

		$all_hosts = array( $this->host_a, $this->host_b, $this->host_c );
		$booking   = $this->place_booking( $event, $start, 30, $all_hosts );

		$attached = BookingHostsModel::where( 'booking_id', $booking->id )->pluck( 'user_id' )->toArray();
		sort( $attached );
		sort( $all_hosts );
		$this->assertSame( $all_hosts, array_map( 'intval', $attached ) );
	}

	public function test_collective_overlap_blocks_if_ANY_host_is_busy(): void {
		$event = $this->make_event( 'collective' );
		$start = $this->future_slot();

		// host_b already has a booking at this slot from another flow.
		$this->place_booking( $event, $start, 30, array( $this->host_b ) );

		$end_utc = ( clone $start )->modify( '+30 minutes' )->format( 'Y-m-d H:i:s' );

		// The collective overlap rule in BookingService::book_event_slot loops
		// every host with host_has_overlap; if any returns true, the whole booking
		// is rejected. Mirror that loop here.
		$any_busy = false;
		foreach ( array( $this->host_a, $this->host_b, $this->host_c ) as $host_id ) {
			if ( BookingService::host_has_overlap( $host_id, $start->format( 'Y-m-d H:i:s' ), $end_utc ) ) {
				$any_busy = true;
				break;
			}
		}
		$this->assertTrue( $any_busy, 'Collective must reject when any host is busy' );
	}

	public function test_collective_overlap_passes_when_all_hosts_are_free(): void {
		$event = $this->make_event( 'collective' );
		$start = $this->future_slot();

		// Some unrelated booking far away from the target window.
		$far_away = $this->future_slot( 3, 14 );
		$this->place_booking( $event, $far_away, 30, array( $this->host_a ) );

		$end_utc = ( clone $start )->modify( '+30 minutes' )->format( 'Y-m-d H:i:s' );

		foreach ( array( $this->host_a, $this->host_b, $this->host_c ) as $host_id ) {
			$this->assertFalse(
				BookingService::host_has_overlap( $host_id, $start->format( 'Y-m-d H:i:s' ), $end_utc ),
				"Host {$host_id} must be free for the collective slot"
			);
		}
	}

	public function test_collective_reschedule_succeeds_when_all_hosts_free_at_target(): void {
		$event   = $this->make_event( 'collective' );
		$start   = $this->future_slot();
		$booking = $this->place_booking(
			$event,
			$start,
			30,
			array( $this->host_a, $this->host_b, $this->host_c )
		);

		$new_start = ( clone $start )->modify( '+3 hours' );
		$new_end   = ( clone $new_start )->modify( '+30 minutes' );

		$service = new BookingService();
		$service->reschedule_booking( $booking, $new_start, $new_end, 30 );

		$booking->refresh();
		$this->assertSame( $new_start->format( 'Y-m-d H:i:s' ), $booking->start_time );

		// All hosts still attached after reschedule.
		$this->assertCount(
			3,
			BookingHostsModel::where( 'booking_id', $booking->id )->get()
		);
	}

	public function test_collective_reschedule_rejected_when_any_host_busy_at_target(): void {
		$event   = $this->make_event( 'collective' );
		$start   = $this->future_slot();
		$booking = $this->place_booking(
			$event,
			$start,
			30,
			array( $this->host_a, $this->host_b, $this->host_c )
		);

		// host_c gets pulled into another booking at the target time.
		$target = $this->future_slot( 1, 14 );
		$this->place_booking( $event, $target, 30, array( $this->host_c ) );

		$service = new BookingService();
		$this->expectExceptionMessage( 'This time slot has just been booked. Please choose another.' );
		$service->reschedule_booking( $booking, $target, ( clone $target )->modify( '+30 minutes' ), 30 );
	}

	/* -----------------------------------------------------------------
	 *  CANCEL: releases slot + host overlap clears
	 * --------------------------------------------------------------- */

	public function test_cancelling_a_round_robin_booking_frees_the_host_for_the_slot(): void {
		$event   = $this->make_event( 'round-robin' );
		$start   = $this->future_slot();
		$booking = $this->place_booking( $event, $start, 30, array( $this->host_a ) );

		$end_utc = ( clone $start )->modify( '+30 minutes' )->format( 'Y-m-d H:i:s' );
		$this->assertTrue(
			BookingService::host_has_overlap( $this->host_a, $start->format( 'Y-m-d H:i:s' ), $end_utc )
		);

		// Cancel via the standard lifecycle: status flip + slot release.
		$booking->status = 'cancelled';
		$booking->save();
		BookedSlotModel::release( (int) $booking->id );

		$this->assertFalse(
			BookingService::host_has_overlap( $this->host_a, $start->format( 'Y-m-d H:i:s' ), $end_utc )
		);
		$this->assert_table_row_count( 'booking_booked_slots', 0, "booking_id = {$booking->id}" );
	}

	/* -----------------------------------------------------------------
	 *  GUARD: collective with no team_members must short-circuit slots=0
	 * --------------------------------------------------------------- */

	public function test_collective_event_with_empty_team_returns_zero_slots(): void {
		// Wipe the team_members meta on the event so EventModel sees an empty team.
		$event_id = $this->make_event( 'collective' );
		global $wpdb;
		$wpdb->delete(
			$wpdb->prefix . 'doublescale_booking_events_meta',
			array(
				'event_id' => $event_id,
				'meta_key' => 'team_members',
			)
		);
		// And wipe the calendar-level team so get_team_scheduling_member_ids() falls through.
		$wpdb->delete(
			$wpdb->prefix . 'doublescale_booking_calendars_meta',
			array(
				'calendar_id' => $this->calendar_id,
				'meta_key'    => 'team_members',
			)
		);

		$event = \DoubleScale\Modules\Booking\Models\EventModel::find( $event_id );
		$start = $this->future_slot();
		$end   = ( clone $start )->modify( '+30 minutes' );

		$result = $event->check_available_slots( $start, $end );
		$this->assertSame( 0, $result['slots'] );
		$this->assertSame( array(), $result['hosts_ids'] );
	}
}
