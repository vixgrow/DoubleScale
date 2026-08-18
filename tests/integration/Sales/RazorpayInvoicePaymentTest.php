<?php
/**
 * Razorpay end-to-end: init → confirm → record_paid + webhook handling.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Constants\PaymentMode;
use DoubleScale\Modules\Documents\Models\PaymentModel;
use DoubleScale\Pro\Modules\Integrations\Razorpay\Integration as RazorpayIntegration;
use DoubleScale\Pro\Modules\Pro\Payment\RazorpayGateway;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\InvoicePayableSubject;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\RazorpayInvoiceWebhookHandler;

defined( 'ABSPATH' ) || exit;

final class RazorpayInvoicePaymentTest extends RedirectGatewayTestCase {

	protected function gateway_class(): string {
		return RazorpayGateway::class;
	}

	protected function api_host(): string {
		return 'razorpay.com';
	}

	protected function settings_option(): string {
		return 'doublescale_razorpay_settings';
	}

	protected function integration_instance() {
		return RazorpayIntegration::instance();
	}

	protected function configure_gateway(): void {
		update_option(
			'doublescale_razorpay_settings',
			array(
				'mode'                => 'test',
				'test_key_id'         => 'rzp_test_abc',
				'test_key_secret'     => 'secret',
				'test_webhook_secret' => 'wh-secret',
			)
		);
	}

	/**
	 * @return RazorpayGateway
	 */
	private function gateway(): RazorpayGateway {
		$gateway = GatewayManager::instance()->get( GatewayManager::CONTEXT_INVOICE, PaymentMode::RAZORPAY );
		$this->assertInstanceOf( RazorpayGateway::class, $gateway );
		return $gateway;
	}

	/**
	 * @param string $status   Link status.
	 * @param array  $payments Payments array.
	 * @return array
	 */
	private function link_body( string $status = 'created', array $payments = array() ): array {
		return array(
			'id'          => 'plink_abc',
			'status'      => $status,
			'amount'      => 10000,
			'amount_paid' => 'paid' === $status ? 10000 : 0,
			'currency'    => 'USD',
			'short_url'   => 'https://rzp.io/i/abc',
			'notes'       => array( 'invoice_id' => '' ),
			'payments'    => $payments,
		);
	}

	public function test_init_returns_a_redirect_url_and_stores_the_link_id(): void {
		$invoice = $this->make_invoice();

		$this->queue_http(
			array(
				array( 'body' => $this->link_body() ),
			)
		);

		$result = $this->gateway()->init( new InvoicePayableSubject( $invoice ) );

		$this->assertIsArray( $result );
		$this->assertSame( 'https://rzp.io/i/abc', $result['redirect_url'] );

		// Razorpay takes paise, and must carry the invoice id in notes.
		$sent = $this->http_request_body( 0 );
		$this->assertSame( 10000, $sent['amount'] );
		$this->assertSame( (string) $invoice->id, $sent['notes']['invoice_id'] );

		$invoice->refresh();
		$this->assertSame( 'plink_abc', (string) $invoice->external_payment_ref );
		$this->assertNull( $invoice->stripe_payment_intent_id );
	}

	/**
	 * The link is not the charge: the recorded transaction must be the
	 * underlying payment id, not the payment-link id.
	 */
	public function test_confirm_records_the_underlying_payment_not_the_link(): void {
		$invoice = $this->make_invoice( array( 'external_payment_ref' => 'plink_abc' ) );

		$this->queue_http(
			array(
				array(
					'body' => $this->link_body(
						'paid',
						array(
							array(
								'payment_id' => 'pay_real',
								'status'     => 'captured',
								'amount'     => 10000,
							),
						)
					),
				),
				array(
					'body' => array(
						'id'       => 'pay_real',
						'status'   => 'captured',
						'amount'   => 10000,
						'currency' => 'USD',
					),
				),
			)
		);

		$result = $this->gateway()->confirm( new InvoicePayableSubject( $invoice ) );

		$this->assertSame( 'paid', $result['status'] );

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		// The payment id, not plink_abc.
		$this->assertNotNull( PaymentModel::query()->where( 'transaction_id', 'pay_real' )->first() );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', 'plink_abc' )->first() );
	}

	public function test_confirm_leaves_an_unpaid_link_pending(): void {
		$invoice = $this->make_invoice( array( 'external_payment_ref' => 'plink_abc' ) );

		$this->queue_http(
			array(
				array( 'body' => $this->link_body( 'created' ) ),
			)
		);

		$result = $this->gateway()->confirm( new InvoicePayableSubject( $invoice ) );

		$this->assertSame( 'created', $result['status'] );

		$invoice->refresh();
		$this->assertNotSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 0, PaymentModel::query()->where( 'invoice_id', (int) $invoice->id )->count() );
	}

	public function test_webhook_payment_link_paid_records_the_payment(): void {
		$invoice = $this->make_invoice();

		RazorpayInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'event'   => 'payment_link.paid',
				'payload' => (object) array(
					'payment_link' => (object) array(
						'entity' => (object) array(
							'id'    => 'plink_wh',
							'notes' => (object) array( 'invoice_id' => (string) $invoice->id ),
						),
					),
					'payment'      => (object) array(
						'entity' => (object) array(
							'id'       => 'pay_wh',
							'status'   => 'captured',
							'amount'   => 10000,
							'currency' => 'USD',
						),
					),
				),
			)
		);

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
	}

	public function test_duplicate_webhook_delivery_records_one_payment(): void {
		$invoice = $this->make_invoice();

		$event = (object) array(
			'event'   => 'payment.captured',
			'payload' => (object) array(
				'payment' => (object) array(
					'entity' => (object) array(
						'id'       => 'pay_dup',
						'status'   => 'captured',
						'amount'   => 10000,
						'currency' => 'USD',
						'notes'    => (object) array( 'invoice_id' => (string) $invoice->id ),
					),
				),
			),
		);

		$handler = RazorpayInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event( $event );
		$handler->handle_webhook_event( $event );

		$this->assertSame(
			1,
			PaymentModel::query()->where( 'transaction_id', 'pay_dup' )->count()
		);
	}

	/**
	 * An authorized-but-not-captured payment must not close the invoice.
	 */
	public function test_uncaptured_payment_is_not_recorded(): void {
		$invoice = $this->make_invoice();

		RazorpayInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'event'   => 'payment.captured',
				'payload' => (object) array(
					'payment' => (object) array(
						'entity' => (object) array(
							'id'       => 'pay_created',
							'status'   => 'created',
							'amount'   => 10000,
							'currency' => 'USD',
							'notes'    => (object) array( 'invoice_id' => (string) $invoice->id ),
						),
					),
				),
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
	}

	public function test_full_refund_webhook_reverses_the_payment(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::RAZORPAY,
				'transaction_id' => 'pay_ref',
				'amount'         => 10000,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		RazorpayInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'event'   => 'refund.processed',
				'payload' => (object) array(
					'refund' => (object) array(
						'entity' => (object) array(
							'id'         => 'rfnd_1',
							'payment_id' => 'pay_ref',
							'amount'     => 10000,
						),
					),
				),
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', 'pay_ref' )->first() );
	}

	public function test_partial_refund_leaves_the_remainder(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::RAZORPAY,
				'transaction_id' => 'pay_part',
				'amount'         => 10000,
				'currency'       => 'usd',
			)
		);

		RazorpayInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'event'   => 'refund.processed',
				'payload' => (object) array(
					'refund' => (object) array(
						'entity' => (object) array(
							'id'         => 'rfnd_2',
							'payment_id' => 'pay_part',
							'amount'     => 3000, // 30.00 of 100.00
						),
					),
				),
			)
		);

		$invoice->refresh();
		$this->assertSame( 70.0, (float) $invoice->amount_paid );
	}

	public function test_overpayment_is_refused(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::RAZORPAY,
				'transaction_id' => 'pay_over',
				'amount'         => 500000,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', 'pay_over' )->first() );
	}
}
