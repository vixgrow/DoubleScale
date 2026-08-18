<?php
/**
 * Authorize.Net end-to-end: init → confirm → record_paid + webhook handling.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Constants\PaymentMode;
use DoubleScale\Modules\Documents\Models\PaymentModel;
use DoubleScale\Pro\Modules\Integrations\AuthorizeNet\Integration as AuthorizeNetIntegration;
use DoubleScale\Pro\Modules\Pro\Payment\AuthorizeNetGateway;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\AuthorizeNetInvoiceWebhookHandler;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\InvoicePayableSubject;

defined( 'ABSPATH' ) || exit;

final class AuthorizeNetInvoicePaymentTest extends RedirectGatewayTestCase {

	protected function gateway_class(): string {
		return AuthorizeNetGateway::class;
	}

	protected function api_host(): string {
		return 'authorize.net';
	}

	protected function settings_option(): string {
		return 'doublescale_authorize_net_settings';
	}

	protected function integration_instance() {
		return AuthorizeNetIntegration::instance();
	}

	protected function configure_gateway(): void {
		update_option(
			'doublescale_authorize_net_settings',
			array(
				'mode'                    => 'sandbox',
				'sandbox_login_id'        => 'login',
				'sandbox_transaction_key' => 'txnkey',
				'sandbox_signature_key'   => '3A1B2C3D4E5F60718293A4B5C6D7E8F9',
			)
		);
	}

	/**
	 * @return AuthorizeNetGateway
	 */
	private function gateway(): AuthorizeNetGateway {
		$gateway = GatewayManager::instance()->get(
			GatewayManager::CONTEXT_INVOICE,
			PaymentMode::AUTHORIZE_NET
		);
		$this->assertInstanceOf( AuthorizeNetGateway::class, $gateway );
		return $gateway;
	}

	private function ok(): array {
		return array(
			'messages' => array(
				'resultCode' => 'Ok',
				'message'    => array(
					array(
						'code' => 'I00001',
						'text' => 'Successful.',
					),
				),
			),
		);
	}

	/**
	 * @param array $transactions Transaction summaries.
	 * @return array
	 */
	private function list_body( array $transactions = array() ): array {
		return array_merge( array( 'transactions' => $transactions ), $this->ok() );
	}

	/**
	 * @param string $status         Transaction status.
	 * @param string $amount         Settle amount.
	 * @param int    $invoice_id     Invoice id used in the description.
	 * @param string $invoice_number Invoice number.
	 * @return array
	 */
	private function details_body(
		string $status = 'capturedPendingSettlement',
		string $amount = '100.00',
		int $invoice_id = 1,
		string $invoice_number = 'INV-1'
	): array {
		return array_merge(
			array(
				'transaction' => array(
					'transId'           => '60000001',
					'transactionStatus' => $status,
					'settleAmount'      => $amount,
					'order'             => array(
						'invoiceNumber' => $invoice_number,
						'description'   => 'invoice_' . $invoice_id,
					),
				),
			),
			$this->ok()
		);
	}

	/**
	 * Every Authorize.Net response carries a UTF-8 BOM in production; queue it
	 * so these tests exercise the real byte shape.
	 *
	 * @param array $responses Bodies.
	 * @return void
	 */
	private function queue_authnet( array $responses ): void {
		$this->queue_http(
			array_map(
				static function ( $body ) {
					return array(
						'body' => $body,
						'bom'  => true,
					);
				},
				$responses
			)
		);
	}

	public function test_init_returns_a_handoff_redirect_url(): void {
		$invoice = $this->make_invoice();

		$this->queue_authnet(
			array(
				$this->list_body(),                                   // no prior settled txn
				array_merge( array( 'token' => 'TOK123' ), $this->ok() ), // hosted page token
			)
		);

		$result = $this->gateway()->init( new InvoicePayableSubject( $invoice ) );

		$this->assertIsArray( $result );

		// Accept Hosted needs a POST, so the redirect goes via our bridge.
		// Decode first: without pretty permalinks the route is query-encoded.
		$redirect = urldecode( (string) $result['redirect_url'] );
		$this->assertStringContainsString( 'authorize-net/handoff', $redirect );
		$this->assertStringContainsString( 'id=', $redirect );

		// The single-use token must never appear in the URL — it would leak
		// into browser history, logs and referrers.
		$this->assertStringNotContainsString( 'TOK123', $redirect );

		$invoice->refresh();
		$this->assertNull( $invoice->stripe_payment_intent_id );
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
	 * Accept Hosted returns nothing on redirect, so confirm() has to find the
	 * charge by invoice number and record it.
	 */
	public function test_confirm_records_a_captured_transaction(): void {
		$invoice = $this->make_invoice();

		$this->queue_authnet(
			array(
				$this->list_body(
					array(
						array(
							'transId'           => '60000001',
							'invoiceNumber'     => (string) $invoice->invoice_number,
							'transactionStatus' => 'capturedPendingSettlement',
						),
					)
				),
				$this->details_body(
					'capturedPendingSettlement',
					'100.00',
					(int) $invoice->id,
					(string) $invoice->invoice_number
				),
			)
		);

		$result = $this->gateway()->confirm( new InvoicePayableSubject( $invoice ) );

		$this->assertSame( 'paid', $result['status'] );

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		// Authorize.Net reports decimal strings in major units.
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		$payment = PaymentModel::query()->where( 'transaction_id', '60000001' )->first();
		$this->assertNotNull( $payment );
		$this->assertSame( PaymentMode::AUTHORIZE_NET, (string) $payment->payment_mode );
		$this->assertSame( 100.0, (float) $payment->amount );
	}

	/**
	 * A declined transaction must leave the invoice open.
	 */
	public function test_confirm_ignores_a_declined_transaction(): void {
		$invoice = $this->make_invoice();

		$this->queue_authnet(
			array(
				$this->list_body(
					array(
						array(
							'transId'           => '60000002',
							'invoiceNumber'     => (string) $invoice->invoice_number,
							'transactionStatus' => 'declined',
						),
					)
				),
				$this->details_body( 'declined', '100.00', (int) $invoice->id, (string) $invoice->invoice_number ),
			)
		);

		$result = $this->gateway()->confirm( new InvoicePayableSubject( $invoice ) );

		$this->assertSame( 'pending', $result['status'] );

		$invoice->refresh();
		$this->assertNotSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 0, PaymentModel::query()->where( 'invoice_id', (int) $invoice->id )->count() );
	}

	public function test_webhook_authcapture_records_the_payment(): void {
		$invoice = $this->make_invoice();

		$this->queue_authnet(
			array(
				$this->details_body(
					'capturedPendingSettlement',
					'100.00',
					(int) $invoice->id,
					(string) $invoice->invoice_number
				),
			)
		);

		AuthorizeNetInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'eventType' => 'net.authorize.payment.authcapture.created',
				'payload'   => (object) array( 'id' => '60000001' ),
			)
		);

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
	}

	public function test_duplicate_webhook_delivery_records_one_payment(): void {
		$invoice = $this->make_invoice();

		$this->queue_authnet(
			array(
				$this->details_body(
					'capturedPendingSettlement',
					'100.00',
					(int) $invoice->id,
					(string) $invoice->invoice_number
				),
				$this->details_body(
					'capturedPendingSettlement',
					'100.00',
					(int) $invoice->id,
					(string) $invoice->invoice_number
				),
			)
		);

		$event = (object) array(
			'eventType' => 'net.authorize.payment.authcapture.created',
			'payload'   => (object) array( 'id' => '60000001' ),
		);

		$handler = AuthorizeNetInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event( $event );
		$handler->handle_webhook_event( $event );

		$this->assertSame(
			1,
			PaymentModel::query()->where( 'transaction_id', '60000001' )->count()
		);
	}

	public function test_refund_webhook_reverses_the_payment(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::AUTHORIZE_NET,
				'transaction_id' => '60000001',
				'amount'         => 100.0,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		$this->queue_authnet(
			array(
				array_merge(
					array(
						'transaction' => array(
							'transId'           => '70000001',
							'transactionStatus' => 'refundPendingSettlement',
							'settleAmount'      => '100.00',
							'refTransId'        => '60000001',
						),
					),
					$this->ok()
				),
			)
		);

		AuthorizeNetInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'eventType' => 'net.authorize.payment.refund.created',
				'payload'   => (object) array( 'id' => '70000001' ),
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', '60000001' )->first() );
	}

	public function test_partial_refund_leaves_the_remainder(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::AUTHORIZE_NET,
				'transaction_id' => '60000002',
				'amount'         => 100.0,
				'currency'       => 'usd',
			)
		);

		$this->queue_authnet(
			array(
				array_merge(
					array(
						'transaction' => array(
							'transId'           => '70000002',
							'transactionStatus' => 'refundPendingSettlement',
							'settleAmount'      => '35.00',
							'refTransId'        => '60000002',
						),
					),
					$this->ok()
				),
			)
		);

		AuthorizeNetInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'eventType' => 'net.authorize.payment.refund.created',
				'payload'   => (object) array( 'id' => '70000002' ),
			)
		);

		$invoice->refresh();
		$this->assertSame( 65.0, (float) $invoice->amount_paid );
	}

	/**
	 * A void always reverses the whole charge, whatever amount it reports.
	 */
	public function test_void_webhook_reverses_the_whole_charge(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::AUTHORIZE_NET,
				'transaction_id' => '60000003',
				'amount'         => 100.0,
				'currency'       => 'usd',
			)
		);

		$this->queue_authnet(
			array(
				array_merge(
					array(
						'transaction' => array(
							'transId'           => '70000003',
							'transactionStatus' => 'voided',
							'settleAmount'      => '0.00',
							'refTransId'        => '60000003',
						),
					),
					$this->ok()
				),
			)
		);

		AuthorizeNetInvoiceWebhookHandler::instance()->handle_webhook_event(
			(object) array(
				'eventType' => 'net.authorize.payment.void.created',
				'payload'   => (object) array( 'id' => '70000003' ),
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
	}

	public function test_overpayment_is_refused(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::AUTHORIZE_NET,
				'transaction_id' => '60000009',
				'amount'         => 5000.0,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( PaymentModel::query()->where( 'transaction_id', '60000009' )->first() );
	}
}
