<?php
/**
 * Sequential numbering for proposals and invoices.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Contracts\Models\ContractModel;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\ProposalModel;
use Illuminate\Database\QueryException;
use WPEloquent\Eloquent\Model;

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
	 * @param string $prefix Prefix such as CON.
	 * @return string
	 */
	public static function next_contract_number( string $prefix = 'CON' ): string {
		return self::next_number( $prefix, ContractModel::class, 'contract_number' );
	}

	/**
	 * @param string $prefix Prefix such as CN.
	 * @return string
	 */
	public static function next_credit_note_number( string $prefix = 'CN' ): string {
		return self::next_number( $prefix, \DoubleScale\Pro\Modules\CreditNotes\Models\CreditNoteModel::class, 'credit_note_number' );
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

		return self::format_sequential_number( $prefix, $next );
	}

	/**
	 * @param string $prefix Number prefix.
	 * @param int    $sequence Sequential counter.
	 * @return string
	 */
	public static function format_sequential_number( string $prefix, int $sequence ): string {
		$prefix = strtoupper( preg_replace( '/[^A-Z0-9]/', '', $prefix ) ?: 'DOC' );

		return sprintf( '%s-%06d', $prefix, $sequence );
	}

	/**
	 * Persist a new model, retrying on duplicate proposal/invoice number collisions.
	 *
	 * @param Model $model New proposal or invoice model (not yet saved).
	 * @param int   $max   Maximum save attempts.
	 * @return void
	 * @throws \Throwable When retries are exhausted or a non-collision error occurs.
	 */
	public static function save_with_retry( Model $model, int $max = 5 ): void {
		$attempts = 0;

		while ( true ) {
			try {
				$model->save();
				return;
			} catch ( QueryException $e ) {
				++$attempts;
				if ( $attempts >= $max || ! self::is_duplicate_number_error( $e ) ) {
					throw $e;
				}
				self::clear_number_column( $model );
			}
		}
	}

	/**
	 * @param \Throwable $e Database exception.
	 * @return bool
	 */
	public static function is_duplicate_number_error( \Throwable $e ): bool {
		$message = $e->getMessage();
		if ( false === stripos( $message, 'Duplicate entry' ) ) {
			return false;
		}

		return false !== stripos( $message, 'invoice_number' )
			|| false !== stripos( $message, 'proposal_number' )
			|| false !== stripos( $message, 'contract_number' )
			|| false !== stripos( $message, 'credit_note_number' );
	}

	/**
	 * @param Model $model Proposal or invoice model.
	 * @return void
	 */
	private static function clear_number_column( Model $model ): void {
		if ( $model instanceof ProposalModel ) {
			$model->proposal_number = null;
			return;
		}
		if ( $model instanceof InvoiceModel ) {
			$model->invoice_number = null;
			return;
		}
		if ( $model instanceof ContractModel ) {
			$model->contract_number = null;
			return;
		}
		if ( $model instanceof \DoubleScale\Pro\Modules\CreditNotes\Models\CreditNoteModel ) {
			$model->credit_note_number = null;
		}
	}
}
