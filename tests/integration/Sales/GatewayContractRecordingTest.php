<?php
/**
 * Phase 0: record_payment() driven by the Gateway contract.
 *
 * Covers the generalization that replaced hardcoded paypal/woocommerce checks
 * with `uses_major_units()` and `payment_note()`, including the fallback used
 * when no gateway is registered for a mode — the path Stripe, PayPal and
 * WooCommerce still rely on.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Core\Payment\Gateway;
use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Constants\PaymentMode;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\PaymentModel;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\InvoicePayableSubject;
use DoubleScale\Pro\Modules\Sales\PaymentGateways\Loader;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class GatewayContractRecordingTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();

		if ( ! $this->ensure_pro_loaded() ) {
			$this->markTestSkipped( 'Requires doublescale-pro.' );
		}

		$this->ensure_sales_module();
		Loader::register();
	}

	/**
	 * Stripe is the only minor-unit gateway; 10000 must land as 100.00.
	 */
	public function test_stripe_amounts_are_read_as_minor_units(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::STRIPE,
				'transaction_id' => 'pi_minor',
				'amount'         => 10000,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
		$this->assertSame( InvoiceStatus::PAID, (string) $invoice->status );
	}

	/**
	 * PayPal reports major units; 100.0 must stay 100.00, not become 1.00.
	 */
	public function test_paypal_amounts_are_read_as_major_units(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::PAYPAL,
				'transaction_id' => 'cap_major',
				'amount'         => 100.0,
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
	}

	/**
	 * The note now comes from the gateway rather than an if/elseif chain, but
	 * the stored text must be unchanged for each existing gateway.
	 */
	public function test_existing_gateway_notes_are_unchanged(): void {
		$cases = array(
			PaymentMode::STRIPE      => 'Stripe payment for invoice ',
			PaymentMode::PAYPAL      => 'PayPal payment for invoice ',
			PaymentMode::WOOCOMMERCE => 'WooCommerce payment for invoice ',
		);

		foreach ( $cases as $mode => $expected_prefix ) {
			$invoice = $this->make_invoice();
			$amount  = PaymentMode::STRIPE === $mode ? 10000 : 100.0;

			( new InvoicePayableSubject( $invoice ) )->record_payment(
				(object) array(
					'payment_mode'   => $mode,
					'transaction_id' => 'txn_note_' . $mode,
					'amount'         => $amount,
					'currency'       => 'usd',
				)
			);

			$payment = PaymentModel::query()->where( 'transaction_id', 'txn_note_' . $mode )->first();
			$this->assertNotNull( $payment, "No payment recorded for {$mode}" );
			$this->assertStringStartsWith(
				$expected_prefix . $invoice->invoice_number,
				(string) $payment->note,
				"Note text changed for {$mode}"
			);
		}
	}

	/**
	 * An unregistered mode must fall back to the pre-Phase-0 behaviour rather
	 * than mis-reading the amount.
	 */
	public function test_unregistered_mode_falls_back_to_legacy_unit_handling(): void {
		$invoice = $this->make_invoice();

		// bank_transfer has no Gateway implementation, so no contract to ask.
		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::BANK_TRANSFER,
				'transaction_id' => 'manual_1',
				'amount'         => 10000, // treated as minor units by the fallback
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );
	}

	/**
	 * A charge with no payment_mode defaults to Stripe — the Stripe webhook
	 * path depends on this.
	 */
	public function test_charge_without_payment_mode_defaults_to_stripe(): void {
		$invoice = $this->make_invoice();

		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'id'       => 'pi_default',
				'amount'   => 10000,
				'currency' => 'usd',
			)
		);

		$payment = PaymentModel::query()->where( 'transaction_id', 'pi_default' )->first();
		$this->assertNotNull( $payment );
		$this->assertSame( PaymentMode::STRIPE, (string) $payment->payment_mode );
		$this->assertSame( 100.0, (float) $payment->amount );
	}

	/**
	 * The security-relevant guard: no gateway may record more than is owed,
	 * whichever unit convention it uses.
	 */
	public function test_overpayment_guard_holds_for_both_unit_conventions(): void {
		$minor = $this->make_invoice();
		( new InvoicePayableSubject( $minor ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::STRIPE,
				'transaction_id' => 'pi_over',
				'amount'         => 500000,
				'currency'       => 'usd',
			)
		);
		$minor->refresh();
		$this->assertSame( 0.0, (float) $minor->amount_paid );

		$major = $this->make_invoice();
		( new InvoicePayableSubject( $major ) )->record_payment(
			(object) array(
				'payment_mode'   => PaymentMode::PAYPAL,
				'transaction_id' => 'cap_over',
				'amount'         => 5000.0,
				'currency'       => 'usd',
			)
		);
		$major->refresh();
		$this->assertSame( 0.0, (float) $major->amount_paid );
	}

	/**
	 * A gateway registered at runtime must drive both the unit convention and
	 * the note — this is what makes a new gateway need no core edits.
	 */
	public function test_a_runtime_registered_gateway_drives_units_and_note(): void {
		$gateway = new class() extends Gateway {
			public $slug = 'acme_pay';
			public $name = 'Acme Pay';
			public $description = 'Test';

			protected function register(): void {}

			public function is_available(): bool {
				return true;
			}

			public function is_configured(): bool {
				return true;
			}

			public function init( $subject ) {
				return array();
			}

			public function confirm( $subject ) {
				return array();
			}

			public function record_paid( $subject, $charge ): void {
				unset( $subject, $charge );
			}

			public function uses_major_units(): bool {
				return false;
			}
		};

		GatewayManager::instance()->register( GatewayManager::CONTEXT_INVOICE, $gateway );

		$invoice = $this->make_invoice();
		( new InvoicePayableSubject( $invoice ) )->record_payment(
			(object) array(
				'payment_mode'   => 'acme_pay',
				'transaction_id' => 'acme_1',
				'amount'         => 10000, // minor units, per the contract above
				'currency'       => 'usd',
			)
		);

		$invoice->refresh();
		$this->assertSame( 100.0, (float) $invoice->amount_paid );

		$payment = PaymentModel::query()->where( 'transaction_id', 'acme_1' )->first();
		$this->assertNotNull( $payment );
		$this->assertStringStartsWith( 'Acme Pay payment for invoice', (string) $payment->note );
	}

	/**
	 * @return bool
	 */
	private function ensure_pro_loaded(): bool {
		if ( class_exists( InvoicePayableSubject::class ) ) {
			return true;
		}

		$pro_main = dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/doublescale-pro.php';
		if ( is_readable( $pro_main ) ) {
			require_once $pro_main;
		}

		return class_exists( InvoicePayableSubject::class );
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
