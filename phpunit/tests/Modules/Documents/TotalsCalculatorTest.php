<?php
/**
 * Contract for {@see TotalsCalculator} — invoice subtotal, tax, and total math.
 *
 * @package DoubleScale\Tests\Modules\Documents
 */

namespace DoubleScale\Tests\Modules\Documents;

use DoubleScale\Modules\Documents\Services\TotalsCalculator;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class TotalsCalculatorTest extends TestCase {

	public function test_computes_subtotal_and_tax_from_line_items(): void {
		$items = array(
			array(
				'qty'  => 2,
				'rate' => 50,
				'tax'  => array( array( 'rate' => 10 ) ),
			),
		);

		$result = TotalsCalculator::compute( $items );

		$this->assertSame( 100.0, $result['subtotal'] );
		$this->assertSame( 10.0, $result['total_tax'] );
		$this->assertSame( 110.0, $result['total'] );
	}

	public function test_skips_optional_line_items(): void {
		$items = array(
			array( 'qty' => 1, 'rate' => 100 ),
			array( 'qty' => 1, 'rate' => 500, 'optional' => true ),
		);

		$result = TotalsCalculator::compute( $items );

		$this->assertSame( 100.0, $result['subtotal'] );
		$this->assertSame( 100.0, $result['total'] );
	}

	public function test_percent_discount_does_not_reduce_tax(): void {
		$items = array(
			array(
				'qty'  => 1,
				'rate' => 100,
				'tax'  => array( array( 'rate' => 10 ) ),
			),
		);

		$result = TotalsCalculator::compute( $items, 'percent', 10.0 );

		$this->assertSame( 100.0, $result['subtotal'] );
		$this->assertSame( 10.0, $result['total_tax'] );
		$this->assertSame( 100.0, $result['total'] );
	}

	public function test_before_tax_discount_reduces_taxable_base(): void {
		$items = array(
			array(
				'qty'  => 1,
				'rate' => 100,
				'tax'  => array( array( 'rate' => 10 ) ),
			),
		);

		$result = TotalsCalculator::compute( $items, 'before_tax', 10.0 );

		$this->assertSame( 100.0, $result['subtotal'] );
		$this->assertSame( 9.0, $result['total_tax'] );
		$this->assertSame( 99.0, $result['total'] );
	}

	public function test_after_tax_discount_applies_to_subtotal_plus_tax(): void {
		$items = array(
			array(
				'qty'  => 1,
				'rate' => 100,
				'tax'  => array( array( 'rate' => 10 ) ),
			),
		);

		$result = TotalsCalculator::compute( $items, 'after_tax', 10.0 );

		$this->assertSame( 100.0, $result['subtotal'] );
		$this->assertSame( 10.0, $result['total_tax'] );
		$this->assertSame( 99.0, $result['total'] );
	}

	public function test_fixed_discount_is_capped_at_subtotal(): void {
		$items = array(
			array( 'qty' => 1, 'rate' => 50 ),
		);

		$result = TotalsCalculator::compute( $items, 'fixed', 75.0 );

		$this->assertSame( 50.0, $result['subtotal'] );
		$this->assertSame( 0.0, $result['total'] );
	}

	public function test_adjustment_is_applied_to_total(): void {
		$items = array(
			array( 'qty' => 1, 'rate' => 100 ),
		);

		$result = TotalsCalculator::compute( $items, 'none', 0.0, 5.0 );

		$this->assertSame( 105.0, $result['total'] );
	}

	public function test_negative_adjustment_cannot_make_total_negative(): void {
		$items = array(
			array( 'qty' => 1, 'rate' => 10 ),
		);

		$result = TotalsCalculator::compute( $items, 'none', 0.0, -50.0 );

		$this->assertSame( 0.0, $result['total'] );
	}

	public function test_rounds_amounts_to_two_decimal_places(): void {
		$items = array(
			array(
				'qty'  => 3,
				'rate' => 33.33,
				'tax'  => array( array( 'rate' => 7.5 ) ),
			),
		);

		$result = TotalsCalculator::compute( $items, 'percent', 5.5 );

		$this->assertSame( 99.99, $result['subtotal'] );
		$this->assertSame( 7.5, $result['total_tax'] );
		$this->assertSame( 101.99, $result['total'] );
	}

	public function test_none_discount_leaves_totals_unchanged(): void {
		$items = array(
			array(
				'qty'  => 1,
				'rate' => 80,
				'tax'  => array( array( 'rate' => 5 ) ),
			),
		);

		$result = TotalsCalculator::compute( $items, 'none', 25.0 );

		$this->assertSame( 80.0, $result['subtotal'] );
		$this->assertSame( 4.0, $result['total_tax'] );
		$this->assertSame( 84.0, $result['total'] );
	}
}
