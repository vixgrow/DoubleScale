<?php
/**
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Services\DocumentPdf;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class DocumentPdfEndpointTest extends IntegrationTestCase {

	/** @var int */
	private $admin_id;

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		Capabilities::ensure_capabilities_synced();
		$this->admin_id = $this->make_admin_user();
	}

	public function test_invoice_pdf_endpoint_streams_pdf_bytes(): void {
		if ( ! class_exists( 'DoubleScale\\Vendor\\Dompdf\\Dompdf' ) ) {
			$this->markTestSkipped( 'Scoped Dompdf is not built. Run: cd dependencies && composer install && cd .. && composer scope:vendor' );
		}

		$invoice = $this->make_invoice();

		$response = $this->dispatch_rest(
			'GET',
			'/doublescale/v1/sales/invoices/' . (int) $invoice->id . '/pdf',
			array(),
			$this->admin_id
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringStartsWith( '%PDF', (string) $response->get_data() );
		$headers = $response->get_headers();
		$this->assertStringContainsString( 'application/pdf', (string) ( $headers['content-type'] ?? '' ) );
	}

	public function test_render_pdf_returns_wp_error_when_dompdf_missing(): void {
		if ( class_exists( 'DoubleScale\\Vendor\\Dompdf\\Dompdf' ) ) {
			$this->markTestSkipped( 'Dompdf is present; cannot assert missing-deps path in this environment.' );
		}

		$result = DocumentPdf::render_pdf(
			array(
				'invoice_number' => 'INV-000001',
				'currency'       => 'USD',
				'line_items'     => array(),
				'subtotal'       => 0,
				'total'          => 0,
			),
			'invoice'
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'pdf_unavailable', $result->get_error_code() );
	}

	/**
	 * @return InvoiceModel
	 */
	private function make_invoice(): InvoiceModel {
		$contact_id = $this->make_contact();
		$invoice    = new InvoiceModel();
		$invoice->fill(
			array(
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
			)
		);
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
