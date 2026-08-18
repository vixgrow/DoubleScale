<?php
/**
 * A paid invoice must never be relabelled by a global currency change.
 *
 * Freezing on send is not enough: an invoice can take money without ever being
 * "sent" — recorded manually by staff, paid through the portal, charged by a
 * gateway, or settled by a credit note. Such an invoice keeps a NULL currency
 * (inherit), so changing the global setting afterwards silently restates a
 * settled USD payment as EUR. Payments have no currency column of their own and
 * inherit the parent invoice's, so every historical payment row is relabelled
 * with it.
 *
 * InvoicePayments::sync() therefore pins the currency as soon as amount_paid
 * goes above zero. RestInvoiceController's update guard already refuses a
 * currency change on a paid invoice; this covers the write that guard assumes
 * has happened.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\PaymentModel;
use DoubleScale\Modules\Documents\Services\InvoicePayments;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class PaidInvoiceCurrencyPinTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		Settings::update( 'currency', array( 'currency' => 'USD' ) );
	}

	/**
	 * An unsent, inheriting invoice that gets paid pins to the paid currency.
	 */
	public function test_payment_pins_currency_on_an_unsent_invoice(): void {
		$invoice = $this->make_inheriting_invoice();

		$this->assertNull( $invoice->currency, 'Fixture must start as inherit (NULL).' );
		$this->assertEmpty( $invoice->sent_at, 'Fixture must be unsent — that is the gap being covered.' );

		$this->pay( $invoice, 100.0 );
		$invoice = InvoiceModel::find( (int) $invoice->id );

		$this->assertSame( 'USD', (string) $invoice->currency, 'Payment must pin the stored currency.' );

		// The admin changes the global currency afterwards.
		Settings::update( 'currency', array( 'currency' => 'EUR' ) );
		$invoice = InvoiceModel::find( (int) $invoice->id );

		$this->assertSame(
			'USD',
			Settings::document_currency( $invoice->currency, $invoice->sent_at ),
			'A settled USD payment must not be restated as EUR.'
		);
	}

	/**
	 * An unpaid invoice keeps inheriting — the pin is triggered by money, not by
	 * merely touching the invoice.
	 */
	public function test_unpaid_invoice_still_inherits(): void {
		$invoice = $this->make_inheriting_invoice();

		( new InvoicePayments() )->sync( $invoice );
		$invoice = InvoiceModel::find( (int) $invoice->id );

		$this->assertTrue(
			null === $invoice->currency || '' === $invoice->currency,
			'Syncing an unpaid invoice must not bake in a currency.'
		);

		Settings::update( 'currency', array( 'currency' => 'EUR' ) );
		$invoice = InvoiceModel::find( (int) $invoice->id );

		$this->assertSame(
			'EUR',
			Settings::document_currency( $invoice->currency, $invoice->sent_at ),
			'An unpaid draft must keep following the global currency.'
		);
	}

	/**
	 * An explicit choice is never overwritten by the pin.
	 */
	public function test_explicit_currency_survives_payment(): void {
		$invoice = $this->make_inheriting_invoice();
		$invoice->currency = 'GBP';
		$invoice->save();

		$this->pay( $invoice, 100.0 );
		$invoice = InvoiceModel::find( (int) $invoice->id );

		$this->assertSame( 'GBP', (string) $invoice->currency, 'The pin must not clobber an explicit choice.' );
	}

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @param float        $amount  Amount to record.
	 * @return void
	 */
	private function pay( InvoiceModel $invoice, float $amount ): void {
		PaymentModel::create(
			array(
				'invoice_id'   => (int) $invoice->id,
				'amount'       => $amount,
				'payment_date' => current_time( 'Y-m-d' ),
				'payment_mode' => 'cash',
			)
		);

		( new InvoicePayments() )->sync( $invoice );
	}

	/**
	 * An invoice whose stored currency column is genuinely NULL.
	 *
	 * @return InvoiceModel
	 */
	private function make_inheriting_invoice(): InvoiceModel {
		global $wpdb;

		$invoice = new InvoiceModel();
		$invoice->fill(
			array(
				'contact_id'     => $this->make_contact(),
				'status'         => InvoiceStatus::DRAFT,
				'currency'       => null,
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

		// Model defaults can coerce NULL to 'USD'; force the true inherit state.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->update(
			$wpdb->prefix . 'doublescale_sales_invoices',
			array( 'currency' => null ),
			array( 'id' => (int) $invoice->id )
		);

		return InvoiceModel::find( (int) $invoice->id );
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
