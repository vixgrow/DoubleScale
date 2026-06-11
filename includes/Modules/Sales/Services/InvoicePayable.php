<?php
/**
 * Shared guards for payable invoices (admin + public Stripe flows).
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Constants\PaymentMode;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use WP_Error;

/**
 * InvoicePayable service.
 */
final class InvoicePayable {

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @return true|WP_Error
	 */
	public static function guard( InvoiceModel $invoice ) {
		if ( InvoiceStatus::DRAFT === (string) $invoice->status ) {
			return new WP_Error( 'invalid_status', __( 'Draft invoices cannot be paid online.', 'doublescale' ), array( 'status' => 400 ) );
		}

		if ( InvoiceStatus::PAID === (string) $invoice->status ) {
			return new WP_Error( 'invalid_status', __( 'This invoice is already paid.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$balance = round( (float) $invoice->total - (float) $invoice->amount_paid, 2 );
		if ( $balance <= 0 ) {
			return new WP_Error( 'invalid_data', __( 'Nothing is due on this invoice.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$modes = PaymentMode::normalize_list( $invoice->allowed_payment_modes );
		if ( ! empty( $modes ) && ! in_array( PaymentMode::STRIPE, $modes, true ) ) {
			return new WP_Error( 'invalid_data', __( 'Stripe is not an allowed payment mode for this invoice.', 'doublescale' ), array( 'status' => 400 ) );
		}

		return true;
	}
}
