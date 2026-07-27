<?php
/**
 * @package DoubleScale\Tests\Modules\Documents
 */

namespace DoubleScale\Tests\Modules\Documents;

require_once __DIR__ . '/../../../SupportImapTestStubs.php';

use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Documents\Services\DocumentCustomerDetails;
use DoubleScale\Modules\Documents\Services\DocumentIssuerSnapshot;
use DoubleScale\Modules\Documents\Services\DocumentPdf;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class DocumentLegalFieldsTest extends TestCase {

	public function test_compose_billing_address_includes_company_and_legal_ids(): void {
		$contact = new ContactModel();
		$contact->forceFill(
			array(
				'company_name'                => 'Acme Ltd',
				'first_name'                  => 'Jane',
				'last_name'                   => 'Doe',
				'address_1'                   => '1 Main St',
				'city'                        => 'London',
				'country'                     => 'UK',
				'email'                       => 'jane@example.com',
				'company_registration_number' => 'CUST-REG',
				'tax_vat_number'              => 'CUST-VAT',
			)
		);

		$billing = DocumentCustomerDetails::compose_billing_address( $contact );

		$this->assertStringContainsString( 'Acme Ltd', $billing );
		$this->assertStringContainsString( 'Registration: CUST-REG', $billing );
		$this->assertStringContainsString( 'Tax/VAT: CUST-VAT', $billing );
	}

	public function test_freeze_if_needed_writes_issuer_snapshot_once(): void {
		$document = (object) array(
			'issuer_snapshot' => null,
		);

		DocumentIssuerSnapshot::freeze_if_needed( $document );

		$this->assertNotEmpty( $document->issuer_snapshot );
		$decoded = json_decode( (string) $document->issuer_snapshot, true );
		$this->assertIsArray( $decoded );
		$this->assertArrayHasKey( 'name', $decoded );

		$original = $document->issuer_snapshot;
		DocumentIssuerSnapshot::freeze_if_needed( $document );
		$this->assertSame( $original, $document->issuer_snapshot );
	}

	public function test_resolve_company_for_shaped_prefers_snapshot_when_sent(): void {
		update_option(
			'doublescale_sales_settings',
			array(
				'pdf_company_registration_number' => 'LIVE-REG',
			)
		);

		$snapshot = DocumentPdf::resolved_company_block();
		$snapshot['registration_number'] = 'FROZEN-REG';

		$company = DocumentIssuerSnapshot::resolve_company_for_shaped(
			array(
				'sent_at'             => '2026-01-01 00:00:00',
				'issuer_snapshot_raw' => wp_json_encode( $snapshot ),
			)
		);

		$this->assertSame( 'FROZEN-REG', $company['registration_number'] );
	}
}
