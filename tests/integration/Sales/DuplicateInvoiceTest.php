<?php
/**
 * Invoice duplication: content is copied, financial state is not.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class DuplicateInvoiceTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		Capabilities::ensure_capabilities_synced();
	}

	private function duplicate_route( int $invoice_id ): string {
		return '/doublescale/v1/sales/invoices/' . $invoice_id . '/duplicate';
	}

	public function test_duplicate_copies_content_and_returns_a_draft(): void {
		$admin   = $this->make_admin_user();
		$invoice = $this->make_invoice();

		$response = $this->dispatch_rest(
			'POST',
			$this->duplicate_route( (int) $invoice->id ),
			array(),
			$admin
		);

		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( InvoiceStatus::DRAFT, $data['status'] );
		$this->assertNotSame( (int) $invoice->id, (int) $data['id'] );
		$this->assertNotSame( (string) $invoice->invoice_number, (string) $data['invoice_number'] );

		$copy = InvoiceModel::find( (int) $data['id'] );
		$this->assertNotNull( $copy );
		$this->assertSame( (int) $invoice->contact_id, (int) $copy->contact_id );
		$this->assertSame( (string) $invoice->currency, (string) $copy->currency );
		// Totals are recomputed from the copied line items, not carried over.
		$this->assertSame( (float) $invoice->total, (float) $copy->total );
	}

	public function test_duplicate_resets_payment_state(): void {
		$admin   = $this->make_admin_user();
		$invoice = $this->make_invoice(
			array(
				'status'               => InvoiceStatus::PARTIALLY_PAID,
				'amount_paid'          => 40,
				'external_payment_ref' => 'ext_ref_123',
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			$this->duplicate_route( (int) $invoice->id ),
			array(),
			$admin
		);

		$copy = InvoiceModel::find( (int) $response->get_data()['id'] );

		$this->assertSame( 0.0, (float) $copy->amount_paid );
		$this->assertSame( InvoiceStatus::DRAFT, (string) $copy->status );
		$this->assertEmpty( $copy->external_payment_ref );
		$this->assertEmpty( $copy->sent_at );
	}

	public function test_duplicate_does_not_inherit_the_proposal_link(): void {
		$admin   = $this->make_admin_user();
		$invoice = $this->make_invoice( array( 'proposal_id' => 4242 ) );

		$response = $this->dispatch_rest(
			'POST',
			$this->duplicate_route( (int) $invoice->id ),
			array(),
			$admin
		);

		$copy = InvoiceModel::find( (int) $response->get_data()['id'] );

		// Carrying the link over would make two invoices claim one proposal and
		// break the "already converted" guard.
		$this->assertEmpty( $copy->proposal_id );
	}

	public function test_duplicate_gets_a_fresh_number_and_hash(): void {
		$admin   = $this->make_admin_user();
		$invoice = $this->make_invoice();

		$response = $this->dispatch_rest(
			'POST',
			$this->duplicate_route( (int) $invoice->id ),
			array(),
			$admin
		);

		$copy = InvoiceModel::find( (int) $response->get_data()['id'] );

		$this->assertNotEmpty( $copy->invoice_number );
		$this->assertNotEmpty( $copy->hash );
		$this->assertNotSame( (string) $invoice->hash, (string) $copy->hash );
	}

	public function test_duplicate_preserves_the_payment_window(): void {
		$admin   = $this->make_admin_user();
		$invoice = $this->make_invoice(
			array(
				'invoice_date' => gmdate( 'Y-m-d', strtotime( '-40 days' ) ),
				'due_date'     => gmdate( 'Y-m-d', strtotime( '-10 days' ) ),
			)
		);

		$response = $this->dispatch_rest(
			'POST',
			$this->duplicate_route( (int) $invoice->id ),
			array(),
			$admin
		);

		$copy = InvoiceModel::find( (int) $response->get_data()['id'] );

		// Source span is 30 days; the copy re-issues today with the same span
		// rather than inheriting a date already in the past.
		$this->assertSame( current_time( 'Y-m-d' ), (string) $copy->invoice_date );
		$this->assertSame(
			gmdate( 'Y-m-d', strtotime( current_time( 'Y-m-d' ) . ' +30 days' ) ),
			(string) $copy->due_date
		);
	}

	public function test_unknown_invoice_returns_404(): void {
		$admin = $this->make_admin_user();

		$response = $this->dispatch_rest(
			'POST',
			$this->duplicate_route( 999999 ),
			array(),
			$admin
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
					'description' => 'Service',
					'qty'         => 2,
					'rate'        => 50,
					'amount'      => 100,
				),
			),
			'invoice_date'   => current_time( 'Y-m-d' ),
			'due_date'       => gmdate( 'Y-m-d', strtotime( '+7 days' ) ),
			'client_note'    => 'Thanks for your business.',
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
