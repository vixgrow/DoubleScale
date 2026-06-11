<?php
/**
 * Canonical invoice payment mode values.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Constants;

defined( 'ABSPATH' ) || exit;

/**
 * PaymentMode constants and normalization helpers.
 */
class PaymentMode {

	const BANK_TRANSFER = 'bank_transfer';
	const CASH          = 'cash';
	const CHECK         = 'check';
	const CREDIT_CARD   = 'credit_card';
	const PAYPAL        = 'paypal';
	const STRIPE        = 'stripe';
	const OTHER         = 'other';

	/**
	 * @return string[]
	 */
	public static function all(): array {
		return array(
			self::BANK_TRANSFER,
			self::CASH,
			self::CHECK,
			self::CREDIT_CARD,
			self::PAYPAL,
			self::STRIPE,
			self::OTHER,
		);
	}

	/**
	 * @param string $mode Raw mode value.
	 * @return string|null Canonical slug or null when empty/unknown.
	 */
	public static function normalize( string $mode ): ?string {
		$mode = sanitize_title( trim( $mode ), '', 'display' );
		$mode = str_replace( '-', '_', $mode );

		if ( '' === $mode ) {
			return null;
		}

		if ( in_array( $mode, self::all(), true ) ) {
			return $mode;
		}

		$legacy = array(
			'bank'             => self::BANK_TRANSFER,
			'stripe_checkout'  => self::STRIPE,
			'credit_card'      => self::CREDIT_CARD,
		);

		return $legacy[ $mode ] ?? self::OTHER;
	}

	/**
	 * @param mixed $modes List of mode strings.
	 * @return string[]
	 */
	public static function normalize_list( $modes ): array {
		if ( ! is_array( $modes ) ) {
			return array();
		}

		$normalized = array();
		foreach ( $modes as $mode ) {
			if ( ! is_string( $mode ) && ! is_numeric( $mode ) ) {
				continue;
			}
			$canonical = self::normalize( (string) $mode );
			if ( $canonical ) {
				$normalized[] = $canonical;
			}
		}

		return array_values( array_unique( $normalized ) );
	}
}
