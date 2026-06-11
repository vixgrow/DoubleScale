<?php
/**
 * Mark past-due invoices as overdue.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;

/**
 * OverdueInvoices cron runner.
 */
class OverdueInvoices {

	/**
	 * Bulk-update unpaid/partially paid invoices past due date.
	 *
	 * @return void
	 */
	public function run(): void {
		$today = current_time( 'Y-m-d' );

		InvoiceModel::query()
			->whereIn( 'status', array( InvoiceStatus::UNPAID, InvoiceStatus::PARTIALLY_PAID ) )
			->where( 'due_date', '<', $today )
			->update( array( 'status' => InvoiceStatus::OVERDUE ) );
	}
}
