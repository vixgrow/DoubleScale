<?php
/**
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class PublicInvoiceAccessTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
	}

	public function test_first_view_sets_viewed_at(): void {
		$invoice = $this->make_invoice(
			array(
				'status' => InvoiceStatus::UNPAID,
			)
		);
		$this->assertNull( $invoice->viewed_at );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/public/invoices/' . $invoice->hash
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( (string) $invoice->invoice_number, $data['invoice_number'] );
		$this->assertArrayHasKey( 'balance', $data );
		$this->assertArrayHasKey( 'can_pay', $data );

		$invoice->refresh();
		$this->assertNotEmpty( $invoice->viewed_at );
	}

	public function test_bad_hash_returns_404(): void {
		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/public/invoices/' . str_repeat( '0', 32 )
		);

		$this->assertSame( 404, $response->get_status() );
	}

	public function test_rate_limit_returns_429(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::UNPAID ) );

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
		$key = 'ds_sales_inv_pub_' . md5( $ip );
		set_transient( $key, 121, MINUTE_IN_SECONDS );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/public/invoices/' . $invoice->hash
		);

		$this->assertSame( 429, $response->get_status() );
	}

	public function test_draft_invoice_is_not_publicly_accessible(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::DRAFT ) );

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/public/invoices/' . $invoice->hash
		);

		$this->assertSame( 404, $response->get_status() );
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
