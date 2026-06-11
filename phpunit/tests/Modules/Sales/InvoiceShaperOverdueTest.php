<?php
/**
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Rest\InvoiceShaper;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class InvoiceShaperOverdueTest extends TestCase {

	/**
	 * @return array<string, array{0: string, 1: string|null, 2: bool}>
	 */
	public function overdue_matrix(): array {
		$yesterday = gmdate( 'Y-m-d', strtotime( '-1 day' ) );
		$tomorrow  = gmdate( 'Y-m-d', strtotime( '+1 day' ) );

		return array(
			'unpaid_past_due' => array( InvoiceStatus::UNPAID, $yesterday, true ),
			'partial_past_due' => array( InvoiceStatus::PARTIALLY_PAID, $yesterday, true ),
			'unpaid_future_due' => array( InvoiceStatus::UNPAID, $tomorrow, false ),
			'paid_past_due' => array( InvoiceStatus::PAID, $yesterday, false ),
			'overdue_status_past_due' => array( InvoiceStatus::OVERDUE, $yesterday, false ),
			'unpaid_no_due_date' => array( InvoiceStatus::UNPAID, null, false ),
		);
	}

	/**
	 * @dataProvider overdue_matrix
	 */
	public function test_is_overdue_matrix( string $status, ?string $due_date, bool $expected ): void {
		$invoice = new InvoiceModel();
		$invoice->status   = $status;
		$invoice->due_date = $due_date;

		$this->assertSame( $expected, InvoiceShaper::is_overdue( $invoice ) );
	}

	public function test_shape_public_excludes_internal_fields(): void {
		$invoice = new InvoiceModel();
		$invoice->invoice_number = 'INV-000099';
		$invoice->hash           = str_repeat( 'a', 32 );
		$invoice->status         = InvoiceStatus::UNPAID;
		$invoice->total          = 100.0;
		$invoice->amount_paid    = 25.0;
		$invoice->due_date       = gmdate( 'Y-m-d', strtotime( '+7 days' ) );

		$public = InvoiceShaper::shape_public( $invoice );

		$this->assertArrayNotHasKey( 'hash', $public );
		$this->assertArrayNotHasKey( 'id', $public );
		$this->assertArrayNotHasKey( 'contact_id', $public );
		$this->assertArrayNotHasKey( 'public_url', $public );
		$this->assertArrayHasKey( 'balance', $public );
		$this->assertSame( 75.0, $public['balance'] );
		$this->assertArrayHasKey( 'can_pay', $public );
		$this->assertArrayHasKey( 'is_overdue', $public );
	}
}
