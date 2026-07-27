<?php
/**
 * @package DoubleScale\Tests\Modules\Documents
 */

namespace DoubleScale\Tests\Modules\Documents;

require_once __DIR__ . '/../../../SupportImapTestStubs.php';

use DoubleScale\Modules\Documents\Services\DocumentPdf;
use PHPUnit\Framework\TestCase;

require_once dirname( __DIR__, 3 ) . '/ProTestAutoload.php';

/**
 * @group smoke
 */
final class DocumentPdfHtmlTest extends TestCase {

	public static function setUpBeforeClass(): void {
		doublescale_phpunit_ensure_pro_autoload();
		parent::setUpBeforeClass();
	}

	public function test_render_html_includes_invoice_totals_and_tax(): void {
		$html = DocumentPdf::render_html(
			array(
				'invoice_number' => 'INV-000042',
				'currency'       => 'USD',
				'invoice_date'   => '2026-06-01',
				'due_date'       => '2026-06-15',
				'billing_address'=> "Acme Corp\n1 Main St",
				'line_items'     => array(
					array(
						'description' => 'Consulting',
						'qty'         => 2,
						'rate'        => 50,
						'amount'      => 100,
						'tax'         => array( array( 'name' => 'VAT', 'rate' => 10 ) ),
					),
				),
				'subtotal'       => 100.0,
				'total_tax'      => 10.0,
				'discount_type'  => 'none',
				'discount_value' => 0,
				'adjustment'     => 0,
				'total'          => 110.0,
				'amount_paid'    => 10.0,
			),
			'invoice'
		);

		$this->assertStringContainsString( 'INV-000042', $html );
		$this->assertStringContainsString( 'Consulting', $html );
		$this->assertStringContainsString( 'Balance Due', $html );
		$this->assertStringContainsString( 'VAT (10%)', $html );
	}

	public function test_render_html_includes_proposal_subject(): void {
		$html = DocumentPdf::render_html(
			array(
				'proposal_number' => 'PRO-000007',
				'subject'         => 'Website redesign',
				'currency'        => 'EUR',
				'date'            => '2026-06-01',
				'open_till'       => '2026-06-30',
				'to_name'         => 'Jane Doe',
				'line_items'      => array(
					array( 'description' => 'Design', 'qty' => 1, 'rate' => 500, 'amount' => 500 ),
				),
				'subtotal'        => 500.0,
				'discount_type'   => 'none',
				'discount_value'  => 0,
				'adjustment'      => 0,
				'total'           => 500.0,
			),
			'proposal'
		);

		$this->assertStringContainsString( 'PRO-000007', $html );
		$this->assertStringContainsString( 'Website redesign', $html );
		$this->assertStringContainsString( 'Jane Doe', $html );
	}

	public function test_render_html_includes_contract_subject_and_value(): void {
		$html = \DoubleScale\Pro\Modules\Contracts\Services\ContractPdf::render_html(
			array(
				'contract_number' => 'CON-000007',
				'subject'         => 'Annual retainer',
				'currency'        => 'USD',
				'contract_value'  => 2400.0,
				'start_date'      => '2026-01-01',
				'end_date'        => '2026-12-31',
				'description'     => '<p>Service level agreement terms.</p>',
				'contract_type'   => array(
					'id'   => 1,
					'name' => 'Retainer',
				),
				'contact'         => array(
					'first_name' => 'Jane',
					'last_name'  => 'Doe',
					'email'      => 'jane@example.com',
				),
			)
		);

		$this->assertStringContainsString( 'CON-000007', $html );
		$this->assertStringContainsString( 'Annual retainer', $html );
		$this->assertStringContainsString( '2,400.00 USD', $html );
		$this->assertStringContainsString( 'Retainer', $html );
		$this->assertStringContainsString( 'Service level agreement terms.', $html );
	}

	public function test_resolved_company_block_includes_registration_and_tax(): void {
		update_option(
			'doublescale_sales_settings',
			array(
				'pdf_company_registration_number' => 'REG-12345',
				'pdf_company_tax_vat_number'      => 'VAT-98765',
			)
		);

		$company = DocumentPdf::resolved_company_block();

		$this->assertSame( 'REG-12345', $company['registration_number'] );
		$this->assertSame( 'VAT-98765', $company['tax_vat_number'] );
	}

	public function test_render_html_includes_supplier_legal_ids(): void {
		update_option(
			'doublescale_sales_settings',
			array(
				'pdf_company_registration_number' => 'REG-555',
				'pdf_company_tax_vat_number'      => 'VAT-777',
			)
		);

		$html = DocumentPdf::render_html(
			array(
				'invoice_number' => 'INV-LEGAL-1',
				'currency'       => 'USD',
				'invoice_date'   => '2026-06-01',
				'due_date'       => '2026-06-15',
				'billing_address'=> "Acme Corp\nRegistration: CUST-REG\nTax/VAT: CUST-VAT",
				'line_items'     => array(
					array(
						'description' => 'Item',
						'qty'         => 1,
						'rate'        => 100,
						'amount'      => 100,
					),
				),
				'subtotal'       => 100.0,
				'total_tax'      => 0.0,
				'discount_type'  => 'none',
				'discount_value' => 0,
				'adjustment'     => 0,
				'total'          => 100.0,
				'amount_paid'    => 0.0,
			),
			'invoice'
		);

		$this->assertStringContainsString( 'Registration: REG-555', $html );
		$this->assertStringContainsString( 'Tax/VAT: VAT-777', $html );
		$this->assertStringContainsString( 'Registration: CUST-REG', $html );
		$this->assertStringContainsString( 'Tax/VAT: CUST-VAT', $html );
	}

	public function test_render_html_uses_issuer_snapshot_when_sent(): void {
		$live = DocumentPdf::resolved_company_block();
		$snapshot = $live;
		$snapshot['registration_number'] = 'SNAPSHOT-REG';
		$snapshot['tax_vat_number']     = 'SNAPSHOT-VAT';

		update_option(
			'doublescale_sales_settings',
			array(
				'pdf_company_registration_number' => 'LIVE-REG',
				'pdf_company_tax_vat_number'      => 'LIVE-VAT',
			)
		);

		$html = DocumentPdf::render_html(
			array(
				'invoice_number'      => 'INV-SNAPSHOT-1',
				'currency'            => 'USD',
				'invoice_date'        => '2026-06-01',
				'due_date'            => '2026-06-15',
				'sent_at'             => '2026-06-01 10:00:00',
				'issuer_snapshot_raw' => wp_json_encode( $snapshot ),
				'billing_address'     => 'Customer',
				'line_items'          => array(
					array(
						'description' => 'Item',
						'qty'         => 1,
						'rate'        => 50,
						'amount'      => 50,
					),
				),
				'subtotal'            => 50.0,
				'total_tax'           => 0.0,
				'discount_type'       => 'none',
				'discount_value'      => 0,
				'adjustment'          => 0,
				'total'               => 50.0,
				'amount_paid'         => 0.0,
			),
			'invoice'
		);

		$this->assertStringContainsString( 'Registration: SNAPSHOT-REG', $html );
		$this->assertStringContainsString( 'Tax/VAT: SNAPSHOT-VAT', $html );
		$this->assertStringNotContainsString( 'Registration: LIVE-REG', $html );
	}
}
