<?php
/**
 * PayPal invoice webhook handler integration tests (requires doublescale-pro + DB).
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Constants\PaymentMode;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\PaymentModel;
use DoubleScale\Pro\Modules\Pro\Payment\PayPalGateway;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\Loader;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\PayPalInvoiceWebhookHandler;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group paypal
 */
final class PayPalInvoiceWebhookHandlerTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();

		if ( ! $this->ensure_pro_loaded() ) {
			$this->markTestSkipped( 'Requires doublescale-pro with PayPal gateway.' );
		}

		$this->ensure_sales_module();
		Loader::register();
	}

	public function test_full_refund_webhook_resyncs_invoice_to_unpaid(): void {
		$capture_id = 'CAPTURE_PP_REFUND_FULL';
		$invoice    = $this->make_paid_paypal_invoice( $capture_id, 100.0 );

		$handler = PayPalInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event(
			$this->refund_event( $capture_id, 100.0 ),
			(int) $invoice->id
		);

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::UNPAID, (string) $invoice->status );
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( $invoice->external_payment_ref );
		$this->assertSame(
			0,
			PaymentModel::query()->where( 'invoice_id', (int) $invoice->id )->count()
		);
	}

	public function test_partial_refund_webhook_reduces_payment_amount(): void {
		$capture_id = 'CAPTURE_PP_REFUND_PARTIAL';
		$invoice    = $this->make_paid_paypal_invoice( $capture_id, 100.0 );

		$handler = PayPalInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event(
			$this->refund_event( $capture_id, 40.0 ),
			(int) $invoice->id
		);

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PARTIALLY_PAID, (string) $invoice->status );
		$this->assertSame( 60.0, (float) $invoice->amount_paid );

		$payment = PaymentModel::query()->where( 'transaction_id', $capture_id )->first();
		$this->assertNotNull( $payment );
		$this->assertSame( 60.0, (float) $payment->amount );
	}

	public function test_dispute_created_adds_note_to_payment(): void {
		$capture_id = 'CAPTURE_PP_DISPUTE';
		$invoice    = $this->make_paid_paypal_invoice( $capture_id, 50.0 );

		$handler = PayPalInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event(
			(object) array(
				'event_type' => 'CUSTOMER.DISPUTE.CREATED',
				'resource'   => (object) array(
					'id'                   => 'PP-DISPUTE-1',
					'reason'               => 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
					'disputed_transactions' => array(
						(object) array(
							'seller_transaction_id' => $capture_id,
						),
					),
				),
			),
			(int) $invoice->id
		);

		$payment = PaymentModel::query()->where( 'transaction_id', $capture_id )->first();
		$this->assertNotNull( $payment );
		$this->assertStringContainsString( 'PP-DISPUTE-1', (string) $payment->note );
		$this->assertStringContainsString( 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED', (string) $payment->note );
	}

	public function test_checkout_declined_clears_in_progress_order_ref(): void {
		$order_id = 'ORDER_DECLINED_1';
		$invoice  = $this->make_invoice(
			array(
				'status'               => InvoiceStatus::UNPAID,
				'external_payment_ref' => $order_id,
			)
		);

		$handler = PayPalInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event(
			(object) array(
				'event_type' => 'CHECKOUT.ORDER.DECLINED',
				'resource'   => (object) array(
					'id'             => $order_id,
					'intent'         => 'CAPTURE',
					'purchase_units' => array(
						(object) array(
							'custom_id' => 'invoice_' . (int) $invoice->id,
						),
					),
				),
			),
			(int) $invoice->id
		);

		$invoice->refresh();
		$this->assertNull( $invoice->external_payment_ref );
	}

	public function test_checkout_declined_does_not_clear_ref_when_invoice_already_paid(): void {
		$order_id = 'ORDER_DECLINED_PAID';
		$invoice  = $this->make_paid_paypal_invoice( 'CAPTURE_PAID_KEEP', 80.0, $order_id );

		$handler = PayPalInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event(
			(object) array(
				'event_type' => 'CHECKOUT.ORDER.DECLINED',
				'resource'   => (object) array(
					'id'             => $order_id,
					'intent'         => 'CAPTURE',
					'purchase_units' => array(
						(object) array(
							'custom_id' => 'invoice_' . (int) $invoice->id,
						),
					),
				),
			),
			(int) $invoice->id
		);

		$invoice->refresh();
		$this->assertSame( $order_id, (string) $invoice->external_payment_ref );
	}

	/**
	 * @param string $capture_id Capture id.
	 * @param float  $refund     Refund amount in major units.
	 * @return object
	 */
	private function refund_event( string $capture_id, float $refund ) {
		return (object) array(
			'event_type' => 'PAYMENT.CAPTURE.REFUNDED',
			'resource'   => (object) array(
				'id'     => 'REFUND_' . $capture_id,
				'status' => 'COMPLETED',
				'amount' => (object) array(
					'currency_code' => 'USD',
					'value'         => number_format( $refund, 2, '.', '' ),
				),
				'supplementary_data' => (object) array(
					'related_ids' => (object) array(
						'capture_id' => $capture_id,
					),
				),
			),
		);
	}

	/**
	 * @param string      $capture_id Capture id.
	 * @param float       $amount     Major units.
	 * @param string|null $order_ref  Optional in-progress order ref.
	 * @return InvoiceModel
	 */
	private function make_paid_paypal_invoice( string $capture_id, float $amount, ?string $order_ref = null ): InvoiceModel {
		$invoice = $this->make_invoice(
			array(
				'status'                   => InvoiceStatus::PAID,
				'amount_paid'              => $amount,
				'external_payment_ref'     => $order_ref ?? $capture_id,
				'stripe_payment_intent_id' => null,
			)
		);

		$payment = new PaymentModel();
		$payment->fill(
			array(
				'invoice_id'     => (int) $invoice->id,
				'amount'         => $amount,
				'payment_mode'   => PaymentMode::PAYPAL,
				'payment_date'   => current_time( 'Y-m-d' ),
				'transaction_id' => $capture_id,
			)
		);
		$payment->save();

		return $invoice->fresh();
	}

	/**
	 * @return bool
	 */
	private function ensure_pro_loaded(): bool {
		if ( class_exists( PayPalGateway::class ) ) {
			return true;
		}

		$pro_main = dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/doublescale-pro.php';
		if ( is_readable( $pro_main ) ) {
			require_once $pro_main;
		}

		return class_exists( PayPalGateway::class );
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
					'qty'    => 1,
					'rate'   => 100,
					'amount' => 100,
				),
			),
			'invoice_date'   => current_time( 'Y-m-d' ),
			'due_date'       => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
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
