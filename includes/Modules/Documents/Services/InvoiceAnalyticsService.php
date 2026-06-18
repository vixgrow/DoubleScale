<?php
/**
 * Invoice revenue analytics for reporting.
 *
 * @package DoubleScale\Modules\Documents
 */

namespace DoubleScale\Modules\Documents\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\PaymentModel;

/**
 * InvoiceAnalyticsService class.
 */
final class InvoiceAnalyticsService {

	/**
	 * @param string               $start_date Y-m-d.
	 * @param string               $end_date   Y-m-d.
	 * @param array<string, mixed> $filters    Optional sale_agent_user_id, currencies.
	 * @return array<string, mixed>
	 */
	public function get_revenue_summary( string $start_date, string $end_date, array $filters = array() ): array {
		$agent_id   = isset( $filters['sale_agent_user_id'] ) ? absint( $filters['sale_agent_user_id'] ) : 0;
		$currencies = $this->normalize_currencies( $filters['currencies'] ?? array() );

		$payments_query = PaymentModel::query()
			->whereDate( 'payment_date', '>=', $start_date )
			->whereDate( 'payment_date', '<=', $end_date );

		if ( $agent_id > 0 || ! empty( $currencies ) ) {
			$payments_query->whereHas(
				'invoice',
				function ( $query ) use ( $agent_id, $currencies ) {
					if ( $agent_id > 0 ) {
						$query->where( 'sale_agent_user_id', $agent_id );
					}
					if ( ! empty( $currencies ) ) {
						$query->whereIn( 'currency', $currencies );
					}
				}
			);
		}

		$payments = $payments_query->with( 'invoice' )->get();

		$total_collected = 0.0;
		$by_currency     = array();
		$payment_count   = 0;

		foreach ( $payments as $payment ) {
			$amount = (float) $payment->amount;
			if ( $amount <= 0 ) {
				continue;
			}
			$invoice  = $payment->invoice;
			$currency = $invoice ? (string) $invoice->currency : 'USD';
			if ( ! empty( $currencies ) && ! in_array( $currency, $currencies, true ) ) {
				continue;
			}
			$total_collected += $amount;
			$payment_count++;
			if ( ! isset( $by_currency[ $currency ] ) ) {
				$by_currency[ $currency ] = 0.0;
			}
			$by_currency[ $currency ] += $amount;
		}

		$outstanding_query = InvoiceModel::query()
			->whereIn( 'status', array( InvoiceStatus::UNPAID, InvoiceStatus::PARTIALLY_PAID, InvoiceStatus::OVERDUE ) );

		if ( $agent_id > 0 ) {
			$outstanding_query->where( 'sale_agent_user_id', $agent_id );
		}
		if ( ! empty( $currencies ) ) {
			$outstanding_query->whereIn( 'currency', $currencies );
		}

		$outstanding_total = 0.0;
		$outstanding_count = 0;
		$outstanding_by_currency = array();
		foreach ( $outstanding_query->get() as $invoice ) {
			$balance = max( 0, (float) $invoice->total - (float) $invoice->amount_paid );
			if ( $balance <= 0 ) {
				continue;
			}
			$currency = (string) $invoice->currency;
			$outstanding_total += $balance;
			$outstanding_count++;
			if ( ! isset( $outstanding_by_currency[ $currency ] ) ) {
				$outstanding_by_currency[ $currency ] = 0.0;
			}
			$outstanding_by_currency[ $currency ] += $balance;
		}

		$paid_query = InvoiceModel::query()
			->where( 'status', InvoiceStatus::PAID )
			->whereDate( 'updated_at', '>=', $start_date )
			->whereDate( 'updated_at', '<=', $end_date );

		if ( $agent_id > 0 ) {
			$paid_query->where( 'sale_agent_user_id', $agent_id );
		}
		if ( ! empty( $currencies ) ) {
			$paid_query->whereIn( 'currency', $currencies );
		}

		$paid_invoices = $paid_query->count();

		return array(
			'start_date'                => $start_date,
			'end_date'                  => $end_date,
			'sale_agent_user_id'        => $agent_id > 0 ? $agent_id : null,
			'currencies'                => $currencies,
			'total_collected'           => round( $total_collected, 2 ),
			'payment_count'             => $payment_count,
			'collected_by_currency'     => $this->round_currency_map( $by_currency ),
			'outstanding_total'         => round( $outstanding_total, 2 ),
			'outstanding_count'         => $outstanding_count,
			'outstanding_by_currency'   => $this->round_currency_map( $outstanding_by_currency ),
			'paid_invoices_count'       => (int) $paid_invoices,
		);
	}

	/**
	 * Monthly revenue buckets for charting.
	 *
	 * @param int                  $year    Four-digit year.
	 * @param array<string, mixed> $filters Optional sale_agent_user_id, currencies.
	 * @return array<int, array{month: int, label: string, total: float, count: int, by_currency: array<string, float>}>
	 */
	public function get_monthly_revenue( int $year, array $filters = array() ): array {
		$agent_id   = isset( $filters['sale_agent_user_id'] ) ? absint( $filters['sale_agent_user_id'] ) : 0;
		$currencies = $this->normalize_currencies( $filters['currencies'] ?? array() );
		$rows       = array();

		for ( $month = 1; $month <= 12; $month++ ) {
			$start = sprintf( '%04d-%02d-01', $year, $month );
			$end   = gmdate( 'Y-m-t', strtotime( $start . ' UTC' ) );

			$payments_query = PaymentModel::query()
				->whereDate( 'payment_date', '>=', $start )
				->whereDate( 'payment_date', '<=', $end );

			if ( $agent_id > 0 || ! empty( $currencies ) ) {
				$payments_query->whereHas(
					'invoice',
					function ( $query ) use ( $agent_id, $currencies ) {
						if ( $agent_id > 0 ) {
							$query->where( 'sale_agent_user_id', $agent_id );
						}
						if ( ! empty( $currencies ) ) {
							$query->whereIn( 'currency', $currencies );
						}
					}
				);
			}

			$payments    = $payments_query->with( 'invoice' )->get();
			$total       = 0.0;
			$count       = 0;
			$by_currency = array();

			foreach ( $payments as $payment ) {
				$amount = (float) $payment->amount;
				if ( $amount <= 0 ) {
					continue;
				}
				$invoice  = $payment->invoice;
				$currency = $invoice ? (string) $invoice->currency : 'USD';
				if ( ! empty( $currencies ) && ! in_array( $currency, $currencies, true ) ) {
					continue;
				}
				$total += $amount;
				$count++;
				if ( ! isset( $by_currency[ $currency ] ) ) {
					$by_currency[ $currency ] = 0.0;
				}
				$by_currency[ $currency ] += $amount;
			}

			$rows[] = array(
				'month'       => $month,
				'label'       => gmdate( 'M', strtotime( $start . ' UTC' ) ),
				'total'       => round( $total, 2 ),
				'count'       => $count,
				'by_currency' => $this->round_currency_map( $by_currency ),
			);
		}

		return $rows;
	}

	/**
	 * Distinct invoice currencies used in the system.
	 *
	 * @return string[]
	 */
	public function get_available_currencies(): array {
		$rows = InvoiceModel::query()
			->select( 'currency' )
			->distinct()
			->orderBy( 'currency' )
			->pluck( 'currency' )
			->all();

		$currencies = array();
		foreach ( $rows as $currency ) {
			$currency = strtoupper( trim( (string) $currency ) );
			if ( '' !== $currency ) {
				$currencies[] = $currency;
			}
		}

		return array_values( array_unique( $currencies ) );
	}

	/**
	 * @param mixed $currencies Raw filter value.
	 * @return string[]
	 */
	private function normalize_currencies( $currencies ): array {
		if ( is_string( $currencies ) ) {
			$currencies = array_map( 'trim', explode( ',', $currencies ) );
		}
		if ( ! is_array( $currencies ) ) {
			return array();
		}

		$normalized = array();
		foreach ( $currencies as $currency ) {
			$currency = strtoupper( sanitize_text_field( (string) $currency ) );
			if ( '' !== $currency ) {
				$normalized[] = $currency;
			}
		}

		return array_values( array_unique( $normalized ) );
	}

	/**
	 * @param array<string, float> $map Currency totals.
	 * @return array<string, float>
	 */
	private function round_currency_map( array $map ): array {
		$rounded = array();
		foreach ( $map as $currency => $amount ) {
			$rounded[ (string) $currency ] = round( (float) $amount, 2 );
		}
		ksort( $rounded );
		return $rounded;
	}
}
