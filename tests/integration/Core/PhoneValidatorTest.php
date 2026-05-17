<?php
/**
 * Integration test for \DoubleScale\Core\Validators\PhoneValidator.
 *
 * Pure validator — no DB, no HTTP. Lives in the integration suite (rather
 * than fast) because validate() can log via doublescale_get_logger() which
 * needs the real logger from the plugin's container.
 *
 * @package DoubleScale\Tests\Integration\Core
 */

namespace DoubleScale\Tests\Integration\Core;

use DoubleScale\Core\Validators\PhoneValidator;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class PhoneValidatorTest extends IntegrationTestCase {

	/**
	 * @dataProvider valid_e164_numbers
	 */
	public function test_is_valid_accepts_valid_e164( string $phone ): void {
		$this->assertTrue( PhoneValidator::is_valid( $phone ), "Should accept: {$phone}" );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public function valid_e164_numbers(): array {
		return array(
			'us'        => array( '+1234567890' ),
			'uk'        => array( '+447975777666' ),
			'fr'        => array( '+33612345678' ),
			'de'        => array( '+4915123456789' ),
			'shortest'  => array( '+12345678' ),    // 8 digits total
			'longest'   => array( '+123456789012345' ), // 15 digits total
		);
	}

	/**
	 * @dataProvider invalid_phone_inputs
	 */
	public function test_is_valid_rejects_invalid_input( $phone ): void {
		$this->assertFalse( PhoneValidator::is_valid( $phone ), 'Should reject: ' . var_export( $phone, true ) );
	}

	/**
	 * @return array<string, array{0: mixed}>
	 */
	public function invalid_phone_inputs(): array {
		return array(
			'empty'             => array( '' ),
			'null'              => array( null ),
			'no_plus'           => array( '1234567890' ),
			'starts_with_zero'  => array( '+0234567890' ),  // first digit must be 1-9
			'too_short'         => array( '+1' ),
			'too_long'          => array( '+1234567890123456' ), // 16 digits
			'letters'           => array( '+12345abc' ),
			'spaces'            => array( '+1 234 567 890' ),
			'parens'            => array( '+1(234)5678900' ),
			'plus_only'         => array( '+' ),
		);
	}

	public function test_validate_returns_required_error_when_empty(): void {
		$result = PhoneValidator::validate( '' );
		$this->assertFalse( $result['valid'] );
		$this->assertSame( 'Phone number is required', $result['error'] );
	}

	public function test_validate_returns_format_error_for_invalid_input(): void {
		$result = PhoneValidator::validate( 'not-a-phone' );
		$this->assertFalse( $result['valid'] );
		$this->assertNotNull( $result['error'] );
		$this->assertStringContainsString( 'E.164 format', (string) $result['error'] );
	}

	public function test_validate_succeeds_with_null_error_for_valid_e164(): void {
		$result = PhoneValidator::validate( '+1234567890' );
		$this->assertTrue( $result['valid'] );
		$this->assertNull( $result['error'] );
	}

	public function test_sanitize_returns_null_for_empty_input(): void {
		$this->assertNull( PhoneValidator::sanitize( '' ) );
		$this->assertNull( PhoneValidator::sanitize( null ) );
	}

	public function test_sanitize_keeps_valid_e164_intact(): void {
		$this->assertSame( '+1234567890', PhoneValidator::sanitize( '+1234567890' ) );
	}

	public function test_sanitize_strips_non_digits_when_already_plus_prefixed(): void {
		$this->assertSame( '+12345678900', PhoneValidator::sanitize( '+1 (234) 567-8900' ) );
	}

	public function test_sanitize_applies_default_country_code(): void {
		$this->assertSame( '+12345678900', PhoneValidator::sanitize( '2345678900', '1' ) );
	}

	public function test_sanitize_returns_null_for_unrecoverable_input(): void {
		$this->assertNull( PhoneValidator::sanitize( 'abcdef' ) );
	}

	public function test_get_example_returns_known_country(): void {
		$this->assertSame( '+1234567890', PhoneValidator::get_example( 'us' ) );
		$this->assertSame( '+447975777666', PhoneValidator::get_example( 'uk' ) );
	}

	public function test_get_example_falls_back_to_us_for_unknown_country(): void {
		$this->assertSame( '+1234567890', PhoneValidator::get_example( 'zz' ) );
	}
}
