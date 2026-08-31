<?php
/**
 * Contract for {@see \DoubleScale\Core\Utils\DateWithin}.
 *
 * @package DoubleScale\Tests\Core
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\Utils\DateWithin;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class DateWithinTest extends TestCase {

	public function test_parse_days_accepts_positive_integers(): void {
		$this->assertSame( 14, DateWithin::parse_days( 14 ) );
		$this->assertSame( 14, DateWithin::parse_days( '14' ) );
	}

	public function test_parse_days_rejects_dates_and_ranges(): void {
		$this->assertNull( DateWithin::parse_days( '2026-08-15' ) );
		$this->assertNull( DateWithin::parse_days( array( '2026-08-01', '2026-08-15' ) ) );
		$this->assertNull( DateWithin::parse_days( '' ) );
		$this->assertNull( DateWithin::parse_days( 0 ) );
		$this->assertNull( DateWithin::parse_days( -3 ) );
	}

	public function test_is_within_days_matches_a_recent_timestamp(): void {
		$this->assertTrue( DateWithin::is_within_days( gmdate( 'Y-m-d H:i:s' ), 1 ) );
		$this->assertTrue( DateWithin::is_within_days( gmdate( 'Y-m-d H:i:s', strtotime( '-13 days' ) ), 14 ) );
		$this->assertFalse( DateWithin::is_within_days( gmdate( 'Y-m-d H:i:s', strtotime( '-15 days' ) ), 14 ) );
	}

	public function test_cutoff_datetime_is_n_days_ago(): void {
		$expected = strtotime( '-14 days' );
		$cutoff   = strtotime( DateWithin::cutoff_datetime( 14 ) );

		$this->assertNotFalse( $cutoff );
		$this->assertEqualsWithDelta( $expected, $cutoff, 1 );
	}
}
