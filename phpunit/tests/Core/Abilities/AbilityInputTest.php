<?php
/**
 * Input validation for write abilities.
 *
 * The messages are the product here: an agent told "invalid status" retries
 * blindly, one told "status must be one of: pending, completed" fixes itself.
 * These tests pin that the allowed set actually reaches the caller.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityInput;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class AbilityInputTest extends TestCase {

	public function test_required_passes_when_fields_present(): void {
		$this->assertNull(
			AbilityInput::required( array( 'title' => 'Follow up', 'contact_id' => 4 ), array( 'title', 'contact_id' ) )
		);
	}

	public function test_required_names_every_missing_field(): void {
		$error = AbilityInput::required( array( 'title' => 'x' ), array( 'title', 'contact_id', 'due_date' ) );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertStringContainsString( 'contact_id', $error->get_error_message() );
		$this->assertStringContainsString( 'due_date', $error->get_error_message() );
		$this->assertSame( array( 'contact_id', 'due_date' ), $error->get_error_data()['missing'] );
		$this->assertSame( 400, $error->get_error_data()['status'] );
	}

	/**
	 * 0 is a real value — treating it as missing would reject legitimate input
	 * such as a zero amount or a zero-index position.
	 */
	public function test_required_accepts_zero_as_a_value(): void {
		$this->assertNull( AbilityInput::required( array( 'amount' => 0 ), array( 'amount' ) ) );
		$this->assertNull( AbilityInput::required( array( 'amount' => '0' ), array( 'amount' ) ) );
	}

	public function test_enum_accepts_a_valid_value(): void {
		$this->assertNull( AbilityInput::enum( 'pending', array( 'pending', 'completed' ), 'status' ) );
	}

	/**
	 * The whole point: the refusal has to carry what WOULD have worked.
	 */
	public function test_enum_error_lists_the_allowed_values(): void {
		$error = AbilityInput::enum( 'nope', array( 'pending', 'completed' ), 'status' );

		$this->assertInstanceOf( \WP_Error::class, $error );
		$this->assertStringContainsString( 'status', $error->get_error_message() );
		$this->assertStringContainsString( 'pending', $error->get_error_message() );
		$this->assertStringContainsString( 'completed', $error->get_error_message() );
		$this->assertSame( array( 'pending', 'completed' ), $error->get_error_data()['allowed'] );
	}

	/**
	 * Absent is not invalid — optional fields must not be forced through enum.
	 */
	public function test_enum_ignores_absent_values(): void {
		$this->assertNull( AbilityInput::enum( null, array( 'a' ), 'status' ) );
		$this->assertNull( AbilityInput::enum( '', array( 'a' ), 'status' ) );
	}

	public function test_date_accepts_a_real_date(): void {
		$this->assertNull( AbilityInput::date( '2026-08-12', 'due_date' ) );
	}

	public function test_date_rejects_malformed_input(): void {
		foreach ( array( '12-08-2026', '2026/08/12', 'next friday', '20260812' ) as $bad ) {
			$this->assertInstanceOf( \WP_Error::class, AbilityInput::date( $bad, 'due_date' ), $bad . ' should be rejected' );
		}
	}

	/**
	 * A shape-only check would accept this and store a due date that does not
	 * exist, which surfaces later as a silently wrong reminder.
	 */
	public function test_date_rejects_impossible_calendar_dates(): void {
		$this->assertInstanceOf( \WP_Error::class, AbilityInput::date( '2026-02-31', 'due_date' ) );
		$this->assertInstanceOf( \WP_Error::class, AbilityInput::date( '2026-13-01', 'due_date' ) );
	}

	public function test_id_requires_a_positive_integer(): void {
		$this->assertNull( AbilityInput::id( 5, 'contact_id' ) );
		$this->assertNull( AbilityInput::id( '5', 'contact_id' ) );
		$this->assertInstanceOf( \WP_Error::class, AbilityInput::id( 0, 'contact_id' ) );
		$this->assertInstanceOf( \WP_Error::class, AbilityInput::id( -3, 'contact_id' ) );
		$this->assertInstanceOf( \WP_Error::class, AbilityInput::id( 'abc', 'contact_id' ) );
	}

	public function test_first_error_returns_the_earliest_failure(): void {
		$first  = AbilityInput::enum( 'bad', array( 'a' ), 'status' );
		$second = AbilityInput::date( 'bad', 'due_date' );

		$this->assertSame( $first, AbilityInput::first_error( array( null, $first, $second ) ) );
		$this->assertNull( AbilityInput::first_error( array( null, null ) ) );
	}
}
