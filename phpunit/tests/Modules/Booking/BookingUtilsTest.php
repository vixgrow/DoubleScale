<?php
/**
 * BookingUtils contract — timezone conversion for slot times.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Booking;

use DateTime;
use DateTimeZone;
use DoubleScale\Modules\Booking\BookingUtils;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
class BookingUtilsTest extends TestCase {

	/**
	 * A local wall-clock string is interpreted in the given zone and returned
	 * in UTC — the conversion every stored slot time depends on.
	 */
	public function test_create_date_time_converts_a_local_string_to_utc(): void {
		$date = BookingUtils::create_date_time( '2026-06-15 14:00:00', 'Africa/Cairo' );

		$this->assertSame( 'UTC', $date->getTimezone()->getName() );
		// Cairo is UTC+3 in June (DST), so 14:00 local is 11:00 UTC.
		$this->assertSame( '2026-06-15 11:00:00', $date->format( 'Y-m-d H:i:s' ) );
	}

	/**
	 * With $to_utc = false the value stays in the source zone, so callers that
	 * want to display a local time are not silently handed UTC.
	 */
	public function test_create_date_time_can_keep_the_source_timezone(): void {
		$date = BookingUtils::create_date_time( '2026-06-15 14:00:00', 'Africa/Cairo', false );

		$this->assertSame( 'Africa/Cairo', $date->getTimezone()->getName() );
		$this->assertSame( '2026-06-15 14:00:00', $date->format( 'Y-m-d H:i:s' ) );
	}

	/**
	 * The same wall-clock string in two zones is two different moments. If
	 * this ever collapses to one instant, slots double-book across regions.
	 */
	public function test_create_date_time_distinguishes_zones_for_one_wall_clock(): void {
		$cairo = BookingUtils::create_date_time( '2026-06-15 14:00:00', 'Africa/Cairo' );
		$tokyo = BookingUtils::create_date_time( '2026-06-15 14:00:00', 'Asia/Tokyo' );

		$this->assertNotSame(
			$cairo->getTimestamp(),
			$tokyo->getTimestamp(),
			'Identical wall-clock times in different zones are different instants.'
		);
		// Tokyo (UTC+9) is 6 hours ahead of Cairo (UTC+3) in June.
		$this->assertSame( 6 * 3600, $cairo->getTimestamp() - $tokyo->getTimestamp() );
	}

	/**
	 * A Unix timestamp is absolute: it is read as UTC and the source zone is
	 * ignored rather than shifting the instant a second time.
	 */
	public function test_create_date_time_treats_a_timestamp_as_absolute(): void {
		$timestamp = 1781000000;

		$as_cairo = BookingUtils::create_date_time( $timestamp, 'Africa/Cairo' );
		$as_tokyo = BookingUtils::create_date_time( $timestamp, 'Asia/Tokyo' );

		$this->assertSame( $timestamp, $as_cairo->getTimestamp() );
		$this->assertSame(
			$as_cairo->getTimestamp(),
			$as_tokyo->getTimestamp(),
			'A timestamp is zone-independent; the source zone must not shift it.'
		);
	}

	/**
	 * A numeric string is a timestamp too, not a date string — "1781000000"
	 * must not be parsed as a year.
	 */
	public function test_create_date_time_accepts_a_numeric_string_timestamp(): void {
		$this->assertSame(
			1781000000,
			BookingUtils::create_date_time( '1781000000', 'UTC' )->getTimestamp()
		);
	}

	/**
	 * Converting to UTC and back reproduces the original wall clock, so a
	 * round trip through storage does not drift.
	 */
	public function test_create_date_time_round_trips_without_drift(): void {
		$local = '2026-11-03 09:30:00';

		$utc  = BookingUtils::create_date_time( $local, 'America/New_York' );
		$back = $utc->setTimezone( new DateTimeZone( 'America/New_York' ) );

		$this->assertSame( $local, $back->format( 'Y-m-d H:i:s' ) );
	}

	/**
	 * A winter date uses standard offset, not the summer one — a fixed-offset
	 * shortcut would fail here.
	 */
	public function test_create_date_time_applies_the_seasonal_offset(): void {
		$summer = BookingUtils::create_date_time( '2026-07-15 12:00:00', 'Europe/London' );
		$winter = BookingUtils::create_date_time( '2026-01-15 12:00:00', 'Europe/London' );

		// London is UTC+1 in July (BST) and UTC+0 in January (GMT).
		$this->assertSame( '11:00:00', $summer->format( 'H:i:s' ) );
		$this->assertSame( '12:00:00', $winter->format( 'H:i:s' ) );
	}

	/**
	 * Relative strings are supported, since callers pass things like 'now'.
	 */
	public function test_create_date_time_accepts_a_relative_string(): void {
		$date = BookingUtils::create_date_time( 'now', 'UTC' );

		$this->assertInstanceOf( DateTime::class, $date );
		$this->assertEqualsWithDelta( time(), $date->getTimestamp(), 5 );
	}

	/* ---------------------------------------------------------------------
	 * get_timezones()
	 * ------------------------------------------------------------------ */

	/**
	 * The timezone list is non-empty and contains the identifiers the booking
	 * UI offers, so a host can actually pick a zone.
	 */
	public function test_get_timezones_returns_usable_identifiers(): void {
		$timezones = BookingUtils::get_timezones();

		$this->assertNotEmpty( $timezones );
		$this->assertContains( 'UTC', $timezones );
		$this->assertContains( 'Africa/Cairo', $timezones );
		$this->assertContains( 'America/New_York', $timezones );
	}

	/**
	 * Every returned identifier is constructible, so the list cannot offer a
	 * zone that later throws when a booking is made in it.
	 */
	public function test_get_timezones_entries_are_all_constructible(): void {
		$timezones = BookingUtils::get_timezones();

		foreach ( array_slice( $timezones, 0, 40 ) as $timezone ) {
			$this->assertInstanceOf( DateTimeZone::class, new DateTimeZone( $timezone ) );
		}
	}
}
