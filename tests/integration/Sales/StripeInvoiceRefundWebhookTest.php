<?php
/**
 * Stripe invoice refund webhook sync (requires doublescale-pro).
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Constants\PaymentMode;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Models\PaymentModel;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\StripeInvoiceWebhookHandler;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class StripeInvoiceRefundWebhookTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();

		if ( ! class_exists( StripeInvoiceWebhookHandler::class ) ) {
			$this->markTestSkipped( 'Requires doublescale-pro with Stripe invoice gateway.' );
		}

		$this->ensure_sales_module();
	}

	public function test_full_refund_webhook_resyncs_invoice_to_unpaid(): void {
		$pi_id   = 'pi_test_refund_full';
		$invoice = $this->make_paid_stripe_invoice( $pi_id, 100.0 );

		$handler = StripeInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event( $this->refund_event( $pi_id, 10000, 10000 ), (int) $invoice->id );

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::UNPAID, (string) $invoice->status );
		$this->assertSame( 0.0, (float) $invoice->amount_paid );
		$this->assertNull( $invoice->stripe_payment_intent_id );
		$this->assertNull( $invoice->external_payment_ref );
		$this->assertSame(
			0,
			PaymentModel::query()->where( 'invoice_id', (int) $invoice->id )->count()
		);
	}

	public function test_partial_refund_webhook_reduces_payment_amount(): void {
		$pi_id   = 'pi_test_refund_partial';
		$invoice = $this->make_paid_stripe_invoice( $pi_id, 100.0 );

		$handler = StripeInvoiceWebhookHandler::instance();
		$handler->handle_webhook_event( $this->refund_event( $pi_id, 10000, 4000 ), (int) $invoice->id );

		$invoice->refresh();
		$this->assertSame( InvoiceStatus::PARTIALLY_PAID, (string) $invoice->status );
		$this->assertSame( 60.0, (float) $invoice->amount_paid );

		$payment = PaymentModel::query()->where( 'transaction_id', $pi_id )->first();
		$this->assertNotNull( $payment );
		$this->assertSame( 60.0, (float) $payment->amount );
	}

	/**
	 * @param string $pi_id Payment intent id.
	 * @param float  $amount Major units.
	 * @return InvoiceModel
	 */
	private function make_paid_stripe_invoice( string $pi_id, float $amount ): InvoiceModel {
		$invoice = $this->make_invoice(
			array(
				'status'                   => InvoiceStatus::PAID,
				'amount_paid'              => $amount,
				'external_payment_ref'     => $pi_id,
				'stripe_payment_intent_id' => $pi_id,
			)
		);

		$payment = new PaymentModel();
		$payment->fill(
			array(
				'invoice_id'     => (int) $invoice->id,
				'amount'         => $amount,
				'payment_mode'   => PaymentMode::STRIPE,
				'payment_date'   => current_time( 'Y-m-d' ),
				'transaction_id' => $pi_id,
			)
		);
		$payment->save();

		return $invoice->fresh();
	}

	/**
	 * @param string $pi_id           Payment intent id.
	 * @param int    $amount_minor    Charge amount in minor units.
	 * @param int    $refunded_minor  Refunded amount in minor units.
	 * @return object
	 */
	private function refund_event( string $pi_id, int $amount_minor, int $refunded_minor ) {
		return (object) array(
			'type' => 'charge.refunded',
			'data' => (object) array(
				'object' => (object) array(
					'object'          => 'charge',
					'id'              => 'ch_test_' . substr( md5( $pi_id ), 0, 8 ),
					'payment_intent'  => $pi_id,
					'amount'          => $amount_minor,
					'amount_refunded' => $refunded_minor,
					'currency'        => 'usd',
				),
			),
		);
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
