<?php
/**
 * Deep end-to-end test for the booking lifecycle event pipeline:
 *
 *   BookingEvents::emit() → EventBus::dispatch() → workflow_runs (idempotency)
 *                                              → structured handlers (release_slot, notify_*)
 *                                              → bare-hook tail (doublescale_booking_{event})
 *                                              → Pro lifecycle triggers (booking_created, …)
 *
 * Covers every lifecycle event the bus emits:
 *   created, confirmed, cancelled, rescheduled, completed, rejected, pending,
 *   waiting_list_joined, waiting_list_available
 *
 * Also exercises the action-verb mapping in BookingActions and the BookingJobs
 * auto-completion path that emits `completed`.
 *
 * @package DoubleScale\Tests\Integration\Services
 */

namespace DoubleScale\Tests\Integration\Services;

use DoubleScale\Modules\Booking\Models\BookedSlotModel;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Booking\Models\WorkflowRunModel;
use DoubleScale\Modules\Booking\Services\BookingActions;
use DoubleScale\Modules\Booking\Services\BookingEvents;
use DoubleScale\Modules\Booking\Services\BookingJobs;
use DoubleScale\Modules\Booking\Services\EventBus;
use DoubleScale\Pro\Modules\Automations\Triggers\Booking\BookingCancelled;
use DoubleScale\Pro\Modules\Automations\Triggers\Booking\BookingCompleted;
use DoubleScale\Pro\Modules\Automations\Triggers\Booking\BookingConfirmed;
use DoubleScale\Pro\Modules\Automations\Triggers\Booking\BookingCreated;
use DoubleScale\Pro\Modules\Automations\Triggers\Booking\BookingRescheduled;
use DoubleScale\Tests\Integration\Factories\BookingEventFactory;
use DoubleScale\Tests\Integration\IntegrationTestCase;

// Best-effort: include the Pro lifecycle trigger sources directly so the cross-plugin
// tests below can subclass them even when the Pro plugin isn't bootstrapped via WP.
( static function (): void {
	$dir = dirname( __DIR__, 4 ) . '/doublescale-pro/includes/Modules/Automations/Triggers/Booking';
	if ( ! is_dir( $dir ) ) {
		return;
	}
	foreach (
		array(
			'AbstractBookingLifecycleTrigger.php',
			'BookingCreated.php',
			'BookingConfirmed.php',
			'BookingCancelled.php',
			'BookingRescheduled.php',
			'BookingCompleted.php',
		) as $file
	) {
		$path = $dir . '/' . $file;
		if ( is_readable( $path ) ) {
			require_once $path;
		}
	}
} )();

final class BookingLifecycleEventsTest extends IntegrationTestCase {

	/** @var int */
	private $contact_id;

	/** @var int */
	private $event_id;

	/** @var int */
	private $calendar_id;

	/** @var array<string, array<int, array{booking_id:int, context:array}>> */
	private $captured = array();

	protected function setUp(): void {
		parent::setUp();

		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars',
			array(
				'hash_id'    => wp_generate_password( 32, false, false ),
				'user_id'    => 1,
				'name'       => 'Test Calendar',
				'slug'       => 'test-' . wp_generate_password( 6, false, false ),
				'status'     => 'active',
				'type'       => 'host',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$this->calendar_id = (int) $wpdb->insert_id;

		$this->event_id   = BookingEventFactory::create( array( 'calendar_id' => $this->calendar_id ) );
		$this->contact_id = $this->make_contact();

		$this->captured = array();
	}

	/**
	 * Subscribe a capture callback to every lifecycle tail hook so each test
	 * can assert which events fired (and in which order, with what context).
	 */
	private function subscribe_tail_hooks(): void {
		$events = array(
			'created',
			'confirmed',
			'cancelled',
			'rescheduled',
			'completed',
			'rejected',
			'pending',
			'waiting_list_joined',
			'waiting_list_available',
		);

		foreach ( $events as $event ) {
			$slot  = $event;
			$store = function ( $booking, $context = array() ) use ( $slot ): void {
				if ( ! $booking instanceof BookingModel ) {
					return;
				}
				$this->captured[ $slot ][] = array(
					'booking_id' => (int) $booking->id,
					'context'    => is_array( $context ) ? $context : array(),
				);
			};
			add_action( "doublescale_booking_{$slot}", $store, 10, 2 );
		}
	}

	private function make_booking( string $status = 'scheduled', array $overrides = array() ): BookingModel {
		$start = ( new \DateTime( '+1 day', new \DateTimeZone( 'UTC' ) ) )->setTime( 10, 0 );
		$end   = ( clone $start )->modify( '+30 minutes' );

		$defaults = array(
			'hash_id'     => wp_generate_password( 32, false, false ),
			'event_id'    => $this->event_id,
			'calendar_id' => $this->calendar_id,
			'contact_id'  => $this->contact_id,
			'start_time'  => $start->format( 'Y-m-d H:i:s' ),
			'end_time'    => $end->format( 'Y-m-d H:i:s' ),
			'slot_time'   => 30,
			'status'      => $status,
			'source'      => 'event-page',
			'event_url'   => home_url(),
		);

		$booking = new BookingModel();
		foreach ( array_merge( $defaults, $overrides ) as $k => $v ) {
			$booking->{$k} = $v;
		}
		$booking->save();
		return $booking;
	}

	/* -----------------------------------------------------------------
	 *  1. Tail hook fires for every lifecycle event (full surface)
	 * --------------------------------------------------------------- */

	public function test_every_lifecycle_event_fires_tail_hook_once(): void {
		$this->subscribe_tail_hooks();
		$booking = $this->make_booking( 'scheduled' );

		$events_with_context = array(
			'created'                => array( 'actor' => 'attendee' ),
			'confirmed'              => array( 'actor' => 'organizer' ),
			'rescheduled'            => array( 'actor' => 'organizer' ),
			'cancelled'              => array( 'actor' => 'attendee', 'reason' => 'change-of-plans' ),
			'completed'              => array(),
			'rejected'               => array( 'actor' => 'organizer' ),
			'pending'                => array( 'reason' => 'confirmation' ),
			'waiting_list_joined'    => array(),
			'waiting_list_available' => array(),
		);

		foreach ( $events_with_context as $event => $context ) {
			BookingEvents::emit( $event, (int) $booking->id, $context );
		}

		foreach ( $events_with_context as $event => $expected_ctx ) {
			$this->assertArrayHasKey( $event, $this->captured, "Tail hook missed for booking.{$event}" );
			$this->assertCount( 1, $this->captured[ $event ], "Tail hook should fire exactly once for booking.{$event}" );
			$this->assertSame( (int) $booking->id, $this->captured[ $event ][0]['booking_id'] );
			$this->assertSame( $expected_ctx, $this->captured[ $event ][0]['context'], "Context lost for booking.{$event}" );
		}
	}

	/* -----------------------------------------------------------------
	 *  2. Idempotency — replays do NOT re-run structured handlers
	 * --------------------------------------------------------------- */

	public function test_replaying_the_same_event_does_not_rerun_structured_handlers(): void {
		$booking = $this->make_booking( 'scheduled' );

		$first  = EventBus::dispatch( 'booking.created', $booking, array( 'actor' => 'attendee' ) );
		$second = EventBus::dispatch( 'booking.created', $booking, array( 'actor' => 'attendee' ) );

		foreach ( $first as $action => $status ) {
			$this->assertSame( 'completed', $status, "First dispatch of {$action} should complete" );
		}
		foreach ( $second as $action => $status ) {
			$this->assertSame( 'skipped:idempotent', $status, "Replay of {$action} must be skipped" );
		}

		$rows = WorkflowRunModel::where( 'booking_id', $booking->id )
			->where( 'event_name', 'booking.created' )
			->get();
		$this->assertGreaterThanOrEqual( 3, $rows->count(), 'Each default handler should leave a workflow_runs row' );
		foreach ( $rows as $row ) {
			$this->assertSame( 'completed', $row->status );
			$this->assertSame( 1, (int) $row->attempts, 'Idempotent replay must not bump attempts' );
		}
	}

	/* -----------------------------------------------------------------
	 *  3. release_slot structured handler really clears booked_slots
	 * --------------------------------------------------------------- */

	public function test_cancel_dispatch_releases_the_booked_slot(): void {
		$booking = $this->make_booking( 'scheduled' );

		BookedSlotModel::acquire(
			$this->calendar_id,
			$booking->start_time,
			$booking->end_time,
			$booking->id,
			$this->event_id
		);
		$this->assert_table_row_count( 'booking_booked_slots', 1, 'booking_id = ' . (int) $booking->id );

		BookingEvents::emit( 'cancelled', (int) $booking->id, array( 'actor' => 'attendee' ) );

		$this->assert_table_row_count( 'booking_booked_slots', 0, 'booking_id = ' . (int) $booking->id );

		$run = WorkflowRunModel::where( 'booking_id', $booking->id )
			->where( 'event_name', 'booking.cancelled' )
			->where( 'action_name', 'release_slot' )
			->first();
		$this->assertNotNull( $run );
		$this->assertSame( 'completed', $run->status );
	}

	/* -----------------------------------------------------------------
	 *  4. Handler failure marks workflow_run as pending + schedules retry
	 * --------------------------------------------------------------- */

	public function test_handler_throwing_marks_workflow_run_failed_and_arms_retry(): void {
		$booking = $this->make_booking( 'scheduled' );

		add_filter(
			'doublescale_booking_event_handlers',
			static function ( $handlers, $event, $b ) {
				if ( 'booking.created' === $event ) {
					$handlers['will_blow_up'] = static function () {
						throw new \RuntimeException( 'boom' );
					};
				}
				return $handlers;
			},
			10,
			3
		);

		$result = EventBus::dispatch( 'booking.created', $booking );

		$this->assertSame( 'failed:boom', $result['will_blow_up'] );

		$run = WorkflowRunModel::where( 'booking_id', $booking->id )
			->where( 'action_name', 'will_blow_up' )
			->first();
		$this->assertNotNull( $run );
		$this->assertSame( 'pending', $run->status, 'First failure should leave row pending for retry' );
		$this->assertSame( 'boom', $run->error_message );
		$this->assertSame( 1, (int) $run->attempts );
		$this->assertNotNull( $run->next_retry_at, 'A retry timestamp must be armed' );
		$this->assertGreaterThan( gmdate( 'Y-m-d H:i:s' ), $run->next_retry_at );
	}

	/* -----------------------------------------------------------------
	 *  5. Pro lifecycle triggers wire to the right tail hook, slug, group
	 * --------------------------------------------------------------- */

	public function test_pro_lifecycle_trigger_metadata(): void {
		if ( ! class_exists( BookingCreated::class ) ) {
			$this->markTestSkipped( 'Pro plugin not loaded' );
		}

		$expected = array(
			BookingCreated::class     => 'booking_created',
			BookingConfirmed::class   => 'booking_confirmed',
			BookingCancelled::class   => 'booking_cancelled',
			BookingRescheduled::class => 'booking_rescheduled',
			BookingCompleted::class   => 'booking_completed',
		);

		foreach ( $expected as $class => $slug ) {
			$trigger = new $class();
			$this->assertSame( $slug,      $trigger->slug );
			$this->assertSame( 'booking',  $trigger->source );
			$this->assertSame( 'booking',  $trigger->group );
		}
	}

	/**
	 * The Pro trigger maps `slug=booking_{event}` to the tail hook
	 * `doublescale_booking_{event}`, then enrolls the booking's contact
	 * into every active automation whose `trigger` column matches `$slug`.
	 *
	 * We can't subclass the final Pro classes, so we spy on the boundary
	 * Trigger::process() reaches: AutomationModel::get_automations_by_trigger().
	 * Each lifecycle event should return exactly the automation row keyed
	 * to its slug.
	 */
	public function test_pro_trigger_query_isolates_automations_by_slug(): void {
		if ( ! class_exists( BookingCreated::class ) ) {
			$this->markTestSkipped( 'Pro plugin not loaded' );
		}

		global $wpdb;
		$automations = array();
		foreach (
			array(
				'booking_created',
				'booking_confirmed',
				'booking_cancelled',
				'booking_rescheduled',
				'booking_completed',
			) as $slug
		) {
			$wpdb->insert(
				$wpdb->prefix . 'doublescale_automations',
				array(
					'name'       => 'Auto for ' . $slug,
					'trigger'    => $slug,
					'status'     => 'active',
					'created_at' => current_time( 'mysql', true ),
					'updated_at' => current_time( 'mysql', true ),
				)
			);
			$automations[ $slug ] = (int) $wpdb->insert_id;
		}

		foreach ( $automations as $slug => $expected_id ) {
			$rows = \DoubleScale\Modules\Automations\Models\AutomationModel::get_automations_by_trigger( $slug );
			$this->assertCount( 1, $rows, "Slug {$slug} should resolve to exactly one active automation" );
			$this->assertSame( $expected_id, (int) $rows->first()->id );
		}

		// And a draft automation must not be returned (only active ones fire).
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_automations',
			array(
				'name'       => 'Draft Booking Created',
				'trigger'    => 'booking_created',
				'status'     => 'draft',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$rows = \DoubleScale\Modules\Automations\Models\AutomationModel::get_automations_by_trigger( 'booking_created' );
		$this->assertCount( 1, $rows, 'Draft automations must not be returned to a trigger' );
	}

	/**
	 * Verify the abstract guard in {@see AbstractBookingLifecycleTrigger::handle_booking_event()}:
	 * non-BookingModel payloads and bookings missing a contact must NOT
	 * reach Trigger::process(). We assert no automation gets enrolled.
	 */
	public function test_pro_trigger_guards_drop_invalid_payloads(): void {
		if ( ! class_exists( BookingCreated::class ) ) {
			$this->markTestSkipped( 'Pro plugin not loaded' );
		}

		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_automations',
			array(
				'name'       => 'Booking Created Automation',
				'trigger'    => 'booking_created',
				'status'     => 'active',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);

		( new BookingCreated() )->load_hooks();

		// Garbage payload — should be ignored cleanly without errors.
		do_action( 'doublescale_booking_created', 'not-a-booking', array() );

		// Booking with no contact relation (dangling FK) — handle_booking_event()
		// bails before reaching process().
		$orphan = $this->make_booking( 'scheduled', array( 'contact_id' => 999999 ) );

		// Manually fire the tail hook so we don't double-count via EventBus structured handlers.
		do_action( 'doublescale_booking_created', $orphan, array() );

		// Neither path should enroll a contact into the automation.
		$count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}doublescale_automation_contacts" );
		$this->assertSame( 0, $count, 'Trigger guards must drop both invalid payloads' );
	}

	/* -----------------------------------------------------------------
	 *  7. BookingActions action-verb mapping → lifecycle event
	 * --------------------------------------------------------------- */

	public function test_booking_actions_action_to_lifecycle_event_mapping(): void {
		$ref    = new \ReflectionClass( BookingActions::class );
		$method = $ref->getMethod( 'action_to_lifecycle_event' );
		$method->setAccessible( true );

		$this->assertSame( 'rejected',    $method->invoke( null, 'reject' ) );
		$this->assertSame( 'confirmed',   $method->invoke( null, 'confirm' ) );
		$this->assertSame( 'rescheduled', $method->invoke( null, 'reschedule' ) );
		$this->assertSame( 'cancelled',   $method->invoke( null, 'cancel' ) );
		$this->assertNull( $method->invoke( null, 'unknown-verb' ) );
	}

	/* -----------------------------------------------------------------
	 *  8. BookingJobs auto-completion emits `completed` once
	 * --------------------------------------------------------------- */

	public function test_booking_jobs_mark_completed_emits_completed_event(): void {
		$this->subscribe_tail_hooks();

		// Place the booking comfortably in the past so the completion path is valid.
		$start = ( new \DateTime( '-2 hours', new \DateTimeZone( 'UTC' ) ) );
		$end   = ( clone $start )->modify( '+30 minutes' );
		$booking = $this->make_booking(
			'scheduled',
			array(
				'start_time' => $start->format( 'Y-m-d H:i:s' ),
				'end_time'   => $end->format( 'Y-m-d H:i:s' ),
			)
		);

		$jobs = new BookingJobs();
		$jobs->mark_booking_completed( (int) $booking->id );

		$booking->refresh();
		$this->assertSame( 'completed', $booking->status );
		$this->assertCount( 1, $this->captured['completed'] ?? array(), '`completed` tail hook should fire exactly once' );
	}

	public function test_booking_jobs_does_not_re_complete_an_already_completed_booking(): void {
		$this->subscribe_tail_hooks();

		$booking = $this->make_booking( 'completed' );
		$jobs    = new BookingJobs();
		$jobs->mark_booking_completed( (int) $booking->id );

		$this->assertArrayNotHasKey( 'completed', $this->captured, 'No event for an already-completed booking' );
	}

	public function test_booking_jobs_skips_cancelled_booking(): void {
		$this->subscribe_tail_hooks();

		$booking = $this->make_booking( 'cancelled' );
		$jobs    = new BookingJobs();
		$jobs->mark_booking_completed( (int) $booking->id );

		$booking->refresh();
		$this->assertSame( 'cancelled', $booking->status );
		$this->assertArrayNotHasKey( 'completed', $this->captured );
	}

	/* -----------------------------------------------------------------
	 *  9. Context bag round-trips through workflow_runs.payload
	 * --------------------------------------------------------------- */

	public function test_context_bag_is_persisted_in_workflow_runs_payload(): void {
		$booking = $this->make_booking( 'scheduled' );

		$context = array(
			'actor'  => 'system',
			'reason' => 'payment_timeout',
		);
		BookingEvents::emit( 'cancelled', (int) $booking->id, $context );

		$run = WorkflowRunModel::where( 'booking_id', $booking->id )
			->where( 'event_name', 'booking.cancelled' )
			->where( 'action_name', 'release_slot' )
			->first();
		$this->assertNotNull( $run );
		$payload = maybe_unserialize( $run->payload );
		$this->assertSame( $context, $payload );
	}

	/* -----------------------------------------------------------------
	 * 10. Custom event_handlers filter additions run alongside defaults
	 * --------------------------------------------------------------- */

	public function test_filter_can_add_a_third_party_handler(): void {
		$booking      = $this->make_booking( 'scheduled' );
		$ran_with_id  = 0;

		add_filter(
			'doublescale_booking_event_handlers',
			function ( $handlers, $event, $b ) use ( &$ran_with_id ) {
				if ( 'booking.confirmed' === $event ) {
					$handlers['third_party_action'] = function ( $bk, $ctx ) use ( &$ran_with_id ) {
						$ran_with_id = (int) $bk->id;
						return array( 'ok' => true );
					};
				}
				return $handlers;
			},
			10,
			3
		);

		$result = EventBus::dispatch( 'booking.confirmed', $booking );

		$this->assertSame( (int) $booking->id, $ran_with_id );
		$this->assertSame( 'completed', $result['third_party_action'] );
	}
}
