<?php
/**
 * BookingValidator contract — hash/event lookup, start-date and duration rules.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Booking;

use DateTime;
use DateTimeZone;
use DoubleScale\Modules\Booking\Exceptions\BookingNotFoundException;
use DoubleScale\Modules\Booking\Exceptions\InvalidBookingHashException;
use DoubleScale\Modules\Booking\Services\BookingValidator;
use Exception;
use PHPUnit\Framework\TestCase;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

/**
 * Stand-in for BookingModel: getByHashId() answers from a static map.
 */
class BookingValidatorFakeBooking {

	/**
	 * Hash id => value returned by getByHashId().
	 *
	 * @var array
	 */
	public static $records = array();

	/**
	 * Hash ids getByHashId() was called with, in order.
	 *
	 * @var array
	 */
	public static $calls = array();

	/**
	 * @param mixed $hash_id Hash id.
	 * @return mixed
	 */
	public static function getByHashId( $hash_id ) { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
		self::$calls[] = $hash_id;

		return self::$records[ $hash_id ] ?? null;
	}
}

/**
 * Stand-in for EventModel: find() answers from a static map.
 */
class BookingValidatorFakeEvent {

	/**
	 * Event id => value returned by find().
	 *
	 * @var array
	 */
	public static $records = array();

	/**
	 * Ids find() was called with, in order.
	 *
	 * @var array
	 */
	public static $calls = array();

	/**
	 * @param mixed $id Event id.
	 * @return mixed
	 */
	public static function find( $id ) {
		self::$calls[] = $id;

		return self::$records[ $id ] ?? null;
	}
}

/**
 * @group smoke
 */
class BookingValidatorTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();

		BookingValidatorFakeBooking::$records = array();
		BookingValidatorFakeBooking::$calls   = array();
		BookingValidatorFakeEvent::$records   = array();
		BookingValidatorFakeEvent::$calls     = array();
	}

	/* ---------------------------------------------------------------------
	 * validate_booking()
	 * ------------------------------------------------------------------ */

	/**
	 * A known hash id resolves to the stored booking.
	 */
	public function test_validate_booking_returns_the_matching_record(): void {
		$booking = (object) array( 'id' => 7 );

		BookingValidatorFakeBooking::$records['abc123'] = $booking;

		$this->assertSame(
			$booking,
			BookingValidator::validate_booking( 'abc123', BookingValidatorFakeBooking::class )
		);
		$this->assertSame( array( 'abc123' ), BookingValidatorFakeBooking::$calls );
	}

	/**
	 * A well-formed but unknown hash is "not found", not "invalid hash" — the
	 * cancel/reschedule pages render different copy for the two cases.
	 */
	public function test_validate_booking_throws_not_found_for_unknown_hash(): void {
		$this->expectException( BookingNotFoundException::class );

		BookingValidator::validate_booking( 'missing-hash', BookingValidatorFakeBooking::class );
	}

	/**
	 * An empty hash never reaches the database.
	 *
	 * @dataProvider provide_empty_hash_ids
	 * @param mixed $hash_id Falsy hash id.
	 */
	public function test_validate_booking_rejects_empty_hash_without_a_lookup( $hash_id ): void {
		try {
			BookingValidator::validate_booking( $hash_id, BookingValidatorFakeBooking::class );
			$this->fail( 'Expected InvalidBookingHashException.' );
		} catch ( InvalidBookingHashException $e ) {
			$this->assertSame(
				array(),
				BookingValidatorFakeBooking::$calls,
				'An empty hash id must short-circuit before the model lookup.'
			);
		}
	}

	/**
	 * @return array<string, array{0: mixed}>
	 */
	public static function provide_empty_hash_ids(): array {
		return array(
			'empty string' => array( '' ),
			'null'         => array( null ),
			'zero int'     => array( 0 ),
			'zero string'  => array( '0' ),
			'empty array'  => array( array() ),
			'false'        => array( false ),
		);
	}

	/* ---------------------------------------------------------------------
	 * validate_event()
	 * ------------------------------------------------------------------ */

	/**
	 * A numeric id resolves to the stored event.
	 */
	public function test_validate_event_returns_the_matching_record(): void {
		$event = (object) array( 'id' => 42 );

		BookingValidatorFakeEvent::$records[42] = $event;

		$this->assertSame(
			$event,
			BookingValidator::validate_event( 42, BookingValidatorFakeEvent::class )
		);
	}

	/**
	 * A numeric string is normalised to an int before lookup, so "42" and 42
	 * hit the same record rather than missing on a string key.
	 */
	public function test_validate_event_normalises_numeric_strings(): void {
		$event = (object) array( 'id' => 42 );

		BookingValidatorFakeEvent::$records[42] = $event;

		$this->assertSame(
			$event,
			BookingValidator::validate_event( '42', BookingValidatorFakeEvent::class )
		);
		$this->assertSame( array( 42 ), BookingValidatorFakeEvent::$calls );
	}

	/**
	 * Non-numeric and non-positive ids are rejected before the lookup.
	 *
	 * @dataProvider provide_invalid_event_ids
	 * @param mixed $event_id Rejected event id.
	 */
	public function test_validate_event_rejects_invalid_ids_without_a_lookup( $event_id ): void {
		try {
			BookingValidator::validate_event( $event_id, BookingValidatorFakeEvent::class );
			$this->fail( 'Expected an exception for event id.' );
		} catch ( Exception $e ) {
			$this->assertSame( 'Invalid event ID.', $e->getMessage() );
			$this->assertSame( array(), BookingValidatorFakeEvent::$calls );
		}
	}

	/**
	 * @return array<string, array{0: mixed}>
	 */
	public static function provide_invalid_event_ids(): array {
		return array(
			'zero'         => array( 0 ),
			'non-numeric'  => array( 'abc' ),
			'empty string' => array( '' ),
			'null'         => array( null ),
		);
	}

	/**
	 * A negative id does NOT short-circuit: absint() takes the absolute value,
	 * so -5 is looked up as event 5. Documented rather than asserted as a
	 * rejection, because callers passing a negative id get a real event back
	 * instead of an error.
	 */
	public function test_validate_event_treats_a_negative_id_as_its_absolute_value(): void {
		$event = (object) array( 'id' => 5 );

		BookingValidatorFakeEvent::$records[5] = $event;

		$this->assertSame(
			$event,
			BookingValidator::validate_event( -5, BookingValidatorFakeEvent::class ),
			'absint() flips the sign, so -5 resolves to event 5.'
		);
		$this->assertSame( array( 5 ), BookingValidatorFakeEvent::$calls );
	}

	/**
	 * A valid id with no matching row reports "Invalid event.", distinct from
	 * the "Invalid event ID." rejection above.
	 */
	public function test_validate_event_reports_missing_event_distinctly(): void {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Invalid event.' );

		BookingValidator::validate_event( 999, BookingValidatorFakeEvent::class );
	}

	/* ---------------------------------------------------------------------
	 * validate_start_date()
	 * ------------------------------------------------------------------ */

	/**
	 * A future date is returned as a DateTime in the requested zone.
	 */
	public function test_validate_start_date_accepts_a_future_date(): void {
		$future = ( new DateTime( '+3 days', new DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d H:i:s' );

		$result = BookingValidator::validate_start_date( $future, 'UTC' );

		$this->assertInstanceOf( DateTime::class, $result );
		$this->assertSame( 'UTC', $result->getTimezone()->getName() );
		$this->assertSame( $future, $result->format( 'Y-m-d H:i:s' ) );
	}

	/**
	 * A past date is refused — this is what stops a slot being booked
	 * retroactively.
	 */
	public function test_validate_start_date_rejects_a_past_date(): void {
		$past = ( new DateTime( '-1 day', new DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d H:i:s' );

		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Date must be in the future' );

		BookingValidator::validate_start_date( $past, 'UTC' );
	}

	/**
	 * "Now" is not in the future: the comparison is <=, so an exactly-now slot
	 * is refused rather than racing into a booked past slot.
	 */
	public function test_validate_start_date_rejects_now(): void {
		$now = ( new DateTime( 'now', new DateTimeZone( 'UTC' ) ) )->format( 'Y-m-d H:i:s' );

		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Date must be in the future' );

		BookingValidator::validate_start_date( $now, 'UTC' );
	}

	/**
	 * The date is judged against the supplied zone, not server time. A moment
	 * that is future in UTC stays future when expressed in Tokyo.
	 */
	public function test_validate_start_date_is_evaluated_in_the_supplied_timezone(): void {
		$tokyo  = new DateTimeZone( 'Asia/Tokyo' );
		$future = ( new DateTime( '+2 days', $tokyo ) )->format( 'Y-m-d H:i:s' );

		$result = BookingValidator::validate_start_date( $future, 'Asia/Tokyo' );

		$this->assertSame( 'Asia/Tokyo', $result->getTimezone()->getName() );
		$this->assertGreaterThan( time(), $result->getTimestamp() );
	}

	/**
	 * A missing date or zone is refused before any DateTime parsing.
	 *
	 * @dataProvider provide_missing_start_date_args
	 * @param mixed $start_date Start date.
	 * @param mixed $timezone   Timezone.
	 */
	public function test_validate_start_date_requires_both_arguments( $start_date, $timezone ): void {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Invalid start date or timezone provided.' );

		BookingValidator::validate_start_date( $start_date, $timezone );
	}

	/**
	 * @return array<string, array{0: mixed, 1: mixed}>
	 */
	public static function provide_missing_start_date_args(): array {
		return array(
			'no date'     => array( '', 'UTC' ),
			'no timezone' => array( '2099-01-01 10:00:00', '' ),
			'neither'     => array( '', '' ),
			'null date'   => array( null, 'UTC' ),
		);
	}

	/**
	 * An unknown timezone is reported as a format/timezone error rather than
	 * escaping as a raw PHP exception.
	 */
	public function test_validate_start_date_rejects_an_unknown_timezone(): void {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Invalid date format or timezone' );

		BookingValidator::validate_start_date( '2099-01-01 10:00:00', 'Mars/Olympus_Mons' );
	}

	/**
	 * An unparseable date string is reported the same way.
	 */
	public function test_validate_start_date_rejects_an_unparseable_date(): void {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Invalid date format or timezone' );

		BookingValidator::validate_start_date( 'not-a-date', 'UTC' );
	}

	/* ---------------------------------------------------------------------
	 * validate_duration()
	 * ------------------------------------------------------------------ */

	/**
	 * A positive duration is returned as an int.
	 */
	public function test_validate_duration_accepts_a_positive_value(): void {
		$this->assertSame( 30, BookingValidator::validate_duration( 30 ) );
		$this->assertSame( 45, BookingValidator::validate_duration( '45' ) );
	}

	/**
	 * A fractional duration truncates to whole minutes rather than being
	 * rejected.
	 */
	public function test_validate_duration_truncates_fractional_values(): void {
		$this->assertSame( 30, BookingValidator::validate_duration( 30.9 ) );
	}

	/**
	 * When the supplied duration is unusable the event default takes over —
	 * this is the path a booking form with no explicit duration relies on.
	 *
	 * @dataProvider provide_unusable_durations
	 * @param mixed $duration Unusable duration input.
	 */
	public function test_validate_duration_falls_back_to_the_default( $duration ): void {
		$this->assertSame( 60, BookingValidator::validate_duration( $duration, 60 ) );
	}

	/**
	 * @return array<string, array{0: mixed}>
	 */
	public static function provide_unusable_durations(): array {
		return array(
			'zero'         => array( 0 ),
			'negative'     => array( -15 ),
			'null'         => array( null ),
			'empty string' => array( '' ),
			'non-numeric'  => array( 'abc' ),
		);
	}

	/**
	 * A usable duration wins over the default rather than being overridden.
	 */
	public function test_validate_duration_prefers_the_explicit_value(): void {
		$this->assertSame( 15, BookingValidator::validate_duration( 15, 60 ) );
	}

	/**
	 * With neither a usable duration nor a usable default, the booking is
	 * refused instead of silently becoming zero-length.
	 *
	 * @dataProvider provide_unusable_duration_pairs
	 * @param mixed $duration Duration input.
	 * @param mixed $default  Default input.
	 */
	public function test_validate_duration_throws_when_nothing_is_usable( $duration, $default ): void {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Invalid duration. Must be a positive number.' );

		BookingValidator::validate_duration( $duration, $default );
	}

	/**
	 * @return array<string, array{0: mixed, 1: mixed}>
	 */
	public static function provide_unusable_duration_pairs(): array {
		return array(
			'both zero'        => array( 0, 0 ),
			'both null'        => array( null, null ),
			'negative default' => array( 0, -30 ),
			'non-numeric both' => array( 'abc', 'def' ),
			'no default given' => array( 0, null ),
		);
	}
}
