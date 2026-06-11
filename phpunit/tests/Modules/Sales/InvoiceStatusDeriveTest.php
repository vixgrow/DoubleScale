<?php
/**
 * Contract for {@see InvoicePayments::derive_status_from_values()}.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Services\InvoicePayments;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class InvoiceStatusDeriveTest extends TestCase {

	public function test_draft_stays_draft(): void {
		$status = InvoicePayments::derive_status_from_values(
			InvoiceStatus::DRAFT,
			100.0,
			0.0,
			'2020-01-01',
			'2026-06-11'
		);

		$this->assertSame( InvoiceStatus::DRAFT, $status );
	}

	public function test_fully_paid_invoice_is_paid(): void {
		$status = InvoicePayments::derive_status_from_values(
			InvoiceStatus::UNPAID,
			100.0,
			100.0,
			'2026-06-11',
			'2026-06-11'
		);

		$this->assertSame( InvoiceStatus::PAID, $status );
	}

	public function test_overpayment_is_still_paid(): void {
		$status = InvoicePayments::derive_status_from_values(
			InvoiceStatus::UNPAID,
			100.0,
			150.0,
			'2026-06-11',
			'2026-06-11'
		);

		$this->assertSame( InvoiceStatus::PAID, $status );
	}

	public function test_partial_payment_is_partially_paid(): void {
		$status = InvoicePayments::derive_status_from_values(
			InvoiceStatus::UNPAID,
			100.0,
			40.0,
			'2026-12-31',
			'2026-06-11'
		);

		$this->assertSame( InvoiceStatus::PARTIALLY_PAID, $status );
	}

	public function test_partial_payment_overdue_stays_partially_paid(): void {
		$status = InvoicePayments::derive_status_from_values(
			InvoiceStatus::UNPAID,
			100.0,
			25.0,
			'2020-01-01',
			'2026-06-11'
		);

		$this->assertSame( InvoiceStatus::PARTIALLY_PAID, $status );
	}

	public function test_unpaid_invoice_before_due_date_is_unpaid(): void {
		$status = InvoicePayments::derive_status_from_values(
			InvoiceStatus::UNPAID,
			100.0,
			0.0,
			'2026-12-31',
			'2026-06-11'
		);

		$this->assertSame( InvoiceStatus::UNPAID, $status );
	}

	public function test_unpaid_invoice_past_due_date_is_overdue(): void {
		$status = InvoicePayments::derive_status_from_values(
			InvoiceStatus::UNPAID,
			100.0,
			0.0,
			'2020-01-01',
			'2026-06-11'
		);

		$this->assertSame( InvoiceStatus::OVERDUE, $status );
	}

	public function test_zero_total_with_no_payment_is_unpaid(): void {
		$status = InvoicePayments::derive_status_from_values(
			InvoiceStatus::UNPAID,
			0.0,
			0.0,
			'2020-01-01',
			'2026-06-11'
		);

		$this->assertSame( InvoiceStatus::OVERDUE, $status );
	}
}
