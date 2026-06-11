<?php
/**
 * Sync invoice amount_paid and status from payment records.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Models\PaymentModel;

/**
 * InvoicePayments service.
 */
class InvoicePayments {

	/**
	 * Recompute amount_paid and status from payments, then save.
	 *
	 * @param InvoiceModel $invoice Invoice.
	 * @return InvoiceModel
	 */
	public function sync( InvoiceModel $invoice ): InvoiceModel {
		$amount_paid = (float) PaymentModel::query()
			->where( 'invoice_id', (int) $invoice->id )
			->sum( 'amount' );

		$invoice->amount_paid = round( $amount_paid, 2 );
		$invoice->status      = self::derive_status( $invoice );
		$invoice->save();

		return $invoice->fresh();
	}

	/**
	 * Derive invoice status from payment totals and due date.
	 *
	 * @param InvoiceModel $invoice Invoice.
	 * @return string
	 */
	public static function derive_status( InvoiceModel $invoice ): string {
		if ( InvoiceStatus::DRAFT === (string) $invoice->status ) {
			return InvoiceStatus::DRAFT;
		}

		$total       = (float) $invoice->total;
		$amount_paid = (float) $invoice->amount_paid;

		if ( $amount_paid >= $total && $total > 0 ) {
			return InvoiceStatus::PAID;
		}

		$due_date = $invoice->due_date;
		if ( $due_date && $due_date < current_time( 'Y-m-d' ) ) {
			return InvoiceStatus::OVERDUE;
		}

		if ( $amount_paid > 0 ) {
			return InvoiceStatus::PARTIALLY_PAID;
		}

		return InvoiceStatus::UNPAID;
	}
}
