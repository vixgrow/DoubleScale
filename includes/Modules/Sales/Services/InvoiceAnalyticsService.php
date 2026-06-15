<?php
/**
 * Invoice revenue analytics for reporting.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Models\PaymentModel;

/**
 * InvoiceAnalyticsService class.
 */
final class InvoiceAnalyticsService {

	/**
	 * @param string $start_date Y-m-d.
	 * @param string $end_date   Y-m-d.
	 * @return array<string, mixed>
	 */
	public function get_revenue_summary( string $start_date, string $end_date ): array {
		$payments = PaymentModel::query()
			->whereDate( 'payment_date', '>=', $start_date )
			->whereDate( 'payment_date', '<=', $end_date )
			->get();

		$total_collected = 0.0;
		$by_currency     = array();
		$payment_count   = 0;

		foreach ( $payments as $payment ) {
			$amount = (float) $payment->amount;
			if ( $amount <= 0 ) {
				continue;
			}
			$invoice = InvoiceModel::find( (int) $payment->invoice_id );
			$currency = $invoice ? (string) $invoice->currency : 'USD';
			$total_collected += $amount;
			$payment_count++;
			if ( ! isset( $by_currency[ $currency ] ) ) {
				$by_currency[ $currency ] = 0.0;
			}
			$by_currency[ $currency ] += $amount;
		}

		$outstanding_query = InvoiceModel::query()
			->whereIn( 'status', array( InvoiceStatus::UNPAID, InvoiceStatus::PARTIALLY_PAID, InvoiceStatus::OVERDUE ) );

		$outstanding_total = 0.0;
		$outstanding_count = 0;
		foreach ( $outstanding_query->get() as $invoice ) {
			$balance = max( 0, (float) $invoice->total - (float) $invoice->amount_paid );
			if ( $balance <= 0 ) {
				continue;
			}
			$outstanding_total += $balance;
			$outstanding_count++;
		}

		$paid_invoices = InvoiceModel::query()
			->where( 'status', InvoiceStatus::PAID )
			->whereDate( 'updated_at', '>=', $start_date )
			->whereDate( 'updated_at', '<=', $end_date )
			->count();

		return array(
			'start_date'          => $start_date,
			'end_date'            => $end_date,
			'total_collected'     => round( $total_collected, 2 ),
			'payment_count'       => $payment_count,
			'collected_by_currency' => $by_currency,
			'outstanding_total'   => round( $outstanding_total, 2 ),
			'outstanding_count'   => $outstanding_count,
			'paid_invoices_count' => (int) $paid_invoices,
		);
	}

	/**
	 * Monthly revenue buckets for charting.
	 *
	 * @param int $year Four-digit year.
	 * @return array<int, array{month: int, label: string, total: float, count: int}>
	 */
	public function get_monthly_revenue( int $year ): array {
		$rows = array();
		for ( $month = 1; $month <= 12; $month++ ) {
			$start = sprintf( '%04d-%02d-01', $year, $month );
			$end   = gmdate( 'Y-m-t', strtotime( $start . ' UTC' ) );

			$payments = PaymentModel::query()
				->whereDate( 'payment_date', '>=', $start )
				->whereDate( 'payment_date', '<=', $end )
				->get();

			$total = 0.0;
			$count = 0;
			foreach ( $payments as $payment ) {
				$amount = (float) $payment->amount;
				if ( $amount <= 0 ) {
					continue;
				}
				$total += $amount;
				$count++;
			}

			$rows[] = array(
				'month' => $month,
				'label' => gmdate( 'M', strtotime( $start . ' UTC' ) ),
				'total' => round( $total, 2 ),
				'count' => $count,
			);
		}

		return $rows;
	}
}
