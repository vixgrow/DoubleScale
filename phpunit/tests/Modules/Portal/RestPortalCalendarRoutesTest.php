<?php
/**
 * Client Portal calendar feed: route registration + request-window logic.
 *
 * The shim suite does not boot WordPress/Eloquent, so the DB-backed event
 * shaping (Booking/Sales providers) is covered by the live E2E. What we lock
 * here is the controller's pure window contract — the part most likely to
 * regress and the home of the end-of-day boundary fix:
 *
 *   - the route is registered with a callable handler + permission callback;
 *   - `resolve_window()` normalizes/validates the dates, clamps the span, and
 *     builds the INCLUSIVE end-of-day bound (so a timed booking on the window's
 *     last day isn't dropped by the datetime-vs-date midnight trap).
 *
 * @package DoubleScale\Tests\Modules\Portal
 */

namespace DoubleScale\Tests\Modules\Portal;

use DoubleScale\Modules\Portal\Rest\Controllers\RestPortalCalendarController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestUtil.php';

/**
 * @group smoke
 */
final class RestPortalCalendarRoutesTest extends TestCase {

	public function test_registers_calendar_route_with_callable_handlers(): void {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( RestPortalCalendarController::class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		$endpoints = doublescale_rest_collect_flat_endpoints();
		$routes    = array_map(
			static function ( array $ep ): string {
				return (string) $ep['route'];
			},
			$endpoints
		);

		$this->assertContains( '/portal/calendar', $routes );

		foreach ( $endpoints as $ep ) {
			$this->assertIsCallable( $ep['callback'], 'calendar callback' );
			$this->assertIsCallable( $ep['permission'], 'calendar permission_callback' );
		}
	}

	/**
	 * The upper bound is normalized to an inclusive end-of-day. This is the
	 * end-of-day boundary fix: without the ` 23:59:59`, a `start_time` datetime
	 * compared against a bare `Y-m-d` end expands to midnight and silently drops
	 * the last day's timed rows.
	 */
	public function test_resolve_window_builds_inclusive_end_of_day(): void {
		$window = RestPortalCalendarController::resolve_window( '2026-06-01', '2026-06-30' );

		$this->assertNotNull( $window );
		$this->assertSame( '2026-06-01', $window[0] );
		$this->assertSame(
			'2026-06-30 23:59:59',
			$window[1],
			'End bound must be an inclusive end-of-day so timed rows on the last day are not dropped.'
		);
	}

	/**
	 * An oversized window is clamped to MAX_SPAN_DAYS (92), still as an inclusive
	 * end-of-day, so no provider is asked to scan its whole table.
	 */
	public function test_resolve_window_clamps_oversized_span(): void {
		$window = RestPortalCalendarController::resolve_window( '2026-01-01', '2030-12-31' );

		$this->assertNotNull( $window );
		$this->assertSame( '2026-01-01', $window[0] );
		// 2026-01-01 + 92 days = 2026-04-03.
		$this->assertSame( '2026-04-03 23:59:59', $window[1] );
	}

	/**
	 * A window within the cap is returned verbatim (no clamping side effects).
	 */
	public function test_resolve_window_keeps_in_range_span(): void {
		$window = RestPortalCalendarController::resolve_window( '2026-06-01', '2026-06-15' );

		$this->assertNotNull( $window );
		$this->assertSame( array( '2026-06-01', '2026-06-15 23:59:59' ), $window );
	}

	/**
	 * @dataProvider invalid_window_provider
	 *
	 * @param string $start Raw start.
	 * @param string $end   Raw end.
	 */
	public function test_resolve_window_rejects_invalid_input( string $start, string $end ): void {
		$this->assertNull(
			RestPortalCalendarController::resolve_window( $start, $end ),
			"Window ({$start}, {$end}) must be rejected."
		);
	}

	/**
	 * @return array<string, array{0:string,1:string}>
	 */
	public static function invalid_window_provider(): array {
		return array(
			'end before start'    => array( '2026-06-30', '2026-06-01' ),
			'non-date start'      => array( 'yesterday', '2026-06-30' ),
			'impossible calendar' => array( '2026-13-40', '2026-06-30' ),
			'empty start'         => array( '', '2026-06-30' ),
			'datetime not date'   => array( '2026-06-01 09:00:00', '2026-06-30' ),
			'sql injection-ish'    => array( "2026-06-01'; DROP", '2026-06-30' ),
		);
	}
}
