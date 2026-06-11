<?php
/**
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class PublicInvoiceStripeDelegationTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
	}

	protected function tearDown(): void {
		remove_all_filters( 'doublescale_sales_invoice_stripe_init' );
		remove_all_filters( 'doublescale_sales_invoice_stripe_confirm' );
		parent::tearDown();
	}

	public function test_stripe_init_returns_503_without_pro(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::UNPAID ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/public/invoices/' . $invoice->hash . '/stripe/init'
		);

		$this->assertSame( 503, $response->get_status() );
		$this->assertSame( 'stripe_unavailable', $response->as_error()->get_error_code() );
	}

	public function test_stripe_init_delegates_to_filter(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::UNPAID ) );

		add_filter(
			'doublescale_sales_invoice_stripe_init',
			static function () {
				return array(
					'publishable_key' => 'pk_test_123',
					'client_secret'   => 'cs_test_123',
				);
			}
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/public/invoices/' . $invoice->hash . '/stripe/init'
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'pk_test_123', $data['publishable_key'] );
		$this->assertSame( 'cs_test_123', $data['client_secret'] );
	}

	public function test_draft_invoice_cannot_init_stripe(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::DRAFT ) );

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/public/invoices/' . $invoice->hash . '/stripe/init'
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'invalid_status', $response->as_error()->get_error_code() );
	}

	public function test_paid_invoice_cannot_init_stripe(): void {
		$invoice = $this->make_invoice(
			array(
				'status'      => InvoiceStatus::PAID,
				'amount_paid' => 100.0,
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			'/doublescale/v1/sales/public/invoices/' . $invoice->hash . '/stripe/init'
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'invalid_status', $response->as_error()->get_error_code() );
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

	private function ensure_sales_module(): void {
		$modules = get_option( 'doublescale_enabled_modules', array() );
		if ( empty( $modules['sales'] ) ) {
			$modules['sales'] = true;
			update_option( 'doublescale_enabled_modules', $modules );
		}

		ModuleManager::activateModule( 'sales' );
	}
}
