<?php
/**
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Services\DocumentPdf;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class DocumentPdfHtmlTest extends TestCase {

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
}
