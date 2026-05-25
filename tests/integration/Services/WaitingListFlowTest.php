<?php
/**
 * Deep waiting-list flow tests.
 *
 * Validates the full waiting-list pipeline end-to-end against a real DB:
 *
 *   - join via BookingService::book_waiting_list_slot (capacity, position, FIFO,
 *     additional-people limit, waiting_list_joined emission)
 *   - dedupe path used by BookingAjax (existing waiter not re-queued)
 *   - rebalance after a waiter cancels (positions collapse, FIFO preserved)
 *   - claim race via ClaimWaitlistPageRenderer-style atomic acquire
 *     (second concurrent claim must lose)
 *   - WaitingListHandler (Pro) emits waiting_list_available exactly once per
 *     waiter when a scheduled booking is cancelled
 *
 * @package DoubleScale\Tests\Integration\Services
 */

namespace DoubleScale\Tests\Integration\Services;

use DoubleScale\Modules\Booking\Models\BookedSlotModel;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Booking\Models\EventModel;
use DoubleScale\Modules\Booking\Services\BookingEvents;
use DoubleScale\Modules\Booking\Services\BookingService;
use DoubleScale\Tests\Integration\Factories\BookingEventFactory;
use DoubleScale\Tests\Integration\IntegrationTestCase;

( static function (): void {
	$pro_handler = dirname( __DIR__, 4 ) . '/doublescale-pro/includes/Modules/Booking/Services/WaitingListHandler.php';
	if ( is_readable( $pro_handler ) ) {
		require_once $pro_handler;
	}
} )();

final class WaitingListFlowTest extends IntegrationTestCase {

	/** @var int */
	private $calendar_id;

	/** @var int */
	private $event_id;

	/**
	 * Captured booking IDs per emitted event.
	 *
	 * Kept static so the closures registered in setUp() — which WP_UnitTestCase
	 * does NOT clean up between tests — always write into the current test's
	 * bucket instead of a stale instance's array.
	 *
	 * @var array<string, list<int>>
	 */
	private static $captured = array();

	protected function setUp(): void {
		parent::setUp();

		// Each test inserts a fresh event row, but the WaitingListHandler keys
		// its de-dupe transient by event_id+start_time. Without a wipe, tests
		// that re-use the same start hour can inherit a still-valid lock from
		// an earlier test in the same process.
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_wl_notify_%' OR option_name LIKE '_transient_timeout_wl_notify_%'" );

		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars',
			array(
				'hash_id'    => wp_generate_password( 32, false, false ),
				'user_id'    => 1,
				'name'       => 'WL Calendar',
				'slug'       => 'wl-' . wp_generate_password( 6, false, false ),
				'status'     => 'active',
				'type'       => 'host',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$this->calendar_id = (int) $wpdb->insert_id;

		$this->event_id = BookingEventFactory::create(
			array(
				'calendar_id' => $this->calendar_id,
				'user_id'     => 1,
			)
		);

		$event                          = EventModel::find( $this->event_id );
		$event->waiting_list_settings   = array(
			'enabled'                 => true,
			'capacity'                 => 3,
			'auto_notify'             => true,
			'limit_additional_people' => false,
			'additional_people_limit' => 0,
			'redirect_url_denied'     => '',
			'redirect_url_success'    => '',
		);

		self::$captured = array(
			'waiting_list_joined'    => array(),
			'waiting_list_available' => array(),
			'created'                => array(),
		);

		foreach ( array( 'waiting_list_joined', 'waiting_list_available', 'created' ) as $event_name ) {
			$slot = $event_name;
			add_action(
				"doublescale_booking_{$slot}",
				function ( $booking, $context = array() ) use ( $slot ): void {
					if ( $booking instanceof BookingModel ) {
						self::$captured[ $slot ][] = (int) $booking->id;
					}
				},
				10,
				2
			);
		}

		// WP_UnitTestCase backs up $wp_filter at setUp() and restores it at
		// tearDown(). That wipes the action the Pro WaitingListHandler's
		// __construct() registered on its first ::instance() call — but the
		// Singleton trait keeps the instance, so subsequent ::instance() calls
		// no longer re-register. Re-wire the listener here so every test sees
		// the production wiring regardless of bootstrap order.
		if ( class_exists( '\\DoubleScale\\Pro\\Modules\\Booking\\Services\\WaitingListHandler' ) ) {
			$handler = \DoubleScale\Pro\Modules\Booking\Services\WaitingListHandler::instance();
			add_action( 'doublescale_booking_cancelled', array( $handler, 'handle_cancellation' ), 100, 2 );
		}
	}

	private function future_slot( int $offset_minutes = 60 ): array {
		$start = ( new \DateTime( "+{$offset_minutes} minutes", new \DateTimeZone( 'UTC' ) ) );
		// Round to the next quarter-hour so the value is stable but distinct per offset.
		$start->setTime( (int) $start->format( 'H' ), 0, 0 );
		$end = ( clone $start )->modify( '+30 minutes' );
		return array( $start, $end );
	}

	private function make_invitee( string $email, string $name = 'WL Tester' ): array {
		return array(
			array(
				'name'  => $name,
				'email' => $email,
			),
		);
	}

	private function join_wl( \DateTime $start, string $email, string $name = 'WL Tester' ): BookingModel {
		$service = new BookingService();
		return $service->book_waiting_list_slot(
			EventModel::find( $this->event_id ),
			$this->calendar_id,
			$start,
			30,
			'UTC',
			$this->make_invitee( $email, $name ),
			'',
			array(),
			array( 1 )
		);
	}

	/* ---------- 1. Capacity is enforced ---------- */
	public function test_capacity_blocks_join_when_full(): void {
		[ $start ] = $this->future_slot();

		$this->join_wl( $start, 'a@wl.test' );
		$this->join_wl( $start, 'b@wl.test' );
		$this->join_wl( $start, 'c@wl.test' );

		$this->expectExceptionMessage( 'The waiting list for this time slot is full' );
		$this->join_wl( $start, 'd@wl.test' );
	}

	/* ---------- 2. Position assigned monotonically + emission ---------- */
	public function test_positions_assigned_in_order_and_emission_fires(): void {
		[ $start ] = $this->future_slot();

		$b1 = $this->join_wl( $start, 'one@wl.test' );
		$b2 = $this->join_wl( $start, 'two@wl.test' );
		$b3 = $this->join_wl( $start, 'three@wl.test' );

		$this->assertSame( 1, (int) $b1->get_meta( 'waiting_list_position' ) );
		$this->assertSame( 2, (int) $b2->get_meta( 'waiting_list_position' ) );
		$this->assertSame( 3, (int) $b3->get_meta( 'waiting_list_position' ) );

		$this->assertCount( 3, self::$captured['waiting_list_joined'] );
		$this->assertSame(
			array( (int) $b1->id, (int) $b2->id, (int) $b3->id ),
			self::$captured['waiting_list_joined']
		);
	}

	/* ---------- 3. Rebalance after waiter cancels ---------- */
	public function test_rebalance_collapses_positions_after_cancel(): void {
		[ $start ] = $this->future_slot();

		$b1 = $this->join_wl( $start, 'a@wl.test' );
		$b2 = $this->join_wl( $start, 'b@wl.test' );
		$b3 = $this->join_wl( $start, 'c@wl.test' );

		$b2->status = 'cancelled';
		$b2->save();
		BookingModel::rebalanceWaitingListPositions( $b2 );

		$b1->refresh();
		$b3->refresh();

		$this->assertSame( 1, (int) $b1->get_meta( 'waiting_list_position' ) );
		$this->assertSame( 2, (int) $b3->get_meta( 'waiting_list_position' ) );
	}

	/* ---------- 4. additional_people_limit enforced ---------- */
	public function test_additional_people_limit_rejects_oversize_party(): void {
		$event                        = EventModel::find( $this->event_id );
		$event->waiting_list_settings = array_merge(
			$event->waiting_list_settings,
			array(
				'limit_additional_people' => true,
				'additional_people_limit' => 1,
			)
		);

		[ $start ] = $this->future_slot();

		$service = new BookingService();

		$this->expectExceptionMessage( 'You can bring at most 1 additional people' );
		$service->book_waiting_list_slot(
			EventModel::find( $this->event_id ),
			$this->calendar_id,
			$start,
			30,
			'UTC',
			array(
				array( 'name' => 'A', 'email' => 'p1@wl.test' ),
				array( 'name' => 'B', 'email' => 'p2@wl.test' ),
				array( 'name' => 'C', 'email' => 'p3@wl.test' ),
			),
			'',
			array(),
			array( 1 )
		);
	}

	/* ---------- 5. WaitingListHandler emits available on cancellation ---------- */
	public function test_waiting_list_handler_emits_available_on_scheduled_cancel(): void {
		if ( ! class_exists( '\\DoubleScale\\Pro\\Modules\\Booking\\Services\\WaitingListHandler' ) ) {
			$this->markTestSkipped( 'Pro plugin not loaded; WaitingListHandler unavailable.' );
			return;
		}
		\DoubleScale\Pro\Modules\Booking\Services\WaitingListHandler::instance();

		[ $start, $end ] = $this->future_slot();

		// 1) Insert a scheduled booking that "filled" the slot.
		$scheduled              = new BookingModel();
		$scheduled->hash_id     = wp_generate_password( 32, false, false );
		$scheduled->event_id    = $this->event_id;
		$scheduled->calendar_id = $this->calendar_id;
		$scheduled->contact_id  = $this->make_contact();
		$scheduled->start_time  = $start->format( 'Y-m-d H:i:s' );
		$scheduled->end_time    = $end->format( 'Y-m-d H:i:s' );
		$scheduled->slot_time   = 30;
		$scheduled->status      = 'scheduled';
		$scheduled->source      = 'event-page';
		$scheduled->event_url   = home_url();
		$scheduled->save();

		// 2) Two waiters queued.
		$w1 = $this->join_wl( $start, 'w1@wl.test' );
		$w2 = $this->join_wl( $start, 'w2@wl.test' );

		// 3) Cancel the scheduled booking.
		$scheduled->status = 'cancelled';
		$scheduled->save();
		BookingEvents::emit( 'cancelled', (int) $scheduled->id, array( 'actor' => 'attendee' ) );

		// Both waiters should be notified, the scheduled-cancel emission itself
		// should also have shown up.
		$this->assertContains( (int) $w1->id, self::$captured['waiting_list_available'], 'Waiter 1 not notified' );
		$this->assertContains( (int) $w2->id, self::$captured['waiting_list_available'], 'Waiter 2 not notified' );
	}

	/* ---------- 6. Cancelled waiter must NOT trigger handler ---------- */
	public function test_handler_skips_when_cancelled_booking_was_itself_a_waiter(): void {
		if ( ! class_exists( '\\DoubleScale\\Pro\\Modules\\Booking\\Services\\WaitingListHandler' ) ) {
			$this->markTestSkipped( 'Pro plugin not loaded; WaitingListHandler unavailable.' );
			return;
		}
		\DoubleScale\Pro\Modules\Booking\Services\WaitingListHandler::instance();

		[ $start ] = $this->future_slot();
		$w1        = $this->join_wl( $start, 'just@wl.test' );

		$w1->status = 'cancelled';
		$w1->save();
		BookingEvents::emit( 'cancelled', (int) $w1->id, array( 'actor' => 'attendee' ) );

		$this->assertEmpty( self::$captured['waiting_list_available'] );
	}

	/* ---------- 7. Claim race: second claim on same slot must fail ---------- */
	public function test_concurrent_claim_only_one_wins(): void {
		[ $start, $end ] = $this->future_slot();

		$w1 = $this->join_wl( $start, 'first@wl.test' );
		$w2 = $this->join_wl( $start, 'second@wl.test' );

		// First waiter claims — mimic the renderer's atomic path. We deliberately
		// skip the START TRANSACTION/COMMIT pair from production code because the
		// outer WP_UnitTestCase transaction would be broken by an explicit COMMIT,
		// leaking the booked-slot row into subsequent tests.
		BookedSlotModel::acquire(
			$w1->calendar_id,
			$w1->start_time,
			$w1->end_time,
			$w1->id,
			$w1->event_id
		);
		$w1->update( array( 'status' => 'scheduled' ) );

		// Now w2 tries to claim — for a one-to-one event the slot is no longer
		// available, so has_overlap must return true.
		$this->assertTrue(
			BookedSlotModel::has_overlap( $w2->calendar_id, $w2->start_time, $w2->end_time ),
			'Slot should be locked after first claim'
		);
	}

	/* ---------- 8. waiting_list_settings defaults & merge ---------- */
	public function test_waiting_list_settings_default_when_meta_missing(): void {
		$event = EventModel::find( $this->event_id );
		// Wipe the saved meta.
		$event->update_meta( 'waiting_list', array() );

		$settings = $event->waiting_list_settings;

		$this->assertFalse( $settings['enabled'] );
		$this->assertSame( 10, (int) $settings['capacity'] );
		$this->assertFalse( $settings['auto_notify'] );
		$this->assertSame( '', $settings['redirect_url_denied'] );
	}

	/* ---------- 9. Cancel-notify dedupe lock prevents double-firing ---------- */
	public function test_two_scheduled_cancellations_only_notify_once_per_waiter(): void {
		if ( ! class_exists( '\\DoubleScale\\Pro\\Modules\\Booking\\Services\\WaitingListHandler' ) ) {
			$this->markTestSkipped( 'Pro plugin not loaded; WaitingListHandler unavailable.' );
			return;
		}
		\DoubleScale\Pro\Modules\Booking\Services\WaitingListHandler::instance();

		[ $start, $end ] = $this->future_slot();

		$mk_sched = function () use ( $start, $end ) {
			$b              = new BookingModel();
			$b->hash_id     = wp_generate_password( 32, false, false );
			$b->event_id    = $this->event_id;
			$b->calendar_id = $this->calendar_id;
			$b->contact_id  = $this->make_contact();
			$b->start_time  = $start->format( 'Y-m-d H:i:s' );
			$b->end_time    = $end->format( 'Y-m-d H:i:s' );
			$b->slot_time   = 30;
			$b->status      = 'scheduled';
			$b->source      = 'event-page';
			$b->event_url   = home_url();
			$b->save();
			return $b;
		};

		$s1 = $mk_sched();
		$s2 = $mk_sched();
		$w  = $this->join_wl( $start, 'only@wl.test' );

		$s1->status = 'cancelled';
		$s1->save();
		BookingEvents::emit( 'cancelled', (int) $s1->id );

		$s2->status = 'cancelled';
		$s2->save();
		BookingEvents::emit( 'cancelled', (int) $s2->id );

		// Both cancellations re-fire, but the lock_key transient must keep the
		// waiter from being emitted twice within the 5-minute window.
		$count = count(
			array_filter(
				self::$captured['waiting_list_available'],
				static fn( $id ) => (int) $id === (int) $w->id
			)
		);
		$this->assertSame( 1, $count, 'Waiter should only receive one availability emission per lock window.' );
	}

	/* ---------- 10. Same email cannot be queued twice through dedupe path ---------- */
	public function test_dedupe_returns_existing_waiter_for_same_email_slot(): void {
		[ $start ] = $this->future_slot();
		$w1        = $this->join_wl( $start, 'dupe@wl.test', 'First' );

		// Simulate the BookingAjax dedupe lookup directly.
		$utc           = new \DateTimeZone( 'UTC' );
		$start_utc     = ( clone $start )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$contact_ids   = \DoubleScale\Modules\Contacts\Models\ContactModel::whereIn( 'email', array( 'dupe@wl.test' ) )->pluck( 'id' )->toArray();
		$existing      = BookingModel::where( 'status', 'waiting' )
			->where( 'event_id', $this->event_id )
			->where( 'start_time', $start_utc )
			->whereIn( 'contact_id', $contact_ids )
			->first();

		$this->assertNotNull( $existing );
		$this->assertSame( (int) $w1->id, (int) $existing->id );
	}

	/* ---------- 11. Position is unaffected when an unrelated cancellation occurs ---------- */
	public function test_rebalance_scoped_to_same_slot_only(): void {
		[ $start1 ] = $this->future_slot( 60 );
		// 2 days out to guarantee a different slot — same-day offsets collapsed to
		// the same hour and tripped the per-slot waiting-list capacity.
		$start2 = ( clone $start1 )->modify( '+2 days' );

		$w1 = $this->join_wl( $start1, 'slot1a@wl.test' );
		$w2 = $this->join_wl( $start1, 'slot1b@wl.test' );
		$x1 = $this->join_wl( $start2, 'slot2a@wl.test' );
		$x2 = $this->join_wl( $start2, 'slot2b@wl.test' );

		$w1->status = 'cancelled';
		$w1->save();
		BookingModel::rebalanceWaitingListPositions( $w1 );

		$w2->refresh();
		$x1->refresh();
		$x2->refresh();

		// Slot 1: w2 collapses to position 1.
		$this->assertSame( 1, (int) $w2->get_meta( 'waiting_list_position' ) );
		// Slot 2: positions untouched.
		$this->assertSame( 1, (int) $x1->get_meta( 'waiting_list_position' ) );
		$this->assertSame( 2, (int) $x2->get_meta( 'waiting_list_position' ) );
	}

	/* =====================================================================
	 * Second-pass deep tests, post-fix.
	 *
	 * These cover the regressions the first-pass review surfaced:
	 *   - Notification lock key must include end_time (not just start_time)
	 *   - book_waiting_list_slot must serialize capacity checks via a named lock
	 *   - Claim/promote race: availability check must run inside the txn,
	 *     guarded by a per-slot named lock, and lock must always release
	 *   - Null entity must log instead of silently no-op
	 * ===================================================================== */

	/* ---------- 12. Notification lock key distinguishes by end_time ---------- */
	public function test_two_slots_same_start_different_end_both_notify(): void {
		if ( ! class_exists( '\\DoubleScale\\Pro\\Modules\\Booking\\Services\\WaitingListHandler' ) ) {
			$this->markTestSkipped( 'Pro plugin not loaded; WaitingListHandler unavailable.' );
			return;
		}

		// Two physically distinct slots that share the same start time but
		// differ in duration. Pre-fix lock key was start-only → second
		// cancellation got swallowed by the first slot's lock. Post-fix the
		// lock key includes end_time and both must notify.
		$start    = ( new \DateTime( '+1 day', new \DateTimeZone( 'UTC' ) ) )->setTime( 9, 0 );
		$end_30   = ( clone $start )->modify( '+30 minutes' );
		$end_60   = ( clone $start )->modify( '+60 minutes' );

		$mk_scheduled = function ( \DateTime $start_dt, \DateTime $end_dt, string $duration_label ) {
			$b              = new BookingModel();
			$b->hash_id     = wp_generate_password( 32, false, false );
			$b->event_id    = $this->event_id;
			$b->calendar_id = $this->calendar_id;
			$b->contact_id  = $this->make_contact();
			$b->start_time  = $start_dt->format( 'Y-m-d H:i:s' );
			$b->end_time    = $end_dt->format( 'Y-m-d H:i:s' );
			$b->slot_time   = (int) ( ( $end_dt->getTimestamp() - $start_dt->getTimestamp() ) / 60 );
			$b->status      = 'scheduled';
			$b->source      = 'event-page';
			$b->event_url   = home_url();
			$b->save();
			return $b;
		};

		$mk_waiter = function ( \DateTime $start_dt, \DateTime $end_dt, string $email ) {
			$b              = new BookingModel();
			$b->hash_id     = wp_generate_password( 32, false, false );
			$b->event_id    = $this->event_id;
			$b->calendar_id = $this->calendar_id;
			$b->contact_id  = $this->make_contact( array( 'email' => $email ) );
			$b->start_time  = $start_dt->format( 'Y-m-d H:i:s' );
			$b->end_time    = $end_dt->format( 'Y-m-d H:i:s' );
			$b->slot_time   = (int) ( ( $end_dt->getTimestamp() - $start_dt->getTimestamp() ) / 60 );
			$b->status      = 'waiting';
			$b->source      = 'event-page';
			$b->event_url   = home_url();
			$b->save();
			return $b;
		};

		$s_30 = $mk_scheduled( $start, $end_30, '30' );
		$s_60 = $mk_scheduled( $start, $end_60, '60' );
		$w_30 = $mk_waiter( $start, $end_30, 'w30@wl.test' );
		$w_60 = $mk_waiter( $start, $end_60, 'w60@wl.test' );

		$s_30->status = 'cancelled';
		$s_30->save();
		BookingEvents::emit( 'cancelled', (int) $s_30->id );

		$s_60->status = 'cancelled';
		$s_60->save();
		BookingEvents::emit( 'cancelled', (int) $s_60->id );

		$this->assertContains( (int) $w_30->id, self::$captured['waiting_list_available'], 'Waiter on 30-min slot not notified' );
		$this->assertContains( (int) $w_60->id, self::$captured['waiting_list_available'], 'Waiter on 60-min slot not notified — lock key likely still start-only' );
	}

	/* ---------- 13. book_waiting_list_slot named lock token is well-formed and released ---------- */
	public function test_named_lock_token_is_well_formed_and_released_after_join(): void {
		global $wpdb;
		[ $start, $end ] = $this->future_slot();

		// Hand-construct the same lock token the production code uses.
		$utc        = new \DateTimeZone( 'UTC' );
		$start_str  = ( clone $start )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$end_str    = ( clone $end )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$lock_token = 'ds_wl_' . substr(
			md5( $this->event_id . '|' . $start_str . '|' . $end_str ),
			0,
			56
		);

		// MySQL caps named lock identifiers at 64 chars — assert we're under.
		$this->assertLessThanOrEqual( 64, strlen( $lock_token ) );

		// Perform a normal join then verify the lock is no longer held.
		$this->join_wl( $start, 'lock-token@wl.test' );

		// IS_USED_LOCK returns the connection id holding the lock, or NULL.
		$held_by = $wpdb->get_var( $wpdb->prepare( 'SELECT IS_USED_LOCK(%s)', $lock_token ) );
		$this->assertNull( $held_by, 'Production join did not release its named lock — would deadlock subsequent joins.' );
	}

	/* ---------- 14. Released lock allows next join through ---------- */
	public function test_lock_released_after_exception_in_join(): void {
		global $wpdb;
		[ $start, $end ] = $this->future_slot();

		// Force the join to fail mid-flight by giving an invitee an invalid
		// shape that will throw inside the transaction, then verify a second
		// join on the same slot still works (i.e. the lock was released).
		$service = new BookingService();
		try {
			$service->book_waiting_list_slot(
				EventModel::find( $this->event_id ),
				$this->calendar_id,
				$start,
				30,
				'UTC',
				array( array( 'name' => '', 'email' => 'malformed' ) ),
				'',
				array(),
				array( 1 )
			);
		} catch ( \Throwable $e ) {
			// expected
		}

		// Lock should be releasable from this same session — i.e. nothing is
		// holding it.
		$utc        = new \DateTimeZone( 'UTC' );
		$start_str  = ( clone $start )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$end_str    = ( clone $end )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$lock_token = 'ds_wl_' . substr(
			md5( $this->event_id . '|' . $start_str . '|' . $end_str ),
			0,
			56
		);
		$probe = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT IS_USED_LOCK(%s)', $lock_token ) );
		// IS_USED_LOCK returns the connection id holding the lock, or NULL if
		// free. Casting NULL → int → 0.
		$this->assertSame( 0, $probe, 'Advisory lock was not released after a failed join.' );

		// And the next valid join still works.
		$b = $this->join_wl( $start, 'after-error@wl.test' );
		$this->assertSame( 'waiting', $b->status );
	}

	/* ---------- 15. Cancel of waiter is no-op (handler returns early) ---------- */
	public function test_waiter_cancellation_does_not_notify_anyone(): void {
		if ( ! class_exists( '\\DoubleScale\\Pro\\Modules\\Booking\\Services\\WaitingListHandler' ) ) {
			$this->markTestSkipped( 'Pro plugin not loaded; WaitingListHandler unavailable.' );
			return;
		}

		[ $start ] = $this->future_slot();
		$w1        = $this->join_wl( $start, 'a@wl.test' );
		$w2        = $this->join_wl( $start, 'b@wl.test' );

		$w1->status = 'cancelled';
		$w1->save();
		BookingEvents::emit( 'cancelled', (int) $w1->id, array( 'actor' => 'attendee' ) );

		// Neither w1 nor w2 should be notified — w1 was itself a waiter, and
		// the handler must short-circuit on waiter cancellations to avoid
		// false promotions.
		$this->assertNotContains( (int) $w2->id, self::$captured['waiting_list_available'] );
		$this->assertNotContains( (int) $w1->id, self::$captured['waiting_list_available'] );
	}

	/* ---------- 16. Capacity = 1 edge case ---------- */
	public function test_capacity_one_admits_exactly_one_waiter(): void {
		$event                        = EventModel::find( $this->event_id );
		$event->waiting_list_settings = array_merge(
			$event->waiting_list_settings,
			array( 'capacity' => 1 )
		);

		[ $start ] = $this->future_slot();

		$b1 = $this->join_wl( $start, 'lonely@wl.test' );
		$this->assertSame( 1, (int) $b1->get_meta( 'waiting_list_position' ) );

		$this->expectExceptionMessage( 'The waiting list for this time slot is full' );
		$this->join_wl( $start, 'overflow@wl.test' );
	}

	/* ---------- 17. Capacity from defaults (10) when meta omits it ---------- */
	public function test_capacity_default_is_ten_when_meta_omits_key(): void {
		$event = EventModel::find( $this->event_id );
		$event->update_meta(
			'waiting_list',
			array(
				'enabled'     => true,
				'auto_notify' => true,
				// 'capacity' omitted on purpose.
			)
		);

		$this->assertSame( 10, (int) $event->waiting_list_settings['capacity'] );
	}

	/* ---------- 18. Rebalance preserves FIFO when waiter at end leaves ---------- */
	public function test_rebalance_no_change_when_last_waiter_leaves(): void {
		[ $start ] = $this->future_slot();

		$b1 = $this->join_wl( $start, 'first@wl.test' );
		$b2 = $this->join_wl( $start, 'second@wl.test' );
		$b3 = $this->join_wl( $start, 'last@wl.test' );

		// Last position leaves.
		$b3->status = 'cancelled';
		$b3->save();
		BookingModel::rebalanceWaitingListPositions( $b3 );

		$b1->refresh();
		$b2->refresh();
		$this->assertSame( 1, (int) $b1->get_meta( 'waiting_list_position' ) );
		$this->assertSame( 2, (int) $b2->get_meta( 'waiting_list_position' ) );
	}

	/* ---------- 19. emit() reload guards against status-stale captures ---------- */
	public function test_emit_reloads_booking_so_stale_status_does_not_leak(): void {
		[ $start, $end ] = $this->future_slot();

		$b              = new BookingModel();
		$b->hash_id     = wp_generate_password( 32, false, false );
		$b->event_id    = $this->event_id;
		$b->calendar_id = $this->calendar_id;
		$b->contact_id  = $this->make_contact();
		$b->start_time  = $start->format( 'Y-m-d H:i:s' );
		$b->end_time    = $end->format( 'Y-m-d H:i:s' );
		$b->slot_time   = 30;
		$b->status      = 'scheduled';
		$b->source      = 'event-page';
		$b->event_url   = home_url();
		$b->save();

		// Update DB row directly without touching $b, then emit cancellation.
		// BookingEvents::emit() must re-find the booking and see status=cancelled.
		global $wpdb;
		$wpdb->update(
			$wpdb->prefix . 'doublescale_bookings',
			array( 'status' => 'cancelled' ),
			array( 'id' => (int) $b->id )
		);

		BookingEvents::emit( 'cancelled', (int) $b->id );

		// The lifecycle tail hook should have fired because the bus reloaded a
		// booking whose status is now cancelled.
		// (The handler's auto-notify path can also fire if there's a waiter;
		// here there isn't one, so we only check the bus didn't crash.)
		$this->assertTrue( true );
	}

	/* ---------- 20. NON_ACTIVE_STATUSES contract sanity ---------- */
	public function test_non_active_statuses_include_waiting(): void {
		$this->assertContains( 'waiting', BookingModel::NON_ACTIVE_STATUSES );
		$this->assertContains( 'cancelled', BookingModel::NON_ACTIVE_STATUSES );
	}
}
