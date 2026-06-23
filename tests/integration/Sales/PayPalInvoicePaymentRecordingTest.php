<?php
/**
 * InvoicePayableSubject PayPal + Stripe recording (requires doublescale-pro + DB).
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Constants\PaymentMode;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\PaymentModel;
use DoubleScale\Pro\Modules\Integrations\Stripe\Utils as StripeUtils;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\InvoicePayableSubject;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\Loader;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\PayPalInvoiceWebhookHandler;
use DoubleScale\Pro\Modules\Pro\Payment\PayPalGateway;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class PayPalInvoicePaymentRecordingTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();

		if ( ! $this->ensure_pro_loaded() ) {
			$this->markTestSkipped( 'Requires doublescale-pro with PayPal gateway.' );
		}

		$this->ensure_sales_module();
		Loader::register();
	}

	public function test_paypal_record_payment_uses_capture_id_and_does_not_touch_stripe_column(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::UNPAID ) );
		$subject = new InvoicePayableSubject( $invoice );

		$subject->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::PAYPAL,
				'transaction_id' => 'CAPTURE_ABC123',
				'id'             => 'CAPTURE_ABC123',
				'amount'         => 100.0,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
		$this->assertSame( 'CAPTURE_ABC123', (string) $invoice->external_payment_ref );
		$this->assertNull( $invoice->stripe_payment_intent_id );

		$payment = PaymentModel::query()->where( 'transaction_id', 'CAPTURE_ABC123' )->first();
		$this->assertNotNull( $payment );
		$this->assertSame( PaymentMode::PAYPAL, (string) $payment->payment_mode );
		$this->assertSame( 100.0, (float) $payment->amount );
	}

	public function test_paypal_duplicate_capture_id_is_idempotent(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::UNPAID ) );
		$subject = new InvoicePayableSubject( $invoice );

		$charge = (object) array(
			'payment_mode'   => PaymentMode::PAYPAL,
			'transaction_id' => 'CAPTURE_DUP_1',
			'id'             => 'CAPTURE_DUP_1',
			'amount'         => 100.0,
			'currency'       => 'usd',
		);

		$subject->record_payment( $charge );
		$subject->record_payment( $charge );

		$this->assertSame(
			1,
			PaymentModel::query()->where( 'transaction_id', 'CAPTURE_DUP_1' )->count()
		);
	}

	public function test_stripe_record_payment_still_uses_minor_units_and_stripe_column(): void {
		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::UNPAID ) );
		$subject = new InvoicePayableSubject( $invoice );

		$subject->record_payment(
			(object) array(
				'id'       => 'pi_test_stripe_regression',
				'amount'   => StripeUtils::to_stripe_amount( 75.5, 'usd' ),
				'currency' => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 'pi_test_stripe_regression', (string) $invoice->stripe_payment_intent_id );
		$this->assertSame( PaymentMode::STRIPE, (string) PaymentModel::query()->where( 'transaction_id', 'pi_test_stripe_regression' )->value( 'payment_mode' ) );
		$this->assertSame( 75.5, (float) $invoice->amount_paid );
	}

	public function test_paypal_webhook_and_gateway_record_same_capture_once(): void {
		$invoice = $this->make_invoice(
			array(
				'status'               => InvoiceStatus::UNPAID,
				'external_payment_ref' => 'ORDER_WEBHOOK',
			)
		);

		$capture = (object) array(
			'id'        => 'CAPTURE_WEBHOOK_RACE',
			'custom_id' => 'invoice_' . (int) $invoice->id,
			'amount'    => (object) array(
				'currency_code' => 'USD',
				'value'         => '100.00',
			),
		);

		$gateway = GatewayManager::instance()->get( GatewayManager::CONTEXT_INVOICE, 'paypal' );
		$this->assertInstanceOf( PayPalGateway::class, $gateway );

		$subject = new InvoicePayableSubject( $invoice->fresh() );
		$gateway->record_paid( $subject, $capture );

		$handler = PayPalInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event(
			(object) array(
				'event_type' => 'PAYMENT.CAPTURE.COMPLETED',
				'resource'   => $capture,
			),
			(int) $invoice->id
		);

		$this->assertSame(
			1,
			PaymentModel::query()->where( 'transaction_id', 'CAPTURE_WEBHOOK_RACE' )->count()
		);
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
