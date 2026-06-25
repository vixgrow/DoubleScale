<?php
/**
 * Contract for {@see DiscountType} validation.
 *
 * @package DoubleScale\Tests\Modules\Documents
 */

namespace DoubleScale\Tests\Modules\Documents;

use DoubleScale\Modules\Documents\Constants\DiscountType;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class DiscountTypeTest extends TestCase {

	public function test_percent_discount_cannot_exceed_100(): void {
		$result = DiscountType::validate_value( DiscountType::PERCENT, 12222.0 );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_discount', $result->get_error_code() );
	}

	public function test_percent_discount_allows_100(): void {
		$this->assertTrue( DiscountType::validate_value( DiscountType::PERCENT, 100.0 ) );
	}

	public function test_fixed_discount_cannot_exceed_subtotal(): void {
		$result = DiscountType::validate_value( DiscountType::FIXED, 200.0, 100.0 );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_fixed_discount_allows_up_to_subtotal(): void {
		$this->assertTrue( DiscountType::validate_value( DiscountType::FIXED, 100.0, 100.0 ) );
	}

	public function test_none_discount_skips_value_validation(): void {
		$this->assertTrue( DiscountType::validate_value( DiscountType::NONE, 99999.0 ) );
	}

	public function test_validate_payload_uses_line_items_subtotal_for_fixed_discount(): void {
		$payload = array(
			'discount_type'  => DiscountType::FIXED,
			'discount_value' => 150.0,
			'line_items'     => array(
				array( 'qty' => 1, 'rate' => 100 ),
			),
		);

		$result = DiscountType::validate_payload( $payload );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}
}
