<?php
/**
 * Mollie end-to-end: init → confirm → record_paid + webhook handling.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Constants\PaymentMode;
use DoubleScale\Modules\Documents\Models\PaymentModel;
use DoubleScale\Pro\Modules\Integrations\Mollie\Integration as MollieIntegration;
use DoubleScale\Pro\Modules\Pro\Payment\MollieGateway;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\InvoicePayableSubject;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\MollieInvoiceWebhookHandler;

defined( 'ABSPATH' ) || exit;

final class MollieInvoicePaymentTest extends RedirectGatewayTestCase {

	protected function gateway_class(): string {
		return MollieGateway::class;
	}

	protected function api_host(): string {
		return 'mollie.com';
	}

	protected function settings_option(): string {
		return 'doublescale_mollie_settings';
	}

	protected function integration_instance() {
		return MollieIntegration::instance();
	}

	protected function configure_gateway(): void {
		update_option(
			'doublescale_mollie_settings',
			array(
				'mode'         => 'test',
				'test_api_key' => 'test_abc123',
			)
		);
	}

	/**
	 * @return MollieGateway
	 */
	private function gateway(): MollieGateway {
		$gateway = GatewayManager::instance()->get( GatewayManager::CONTEXT_INVOICE, PaymentMode::MOLLIE );
		$this->assertInstanceOf( MollieGateway::class, $gateway );
		return $gateway;
	}

	/**
	 * @param string $status Payment status.
	 * @param string $value  Amount as a decimal string.
	 * @param array  $extra  Extra top-level keys.
	 * @return array
	 */
	private function payment_body( string $status = 'open', string $value = '100.00', array $extra = array() ): array {
		return array_merge(
			array(
				'id'       => 'tr_abc123',
				'status'   => $status,
				'amount'   => array(
					'currency' => 'USD',
					'value'    => $value,
				),
				'metadata' => array( 'invoice_id' => '' ),
				'_links'   => array(
					'checkout' => array( 'href' => 'https://www.mollie.com/checkout/tr_abc123' ),
				),
			),
			$extra
		);
	}

	public function test_init_returns_a_redirect_url_and_stores_the_payment_id(): void {
		$invoice = $this->make_invoice();

		$this->queue_http(
			array(
				array( 'body' => $this->payment_body() ),
			)
		);

		$result = $this->gateway()->init( new InvoicePayableSubject( $invoice ) );

		$this->assertIsArray( $result );
		$this->assertSame( 'https://www.mollie.com/checkout/tr_abc123', $result['redirect_url'] );

		// Mollie takes a decimal string, not a float.
		$sent = $this->http_request_body( 0 );
		$this->assertSame( '100.00', $sent['amount']['value'] );
		$this->assertSame( (string) $invoice->id, $sent['metadata']['invoice_id'] );

		$invoice->refresh();
		$this->assertSame( 'tr_abc123', (string) $invoice->external_payment_ref );
		$this->assertNull( $invoice->stripe_payment_intent_id );
	}

	public function test_init_refuses_an_existing_payment_in_a_different_currency(): void {
		$invoice = $this->make_invoice(
			array(
				'currency'             => 'EUR',
				'external_payment_ref' => 'tr_abc123',
			)
		);

		$this->queue_http(
			array(
				array( 'body' => $this->payment_body( 'open' ) ),
			)
		);

		$result = $this->gateway()->init( new InvoicePayableSubject( $invoice ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'currency_mismatch', $result->get_error_code() );
	}

	public function test_confirm_records_a_paid_payment(): void {
		$invoice = $this->make_invoice( array( 'external_payment_ref' => 'tr_abc123' ) );

		$this->queue_http(
			array(
				array( 'body' => $this->payment_body( 'paid' ) ),
			)
		);

		$result = $this->gateway()->confirm( new InvoicePayableSubject( $invoice ) );

		$this->assertSame( 'paid', $result['status'] );

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		// Mollie reports major units — 100.00 must stay 100.00.
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		$payment = PaymentModel::query()->where( 'transaction_id', 'tr_abc123' )->first();
		$this->assertNotNull( $payment );
		$this->assertSame( PaymentMode::MOLLIE, (string) $payment->payment_mode );
		$this->assertSame( 100.0, (float) $payment->amount );
	}

	/**
	 * `open` must not close the invoice — the customer has not paid yet.
	 */
	public function test_confirm_leaves_an_open_payment_pending(): void {
		$invoice = $this->make_invoice( array( 'external_payment_ref' => 'tr_abc123' ) );

		$this->queue_http(
			array(
				array( 'body' => $this->payment_body( 'open' ) ),
			)
		);

		$result = $this->gateway()->confirm( new InvoicePayableSubject( $invoice ) );

		$this->assertSame( 'open', $result['status'] );

		$invoice->refresh();
		$this->assertNotSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 0, PaymentModel::query()->where( 'invoice_id', (int) $invoice->id )->count() );
	}

	public function test_webhook_paid_status_records_the_payment(): void {
		$invoice = $this->make_invoice();

		MollieInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'id'       => 'tr_wh1',
				'status'   => 'paid',
				'amount'   => (object) array(
					'currency' => 'USD',
					'value'    => '100.00',
				),
				'metadata' => (object) array( 'invoice_id' => (string) $invoice->id ),
			)
		);

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
	}

	public function test_duplicate_webhook_delivery_records_one_payment(): void {
		$invoice = $this->make_invoice();

		$payment = (object) array(
			'id'       => 'tr_dup',
			'status'   => 'paid',
			'amount'   => (object) array(
				'currency' => 'USD',
				'value'    => '100.00',
			),
			'metadata' => (object) array( 'invoice_id' => (string) $invoice->id ),
		);

		$handler = MollieInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event( $payment );
		$handler->handle_webhook_event( $payment );

		$this->assertSame(
			1,
			PaymentModel::query()->where( 'transaction_id', 'tr_dup' )->count()
		);
	}

	/**
	 * A refund arrives on the same payment object with amountRefunded set —
	 * it must not be mistaken for a fresh payment.
	 */
	public function test_refund_on_a_paid_payment_reverses_it(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::MOLLIE,
				'transaction_id' => 'tr_ref',
				'amount'         => 100.0,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		MollieInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'id'             => 'tr_ref',
				'status'         => 'paid',
				'amount'         => (object) array(
					'currency' => 'USD',
					'value'    => '100.00',
				),
				'amountRefunded' => (object) array(
					'currency' => 'USD',
					'value'    => '100.00',
				),
				'metadata'       => (object) array( 'invoice_id' => (string) $invoice->id ),
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', 'tr_ref' )->first() );
	}

	public function test_partial_refund_leaves_the_remainder(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::MOLLIE,
				'transaction_id' => 'tr_part',
				'amount'         => 100.0,
				'currency'       => 'usd',
			)
		);

		MollieInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'id'             => 'tr_part',
				'status'         => 'paid',
				'amount'         => (object) array(
					'currency' => 'USD',
					'value'    => '100.00',
				),
				'amountRefunded' => (object) array(
					'currency' => 'USD',
					'value'    => '40.00',
				),
				'metadata'       => (object) array( 'invoice_id' => (string) $invoice->id ),
			)
		);

		$invoice->refresh();
		$this->assertSame( 60.0, (float) $invoice->amount_paid );
	}

	/**
	 * A failed checkout must release the in-progress ref so the customer can
	 * retry, but must not touch an invoice that is already paid.
	 */
	public function test_failed_payment_clears_the_in_progress_ref(): void {
		$invoice = $this->make_invoice( array( 'external_payment_ref' => 'tr_fail' ) );

		MollieInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'id'       => 'tr_fail',
				'status'   => 'failed',
				'amount'   => (object) array(
					'currency' => 'USD',
					'value'    => '100.00',
				),
				'metadata' => (object) array( 'invoice_id' => (string) $invoice->id ),
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNotSame( InvoiceStatus::PAID, (string) $invoice->status );
	}

	public function test_overpayment_is_refused(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::MOLLIE,
				'transaction_id' => 'tr_over',
				'amount'         => 5000.0,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', 'tr_over' )->first() );
	}
}
