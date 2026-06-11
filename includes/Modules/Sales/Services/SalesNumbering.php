<?php
/**
 * Sequential numbering for proposals and invoices.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Models\ProposalModel;

/**
 * SalesNumbering service.
 */
class SalesNumbering {

	/**
	 * @param string $prefix Prefix such as PRO or INV.
	 * @return string
	 */
	public static function next_proposal_number( string $prefix = 'PRO' ): string {
		return self::next_number( $prefix, ProposalModel::class, 'proposal_number' );
	}

	/**
	 * @param string $prefix Prefix such as INV.
	 * @return string
	 */
	public static function next_invoice_number( string $prefix = 'INV' ): string {
		return self::next_number( $prefix, InvoiceModel::class, 'invoice_number' );
	}

	/**
	 * @param string $prefix Number prefix.
	 * @param class-string $model_class Model class.
	 * @param string $column Column storing the formatted number.
	 * @return string
	 */
	private static function next_number( string $prefix, string $model_class, string $column ): string {
		$prefix = strtoupper( preg_replace( '/[^A-Z0-9]/', '', $prefix ) ?: 'DOC' );

		$latest = $model_class::query()
			->where( $column, 'LIKE', $prefix . '-%' )
			->orderByDesc( 'id' )
			->value( $column );

		$next = 1;
		if ( is_string( $latest ) && preg_match( '/-(\d+)$/', $latest, $matches ) ) {
			$next = (int) $matches[1] + 1;
		}

		return sprintf( '%s-%06d', $prefix, $next );
	}
}
