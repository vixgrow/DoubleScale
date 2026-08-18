<?php
/**
 * Square end-to-end: init → confirm → record_paid + webhook handling.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Constants\PaymentMode;
use DoubleScale\Modules\Documents\Models\PaymentModel;
use DoubleScale\Pro\Modules\Integrations\Square\Integration as SquareIntegration;
use DoubleScale\Pro\Modules\Pro\Payment\SquareGateway;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\InvoicePayableSubject;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\SquareInvoiceWebhookHandler;

defined( 'ABSPATH' ) || exit;

final class SquareInvoicePaymentTest extends RedirectGatewayTestCase {

	protected function gateway_class(): string {
		return SquareGateway::class;
	}

	protected function api_host(): string {
		return 'squareup';
	}

	protected function settings_option(): string {
		return 'doublescale_square_settings';
	}

	protected function integration_instance() {
		return SquareIntegration::instance();
	}

	protected function configure_gateway(): void {
		update_option(
			'doublescale_square_settings',
			array(
				'mode'                 => 'sandbox',
				'sandbox_access_token' => 'test-token',
				'sandbox_location_id'  => 'LOC1',
				'sandbox_signature_key' => 'sig-key',
			)
		);
	}

	/**
	 * @return SquareGateway
	 */
	private function gateway(): SquareGateway {
		$gateway = GatewayManager::instance()->get( GatewayManager::CONTEXT_INVOICE, PaymentMode::SQUARE );
		$this->assertInstanceOf( SquareGateway::class, $gateway );
		return $gateway;
	}

	private function locations_body(): array {
		return array(
			'locations' => array(
				array(
					'id'       => 'LOC1',
					'name'     => 'Main',
					'currency' => 'USD',
					'status'   => 'ACTIVE',
				),
			),
		);
	}

	private function link_body( string $status_order_id = 'ORDER1' ): array {
		return array(
			'payment_link' => array(
				'id'       => 'LINK1',
				'order_id' => $status_order_id,
				'url'      => 'https://square.link/u/LINK1',
			),
		);
	}

	public function test_init_returns_a_redirect_url_and_stores_the_link_id(): void {
		$invoice = $this->make_invoice();

		$this->queue_http(
			array(
				array( 'body' => $this->locations_body() ),   // currency guard
				array( 'body' => $this->link_body() ),        // create link
			)
		);

		$result = $this->gateway()->init( new InvoicePayableSubject( $invoice ) );

		$this->assertIsArray( $result );
		$this->assertSame( 'https://square.link/u/LINK1', $result['redirect_url'] );
		$this->assertSame( 100.0, $result['amount'] );

		// The link id becomes the in-progress ref, and must not touch the
		// Stripe-specific column.
		$invoice->refresh();
		$this->assertSame( 'LINK1', (string) $invoice->external_payment_ref );
		$this->assertNull( $invoice->stripe_payment_intent_id );
	}

	/**
	 * Square settles per location currency; a mismatch must be refused before
	 * the customer is sent anywhere.
	 */
	public function test_init_refuses_a_currency_the_location_cannot_settle(): void {
		$invoice = $this->make_invoice( array( 'currency' => 'EUR' ) );

		$this->queue_http(
			array(
				array( 'body' => $this->locations_body() ), // USD location
			)
		);

		$result = $this->gateway()->init( new InvoicePayableSubject( $invoice ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'currency_mismatch', $result->get_error_code() );
	}

	public function test_init_refuses_an_invoice_with_no_balance(): void {
		$invoice = $this->make_invoice(
			array(
				'status'      => InvoiceStatus::PAID,
				'amount_paid' => 100.0,
			)
		);

		$result = $this->gateway()->init( new InvoicePayableSubject( $invoice ) );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'nothing_due', $result->get_error_code() );
	}

	/**
	 * The whole point of the chain: a completed Square payment must close the
	 * invoice with a correctly converted amount.
	 */
	public function test_confirm_records_the_payment_and_marks_the_invoice_paid(): void {
		$invoice = $this->make_invoice( array( 'external_payment_ref' => 'LINK1' ) );

		$this->queue_http(
			array(
				array( 'body' => $this->link_body() ),                       // get link
				array(
					'body' => array(
						'order' => array(
							'id'      => 'ORDER1',
							'tenders' => array( array( 'payment_id' => 'PAY1' ) ),
						),
					),
				),
				array(
					'body' => array(
						'payment' => array(
							'id'           => 'PAY1',
							'status'       => 'COMPLETED',
							'order_id'     => 'ORDER1',
							'amount_money' => array(
								'amount'   => 10000, // minor units
								'currency' => 'USD',
							),
						),
					),
				),
			)
		);

		$result = $this->gateway()->confirm( new InvoicePayableSubject( $invoice ) );

		$this->assertIsArray( $result );
		$this->assertSame( 'paid', $result['status'] );

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		// 10000 minor units must land as 100.00, not 10000.
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		$payment = PaymentModel::query()->where( 'transaction_id', 'PAY1' )->first();
		$this->assertNotNull( $payment );
		$this->assertSame( PaymentMode::SQUARE, (string) $payment->payment_mode );
		$this->assertSame( 100.0, (float) $payment->amount );
		$this->assertStringContainsString( 'Square', (string) $payment->note );
	}

	public function test_confirm_leaves_an_unpaid_link_pending(): void {
		$invoice = $this->make_invoice( array( 'external_payment_ref' => 'LINK1' ) );

		$this->queue_http(
			array(
				array( 'body' => $this->link_body() ),
				array(
					'body' => array(
						'order' => array(
							'id'      => 'ORDER1',
							'tenders' => array(),
						),
					),
				),
			)
		);

		$result = $this->gateway()->confirm( new InvoicePayableSubject( $invoice ) );

		$this->assertSame( 'pending', $result['status'] );

		$invoice->refresh();
		$this->assertNotSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 0, PaymentModel::query()->where( 'invoice_id', (int) $invoice->id )->count() );
	}

	public function test_webhook_payment_updated_records_the_payment(): void {
		$invoice = $this->make_invoice();

		SquareInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'type' => 'payment.updated',
				'data' => (object) array(
					'object' => (object) array(
						'payment' => (object) array(
							'id'           => 'PAY_WH',
							'status'       => 'COMPLETED',
							'note'         => 'invoice_' . (int) $invoice->id,
							'amount_money' => (object) array(
								'amount'   => 10000,
								'currency' => 'USD',
							),
						),
					),
				),
			)
		);

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
	}

	/**
	 * Square re-delivers on retry; a second delivery must not double-pay.
	 */
	public function test_duplicate_webhook_delivery_records_one_payment(): void {
		$invoice = $this->make_invoice();

		$event = (object) array(
			'type' => 'payment.updated',
			'data' => (object) array(
				'object' => (object) array(
					'payment' => (object) array(
						'id'           => 'PAY_DUP',
						'status'       => 'COMPLETED',
						'note'         => 'invoice_' . (int) $invoice->id,
						'amount_money' => (object) array(
							'amount'   => 10000,
							'currency' => 'USD',
						),
					),
				),
			),
		);

		$handler = SquareInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event( $event );
		$handler->handle_webhook_event( $event );

		$this->assertSame(
			1,
			PaymentModel::query()->where( 'transaction_id', 'PAY_DUP' )->count()
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
	}

	public function test_full_refund_webhook_reverses_the_payment(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::SQUARE,
				'transaction_id' => 'PAY_REF',
				'amount'         => 10000,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		SquareInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'type' => 'refund.created',
				'data' => (object) array(
					'object' => (object) array(
						'refund' => (object) array(
							'id'           => 'REF1',
							'status'       => 'COMPLETED',
							'payment_id'   => 'PAY_REF',
							'amount_money' => (object) array(
								'amount'   => 10000,
								'currency' => 'USD',
							),
						),
					),
				),
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', 'PAY_REF' )->first() );
	}

	public function test_partial_refund_webhook_leaves_the_remainder(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::SQUARE,
				'transaction_id' => 'PAY_PART',
				'amount'         => 10000,
				'currency'       => 'usd',
			)
		);

		SquareInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'type' => 'refund.created',
				'data' => (object) array(
					'object' => (object) array(
						'refund' => (object) array(
							'id'           => 'REF2',
							'status'       => 'COMPLETED',
							'payment_id'   => 'PAY_PART',
							'amount_money' => (object) array(
								'amount'   => 2500, // 25.00 of 100.00
								'currency' => 'USD',
							),
						),
					),
				),
			)
		);

		$invoice->refresh();
		$this->assertSame( 75.0, (float) $invoice->amount_paid );

		$payment = PaymentModel::query()->where( 'transaction_id', 'PAY_PART' )->first();
		$this->assertNotNull( $payment );
		$this->assertSame( 75.0, (float) $payment->amount );
	}

	/**
	 * A pending refund must not reduce the balance before it completes.
	 */
	public function test_pending_refund_is_ignored(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::SQUARE,
				'transaction_id' => 'PAY_PEND',
				'amount'         => 10000,
				'currency'       => 'usd',
			)
		);

		SquareInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'type' => 'refund.created',
				'data' => (object) array(
					'object' => (object) array(
						'refund' => (object) array(
							'id'           => 'REF3',
							'status'       => 'PENDING',
							'payment_id'   => 'PAY_PEND',
							'amount_money' => (object) array(
								'amount'   => 10000,
								'currency' => 'USD',
							),
						),
					),
				),
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
	}

	/**
	 * Security: a payment larger than the balance must be rejected outright.
	 */
	public function test_overpayment_is_refused(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::SQUARE,
				'transaction_id' => 'PAY_OVER',
				'amount'         => 500000, // 5000.00 against a 100.00 invoice
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', 'PAY_OVER' )->first() );
	}
}
