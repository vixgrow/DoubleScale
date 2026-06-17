<?php
/**
 * Integration tests for manual invoice payment guards and sync.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class InvoicePaymentOverpaymentTest extends IntegrationTestCase {

	/** @var int */
	private $admin_id;

	protected function setUp(): void {
		parent::setUp();

		$this->ensure_sales_module();
		Capabilities::ensure_capabilities_synced();
		$this->admin_id = $this->make_admin_user();
	}

	public function test_rejects_payment_that_exceeds_balance(): void {
		$invoice = $this->make_invoice(
			array(
				'status' => InvoiceStatus::UNPAID,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/payments',
			array( 'amount' => 150.0 ),
			$this->admin_id
		);

		$this->assertSame( 422, $response->get_status() );
		$this->assertSame( 'payment_exceeds_balance', $response->as_error()->get_error_code() );
	}

	public function test_accepts_partial_payment_and_updates_status(): void {
		$invoice = $this->make_invoice(
			array(
				'status' => InvoiceStatus::UNPAID,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/payments',
			array( 'amount' => 40.0 ),
			$this->admin_id
		);

		$this->assertSame( 201, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 40.0, (float) $data['invoice']['amount_paid'] );
		$this->assertSame( InvoiceStatus::PARTIALLY_PAID, $data['invoice']['status'] );
	}

	public function test_accepts_final_payment_and_marks_invoice_paid(): void {
		$invoice = $this->make_invoice(
			array(
				'status' => InvoiceStatus::UNPAID,
			)
		);

		$partial = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/payments',
			array( 'amount' => 40.0 ),
			$this->admin_id
		);
		$this->assertSame( 201, $partial->get_status() );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/payments',
			array( 'amount' => 60.0 ),
			$this->admin_id
		);

		$this->assertSame( 201, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 100.0, (float) $data['invoice']['amount_paid'] );
		$this->assertSame( InvoiceStatus::PAID, $data['invoice']['status'] );
	}

	public function test_deleting_payment_resyncs_invoice_balance_and_status(): void {
		$invoice = $this->make_invoice(
			array(
				'status' => InvoiceStatus::UNPAID,
			)
		);

		$create = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/payments',
			array( 'amount' => 25.0 ),
			$this->admin_id
		);
		$this->assertSame( 201, $create->get_status() );
		$payment_id = (int) $create->get_data()['payment']['id'];

		$delete = $this->dispatch_rest(
			'DELETE',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/payments/' . $payment_id,
			array(),
			$this->admin_id
		);

		$this->assertSame( 200, $delete->get_status() );
		$data = $delete->get_data();
		$this->assertTrue( $data['deleted'] );
		$this->assertSame( 0.0, (float) $data['invoice']['amount_paid'] );
		$this->assertSame( InvoiceStatus::UNPAID, $data['invoice']['status'] );
	}

	/**
	 * @return void
	 */
	private function ensure_sales_module(): void {
		$modules = get_option( 'doublescale_enabled_modules', array() );
		if ( empty( $modules['sales'] ) ) {
			$modules['sales'] = true;
			update_option( 'doublescale_enabled_modules', $modules );
		}

		ModuleManager::activateModule( 'sales' );
	}

	/**
	 * @param array<string, mixed> $overrides Invoice attributes.
	 * @return InvoiceModel
	 */
	private function make_invoice( array $overrides = array() ): InvoiceModel {
		$contact_id = $this->make_contact();
		$defaults   = array(
			'contact_id'     => $contact_id,
			'status'         => InvoiceStatus::UNPAID,
			'currency'       => 'USD',
			'discount_type'  => 'none',
			'discount_value' => 0,
			'line_items'     => array(
				array(
					'qty'    => 1,
					'rate'   => 100,
					'amount' => 100,
				),
			),
			'invoice_date'   => current_time( 'Y-m-d' ),
			'due_date'       => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
		);

		$invoice = new InvoiceModel();
		$invoice->fill( array_merge( $defaults, $overrides ) );
		$invoice->save();

		return $invoice->fresh();
	}
}
