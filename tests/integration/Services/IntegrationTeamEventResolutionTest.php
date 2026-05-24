<?php
/**
 * Test how calendar integrations (Google/Outlook/Zoom/Apple) resolve the host
 * calendar for round-robin and collective bookings.
 *
 * The interesting behavior under test lives in
 * {@see \DoubleScale\Modules\Booking\Abstracts\Integration::get_integration_host_calendar_for_booking()}.
 *
 *   - host calendar  → returns itself
 *   - team calendar  → returns the team owner's host calendar (NOT the
 *                       host(s) actually assigned to the booking)
 *   - anything else  → walks $booking->hosts and returns the first host
 *                       that has a `type=host` calendar
 *
 * This routing means every team-event integration write (create / reschedule /
 * cancel) is performed against the team owner's third-party account — even for
 * a round-robin booking that was assigned to a non-owner host. Knowing that is
 * the contract, the tests below pin the behavior so any future refactor that
 * tries to spread writes per-host is forced to update the tests deliberately.
 *
 * @package DoubleScale\Tests\Integration\Services
 */

namespace DoubleScale\Tests\Integration\Services;

use DoubleScale\Modules\Booking\Abstracts\Integration as AbstractIntegration;
use DoubleScale\Modules\Booking\Models\BookedSlotModel;
use DoubleScale\Modules\Booking\Models\BookingHostsModel;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Booking\Models\CalendarModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class IntegrationTeamEventResolutionTest extends IntegrationTestCase {

	/** @var int */
	private $owner_id;

	/** @var int */
	private $host_b;

	/** @var int */
	private $host_c;

	/** @var int Team calendar (calendar_id used for bookings) */
	private $team_calendar_id;

	/** @var int Owner's personal host calendar (where team-event integration writes are sent) */
	private $owner_host_calendar_id;

	/** @var int Host B's personal host calendar (NOT used for team writes, but used for slot availability) */
	private $host_b_calendar_id;

	/** @var int Host C's personal host calendar */
	private $host_c_calendar_id;

	protected function setUp(): void {
		parent::setUp();
		$this->truncate_booking_tables();

		// `subscriber` role doesn't trigger the BookingProvisioner auto-create
		// of a host calendar — we want full control over which calendars exist
		// to keep the resolver assertions deterministic.
		$this->owner_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$this->host_b   = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$this->host_c   = self::factory()->user->create( array( 'role' => 'subscriber' ) );

		$this->team_calendar_id       = $this->make_calendar( 'team', $this->owner_id, 'Team Cal' );
		$this->owner_host_calendar_id = $this->make_calendar( 'host', $this->owner_id, 'Owner Host Cal' );
		$this->host_b_calendar_id     = $this->make_calendar( 'host', $this->host_b, 'Host B Cal' );
		$this->host_c_calendar_id     = $this->make_calendar( 'host', $this->host_c, 'Host C Cal' );

		// Persist team_members so EventModel slot logic can find the trio.
		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars_meta',
			array(
				'calendar_id' => $this->team_calendar_id,
				'meta_key'    => 'team_members',
				'meta_value'  => maybe_serialize( array( $this->owner_id, $this->host_b, $this->host_c ) ),
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

	private function make_calendar( string $type, int $user_id, string $name ): int {
		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars',
			array(
				'hash_id'    => wp_generate_password( 32, false, false ),
				'user_id'    => $user_id,
				'name'       => $name,
				'slug'       => sanitize_title( $name ) . '-' . wp_generate_password( 6, false, false ),
				'status'     => 'active',
				'type'       => $type,
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		return (int) $wpdb->insert_id;
	}

	private function make_event_for( int $calendar_id ): int {
		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_events',
			array(
				'hash_id'           => wp_generate_password( 32, false, false ),
				'calendar_id'       => $calendar_id,
				'user_id'           => $this->owner_id,
				'name'              => 'Stub Event',
				'slug'              => 'stub-' . wp_generate_password( 6, false, false ),
				'status'            => 'active',
				'type'              => 'one-to-one',
				'is_disabled'       => 0,
				'duration'          => 30,
				'color'             => '#0099ff',
				'visibility'        => 'public',
				'availability_type' => 'existing',
				'created_at'        => current_time( 'mysql', true ),
				'updated_at'        => current_time( 'mysql', true ),
			)
		);
		return (int) $wpdb->insert_id;
	}

	private function place_booking_on( int $calendar_id, array $host_ids ): BookingModel {
		$start = ( new \DateTime( '+1 day', new \DateTimeZone( 'UTC' ) ) )->setTime( 10, 0 );
		$end   = ( clone $start )->modify( '+30 minutes' );

		$booking              = new BookingModel();
		$booking->event_id    = $this->make_event_for( $calendar_id );
		$booking->calendar_id = $calendar_id;
		$booking->contact_id  = $this->make_contact();
		$booking->start_time  = $start->format( 'Y-m-d H:i:s' );
		$booking->end_time    = $end->format( 'Y-m-d H:i:s' );
		$booking->slot_time   = 30;
		$booking->status      = 'scheduled';
		$booking->source      = 'event-page';
		$booking->event_url   = home_url();
		$booking->save();

		BookedSlotModel::acquire( $calendar_id, $booking->start_time, $booking->end_time, (int) $booking->id );

		foreach ( $host_ids as $host_user_id ) {
			$row             = new BookingHostsModel();
			$row->booking_id = $booking->id;
			$row->user_id    = $host_user_id;
			$row->status     = 'scheduled';
			$row->save();
		}

		// Reload so $booking->hosts loads fresh relations.
		return BookingModel::find( $booking->id );
	}

	/**
	 * Helper that exposes the protected `get_integration_host_calendar_for_booking` method
	 * on the integration base class. We use reflection because the helper is `protected`
	 * and we don't want to instantiate a concrete integration (which would try to wire
	 * remote-data + REST controllers we don't have credentials for in the test env).
	 */
	private function resolve_integration_host( BookingModel $booking ): ?CalendarModel {
		$stub = new class() extends AbstractIntegration {
			public $name = 'Stub';
			public $slug = 'stub';
			public function __construct() {
				parent::__construct();
			}
			public function call_resolver( BookingModel $booking ): ?CalendarModel {
				return $this->get_integration_host_calendar_for_booking( $booking );
			}
		};

		return $stub->call_resolver( $booking );
	}

	/* -----------------------------------------------------------------
	 *  Host-calendar bookings — trivial passthrough
	 * --------------------------------------------------------------- */

	public function test_host_calendar_booking_returns_itself(): void {
		$booking = $this->place_booking_on( $this->owner_host_calendar_id, array( $this->owner_id ) );

		$resolved = $this->resolve_integration_host( $booking );
		$this->assertNotNull( $resolved );
		$this->assertSame( $this->owner_host_calendar_id, (int) $resolved->id );
		$this->assertSame( 'host', $resolved->type );
	}

	/* -----------------------------------------------------------------
	 *  Round-robin: ALWAYS routes to the team OWNER's host calendar,
	 *  regardless of which host was actually picked for this booking.
	 * --------------------------------------------------------------- */

	public function test_round_robin_booking_assigned_to_owner_routes_to_owner_host_calendar(): void {
		$booking  = $this->place_booking_on( $this->team_calendar_id, array( $this->owner_id ) );
		$resolved = $this->resolve_integration_host( $booking );

		$this->assertNotNull( $resolved );
		$this->assertSame( $this->owner_host_calendar_id, (int) $resolved->id, 'Owner host calendar should be the integration target' );
	}

	public function test_round_robin_booking_assigned_to_non_owner_still_routes_to_owner_host_calendar(): void {
		$booking = $this->place_booking_on( $this->team_calendar_id, array( $this->host_b ) );

		// Sanity: this booking is assigned to host B only.
		$attached_hosts = $booking->hosts->pluck( 'ID' )->toArray();
		$this->assertSame( array( $this->host_b ), array_map( 'intval', $attached_hosts ) );

		$resolved = $this->resolve_integration_host( $booking );

		$this->assertNotNull( $resolved );
		$this->assertSame(
			$this->owner_host_calendar_id,
			(int) $resolved->id,
			'Team RR routes to the OWNER\'s host calendar — NOT to host B\'s host calendar.'
		);
		$this->assertNotSame(
			$this->host_b_calendar_id,
			(int) $resolved->id,
			'Confirms the known limitation: host B\'s Google/Outlook account is never targeted for this booking.'
		);
	}

	/* -----------------------------------------------------------------
	 *  Collective: same single-calendar routing as round-robin
	 * --------------------------------------------------------------- */

	public function test_collective_booking_routes_only_to_owner_host_calendar(): void {
		$booking = $this->place_booking_on(
			$this->team_calendar_id,
			array( $this->owner_id, $this->host_b, $this->host_c )
		);

		$this->assertCount( 3, $booking->hosts, 'Booking should reference all three team members' );

		$resolved = $this->resolve_integration_host( $booking );

		$this->assertNotNull( $resolved );
		$this->assertSame( $this->owner_host_calendar_id, (int) $resolved->id );
	}

	/* -----------------------------------------------------------------
	 *  Fallback: when the team owner has NO host calendar, resolver
	 *  returns null (and the integration aborts the write gracefully)
	 * --------------------------------------------------------------- */

	public function test_team_booking_returns_null_when_owner_has_no_host_calendar(): void {
		global $wpdb;
		// Delete the owner's host calendar; team_calendar still exists.
		$wpdb->delete(
			$wpdb->prefix . 'doublescale_booking_calendars',
			array( 'id' => $this->owner_host_calendar_id )
		);

		$booking = $this->place_booking_on( $this->team_calendar_id, array( $this->host_b ) );

		$resolved = $this->resolve_integration_host( $booking );

		$this->assertNull(
			$resolved,
			'When team OWNER has no host calendar, resolver MUST return null — integrations skip the write rather than falling back to host B'
		);
	}

	/* -----------------------------------------------------------------
	 *  Unknown calendar type: walks the booking's host list and picks
	 *  the first host with a `type=host` calendar
	 * --------------------------------------------------------------- */

	public function test_unknown_calendar_type_falls_back_to_first_assigned_host_with_a_host_calendar(): void {
		global $wpdb;

		// Create a calendar with an exotic type that's neither `host` nor `team`.
		$wpdb->insert(
			$wpdb->prefix . 'doublescale_booking_calendars',
			array(
				'hash_id'    => wp_generate_password( 32, false, false ),
				'user_id'    => $this->owner_id,
				'name'       => 'Resource Cal',
				'slug'       => 'resource-' . wp_generate_password( 6, false, false ),
				'status'     => 'active',
				'type'       => 'resource',
				'created_at' => current_time( 'mysql', true ),
				'updated_at' => current_time( 'mysql', true ),
			)
		);
		$resource_calendar_id = (int) $wpdb->insert_id;

		// Booking attaches host_b first; resolver walks $booking->hosts in order.
		$booking = $this->place_booking_on( $resource_calendar_id, array( $this->host_b, $this->host_c ) );

		$resolved = $this->resolve_integration_host( $booking );

		$this->assertNotNull( $resolved );
		$this->assertSame(
			$this->host_b_calendar_id,
			(int) $resolved->id,
			'Resolver should pick host B\'s host calendar (first host in the booking with a matching host calendar)'
		);
	}

	/* -----------------------------------------------------------------
	 *  Lifecycle dispatch helper: invalid booking ids must not call the handler
	 * --------------------------------------------------------------- */

	public function test_register_booking_lifecycle_handlers_drops_invalid_payloads(): void {
		// Register a single-event dispatcher pointed at a method that records every call.
		$spy = new class() extends AbstractIntegration {
			public $name        = 'Spy';
			public $slug        = 'spy';
			public $invocations = array();

			public function __construct() {
				parent::__construct();
			}
			public function start_spying(): void {
				$this->register_booking_lifecycle_handlers(
					array( 'doublescale_booking_spied' => 'capture_booking' )
				);
			}
			public function capture_booking( BookingModel $booking ): void {
				$this->invocations[] = (int) $booking->id;
			}
		};

		$spy->start_spying();

		// 1. Valid id (resolved to BookingModel) → handler runs.
		$valid_booking = $this->place_booking_on( $this->owner_host_calendar_id, array( $this->owner_id ) );
		do_action( 'doublescale_booking_spied', (int) $valid_booking->id, array() );

		// 2. Junk inputs that resolve_booking() must reject — none of these should call the handler.
		do_action( 'doublescale_booking_spied', null, array() );
		do_action( 'doublescale_booking_spied', 0, array() );
		do_action( 'doublescale_booking_spied', -5, array() );
		do_action( 'doublescale_booking_spied', '   ', array() );
		do_action( 'doublescale_booking_spied', 'not-a-number', array() );
		do_action( 'doublescale_booking_spied', '12.5', array() );
		do_action( 'doublescale_booking_spied', array( 'id' => 1 ), array() );
		do_action( 'doublescale_booking_spied', 999999, array() ); // valid shape, unknown id.

		$this->assertSame(
			array( (int) $valid_booking->id ),
			$spy->invocations,
			'Only the legitimate booking id should reach the handler — every junk payload must be dropped at the resolver'
		);
	}

	/* -----------------------------------------------------------------
	 *  pick_host_account_for_default_calendar_sync — preference rules
	 *  the Google + Outlook integrations rely on when picking which
	 *  remote account to write to
	 * --------------------------------------------------------------- */

	public function test_account_picker_prefers_account_with_explicit_default_calendar(): void {
		$picker = new class() extends AbstractIntegration {
			public $name = 'Stub';
			public $slug = 'stub';
			public function __construct() {
				parent::__construct();
			}
			public function pick( array $integration_meta ): ?array {
				return $this->pick_host_account_for_default_calendar_sync( $integration_meta );
			}
		};

		$meta = array(
			'acct-no-default'      => array(
				'tokens' => array( 'access_token' => 'a' ),
				'config' => array(
					'calendars' => array( 'primary' ),
				),
			),
			'acct-explicit'        => array(
				'tokens' => array( 'access_token' => 'b' ),
				'config' => array(
					'calendars'        => array( 'primary', 'work', 'side' ),
					'default_calendar' => array(
						'calendar_id' => 'work',
						'account_id'  => 'acct-explicit',
					),
				),
			),
			'acct-also-no-default' => array(
				'tokens' => array( 'access_token' => 'c' ),
				'config' => array(
					'calendars' => array( 'primary', 'second' ),
				),
			),
		);

		$picked = $picker->pick( $meta );
		$this->assertNotNull( $picked );
		$this->assertSame( 'acct-explicit', $picked['id'], 'Account with explicit default_calendar wins' );
		$this->assertSame( 'work', $picked['default_calendar']['calendar_id'] );
	}

	public function test_account_picker_falls_back_to_only_account_with_single_enabled_calendar(): void {
		$picker = new class() extends AbstractIntegration {
			public $name = 'Stub';
			public $slug = 'stub';
			public function __construct() {
				parent::__construct();
			}
			public function pick( array $integration_meta ): ?array {
				return $this->pick_host_account_for_default_calendar_sync( $integration_meta );
			}
		};

		// No account has explicit default_calendar; only one of them lists a single calendar.
		$meta = array(
			'acct-many' => array(
				'tokens' => array( 'access_token' => 'a' ),
				'config' => array( 'calendars' => array( 'primary', 'side' ) ),
			),
			'acct-one'  => array(
				'tokens' => array( 'access_token' => 'b' ),
				'config' => array( 'calendars' => array( 'only-cal' ) ),
			),
		);

		$picked = $picker->pick( $meta );
		$this->assertNotNull( $picked );
		$this->assertSame( 'acct-one', $picked['id'] );
		$this->assertSame( 'only-cal', $picked['default_calendar']['calendar_id'] );
	}

	public function test_account_picker_returns_null_when_default_calendar_is_explicitly_null(): void {
		$picker = new class() extends AbstractIntegration {
			public $name = 'Stub';
			public $slug = 'stub';
			public function __construct() {
				parent::__construct();
			}
			public function pick( array $integration_meta ): ?array {
				return $this->pick_host_account_for_default_calendar_sync( $integration_meta );
			}
		};

		$meta = array(
			'acct-opted-out' => array(
				'tokens' => array( 'access_token' => 'a' ),
				'config' => array(
					'calendars'        => array( 'primary' ),
					'default_calendar' => null,
				),
			),
		);

		$this->assertNull( $picker->pick( $meta ), 'Explicit default_calendar=null means this account opted out of sync' );
	}
}
