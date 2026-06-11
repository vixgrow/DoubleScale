<?php
/**
 * Compute subtotal, tax, and total from line items and discounts.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

/**
 * TotalsCalculator service.
 */
class TotalsCalculator {

	/**
	 * @param array<int, array<string, mixed>>|null $line_items Line items.
	 * @param string                                 $discount_type none|percent|fixed|before_tax|after_tax.
	 * @param float                                  $discount_value Discount amount or percent.
	 * @param float                                  $adjustment Manual adjustment.
	 * @return array{subtotal: float, total_tax: float, total: float}
	 */
	public static function compute( $line_items, string $discount_type = 'none', float $discount_value = 0.0, float $adjustment = 0.0 ): array {
		$items    = is_array( $line_items ) ? $line_items : array();
		$subtotal  = 0.0;
		$total_tax = 0.0;

		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			if ( ! empty( $item['optional'] ) ) {
				continue;
			}

			$qty    = isset( $item['qty'] ) ? (float) $item['qty'] : 1.0;
			$rate   = isset( $item['rate'] ) ? (float) $item['rate'] : 0.0;
			$amount = isset( $item['amount'] ) ? (float) $item['amount'] : ( $qty * $rate );
			$subtotal += $amount;

			$taxes = isset( $item['tax'] ) && is_array( $item['tax'] ) ? $item['tax'] : array();
			foreach ( $taxes as $tax ) {
				if ( ! is_array( $tax ) ) {
					continue;
				}
				$tax_rate = isset( $tax['rate'] ) ? (float) $tax['rate'] : 0.0;
				$total_tax += $amount * ( $tax_rate / 100 );
			}
		}

		$discount_amount = self::discount_amount( $subtotal, $discount_type, $discount_value );
		$total           = max( 0, $subtotal + $total_tax - $discount_amount + $adjustment );

		return array(
			'subtotal'   => round( $subtotal, 2 ),
			'total_tax'  => round( $total_tax, 2 ),
			'total'      => round( $total, 2 ),
		);
	}

	/**
	 * @param float  $subtotal Subtotal.
	 * @param string $discount_type Discount type.
	 * @param float  $discount_value Discount value.
	 * @return float
	 */
	private static function discount_amount( float $subtotal, string $discount_type, float $discount_value ): float {
		if ( $discount_value <= 0 || 'none' === $discount_type ) {
			return 0.0;
		}

		if ( in_array( $discount_type, array( 'percent', 'before_tax', 'after_tax' ), true ) ) {
			return $subtotal * ( $discount_value / 100 );
		}

		if ( 'fixed' === $discount_type ) {
			return min( $subtotal, $discount_value );
		}

		return 0.0;
	}
}
