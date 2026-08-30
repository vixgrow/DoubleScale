<?php
/**
 * GatewayManager: which gateways a customer is actually offered, and which
 * are allowed to take a payment.
 *
 * This is the access-control layer of the payment system — a gateway that is
 * disabled, unconfigured, or excluded on the invoice must never be payable.
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
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class GatewayManagerPayabilityTest extends IntegrationTestCase {

	/**
	 * Slugs registered for this test, so PaymentMode treats them as real
	 * online gateways rather than normalising them to `other`.
	 *
	 * @var string[]
	 */
	private $known_slugs = array();

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		delete_option( 'doublescale_sales_settings' );
		add_filter( 'doublescale_sales_online_payments_available', '__return_true' );

		$this->known_slugs = array();
		add_filter(
			'doublescale_sales_online_payment_gateway_slugs',
			function ( array $slugs ): array {
				return array_merge( $slugs, $this->known_slugs );
			}
		);
	}

	protected function tearDown(): void {
		remove_all_filters( 'doublescale_sales_online_payment_gateway_slugs' );
		remove_filter( 'doublescale_sales_online_payments_available', '__return_true' );
		delete_option( 'doublescale_sales_settings' );
		parent::tearDown();
	}

	/**
	 * Register a stub gateway under a slug, with controllable readiness.
	 *
	 * @param string $slug       Gateway slug.
	 * @param bool   $available  is_available().
	 * @param bool   $configured is_configured().
	 * @return Gateway
	 */
	private function register_gateway( string $slug, bool $available = true, bool $configured = true ): Gateway {
		$gateway = new class() extends Gateway {
			public $slug = '';
			public $name = 'Stub';
			public $description = 'Stub gateway';

			/** @var bool */
			public $available = true;

			/** @var bool */
			public $configured = true;

			protected function register(): void {}

			public function is_available(): bool {
				return $this->available;
			}

			public function is_configured(): bool {
				return $this->configured;
			}

			public function init( $subject ) {
				return array( 'gateway' => $this->slug );
			}

			public function confirm( $subject ) {
				return array( 'gateway' => $this->slug );
			}

			public function record_paid( $subject, $charge ): void {
				unset( $subject, $charge );
			}
		};

		$gateway->slug       = $slug;
		$gateway->name       = ucfirst( $slug );
		$gateway->available  = $available;
		$gateway->configured = $configured;

		// PaymentMode normalises unknown slugs to `other`, which would make the
		// enabled-list intersection drop them.
		$this->known_slugs[] = $slug;

		GatewayManager::instance()->register( GatewayManager::CONTEXT_INVOICE, $gateway );

		return $gateway;
	}

	/**
	 * @param string $slug Gateway slug.
	 * @return array<string, mixed>|null
	 */
	private function status_row( string $slug ): ?array {
		foreach ( GatewayManager::instance()->shape_status_list() as $row ) {
			if ( $slug === $row['slug'] ) {
				return $row;
			}
		}
		return null;
	}

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @param string       $slug    Gateway slug.
	 * @return array<string, mixed>|null
	 */
	private function invoice_row( InvoiceModel $invoice, string $slug ): ?array {
		foreach ( GatewayManager::instance()->shape_for_invoice( $invoice ) as $row ) {
			if ( $slug === $row['slug'] ) {
				return $row;
			}
		}
		return null;
	}

	/**
	 * @param string[] $slugs Enabled gateway slugs.
	 * @return void
	 */
	private function enable_only( array $slugs ): void {
		update_option(
			'doublescale_sales_settings',
			array( 'enabled_online_gateways' => $slugs )
		);
	}

	// -------------------------------------------------------------------
	// Enablement
	// -------------------------------------------------------------------

	public function test_a_disabled_gateway_is_not_payable(): void {
		$this->register_gateway( 'gm_disabled' );
		$this->enable_only( array( 'stripe' ) );

		$invoice = $this->make_invoice();

		$this->assertFalse( GatewayManager::instance()->is_enabled_for_sales( 'gm_disabled' ) );
		$this->assertNotContains(
			'gm_disabled',
			$this->payable_slugs( $invoice ),
			'A gateway disabled in Sales settings must not be offered.'
		);
	}

	/**
	 * A disabled gateway must be refused at init, not merely hidden — the
	 * route is reachable directly.
	 */
	public function test_init_refuses_a_disabled_gateway(): void {
		$this->register_gateway( 'gm_refuse' );
		$this->enable_only( array( 'stripe' ) );

		$result = GatewayManager::instance()->init(
			GatewayManager::CONTEXT_INVOICE,
			'gm_refuse',
			$this->make_subject()
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'gateway_disabled', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	public function test_an_enabled_gateway_is_payable(): void {
		$this->register_gateway( 'gm_enabled' );
		$this->enable_only( array( 'gm_enabled' ) );

		$invoice = $this->make_invoice();

		$this->assertTrue( GatewayManager::instance()->is_enabled_for_sales( 'gm_enabled' ) );
		$this->assertContains( 'gm_enabled', $this->payable_slugs( $invoice ) );
	}

	public function test_invoice_online_payments_require_pro(): void {
		remove_filter( 'doublescale_sales_online_payments_available', '__return_true' );
		add_filter( 'doublescale_sales_online_payments_available', '__return_false' );

		$this->register_gateway( 'gm_pro_locked' );
		$this->enable_only( array( 'gm_pro_locked' ) );

		$invoice = $this->make_invoice();

		$this->assertSame( array(), $this->payable_slugs( $invoice ) );

		$result = GatewayManager::instance()->init(
			GatewayManager::CONTEXT_INVOICE,
			'gm_pro_locked',
			$this->make_subject()
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'online_payments_pro', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	// -------------------------------------------------------------------
	// Readiness
	// -------------------------------------------------------------------

	public function test_an_unconfigured_gateway_is_not_payable(): void {
		$this->register_gateway( 'gm_unconfigured', true, false );
		$this->enable_only( array( 'gm_unconfigured' ) );

		$invoice = $this->make_invoice();

		$this->assertNotContains( 'gm_unconfigured', $this->payable_slugs( $invoice ) );

		$row = $this->status_row( 'gm_unconfigured' );
		$this->assertNotNull( $row );
		$this->assertFalse( $row['ready'], 'An unconfigured gateway must not be reported ready.' );
	}

	public function test_an_unavailable_gateway_is_not_payable(): void {
		$this->register_gateway( 'gm_unavailable', false, true );
		$this->enable_only( array( 'gm_unavailable' ) );

		$invoice = $this->make_invoice();

		$this->assertNotContains( 'gm_unavailable', $this->payable_slugs( $invoice ) );
		$this->assertFalse( $this->status_row( 'gm_unavailable' )['ready'] );
	}

	public function test_init_refuses_an_unconfigured_gateway(): void {
		$this->register_gateway( 'gm_notcfg', true, false );
		$this->enable_only( array( 'gm_notcfg' ) );

		$result = GatewayManager::instance()->init(
			GatewayManager::CONTEXT_INVOICE,
			'gm_notcfg',
			$this->make_subject()
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'gateway_not_configured', $result->get_error_code() );
	}

	public function test_init_refuses_an_unknown_gateway(): void {
		$result = GatewayManager::instance()->init(
			GatewayManager::CONTEXT_INVOICE,
			'gm_does_not_exist',
			$this->make_subject()
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'gateway_not_found', $result->get_error_code() );
	}

	// -------------------------------------------------------------------
	// Per-invoice restrictions
	// -------------------------------------------------------------------

	/**
	 * An invoice may restrict which online gateways it accepts; anything else
	 * must not be offered even when enabled globally.
	 */
	public function test_an_invoice_restricts_gateways_to_its_allowed_list(): void {
		$this->register_gateway( 'gm_allowed' );
		$this->register_gateway( 'gm_blocked' );
		$this->enable_only( array( 'gm_allowed', 'gm_blocked' ) );

		$invoice = $this->make_invoice(
			array( 'allowed_payment_modes' => array( 'gm_allowed' ) )
		);

		$slugs = $this->payable_slugs( $invoice );
		$this->assertContains( 'gm_allowed', $slugs );
		$this->assertNotContains( 'gm_blocked', $slugs );
	}

	/**
	 * An offline-only list is a staff recording preference, not a restriction
	 * on which online gateways the customer sees.
	 */
	public function test_an_offline_only_list_does_not_restrict_online_gateways(): void {
		$this->register_gateway( 'gm_online' );
		$this->enable_only( array( 'gm_online' ) );

		$invoice = $this->make_invoice(
			array( 'allowed_payment_modes' => array( PaymentMode::BANK_TRANSFER, PaymentMode::CASH ) )
		);

		$this->assertContains( 'gm_online', $this->payable_slugs( $invoice ) );
	}

	// -------------------------------------------------------------------
	// Invoice state
	// -------------------------------------------------------------------

	public function test_a_draft_invoice_cannot_be_paid(): void {
		$this->register_gateway( 'gm_draft' );
		$this->enable_only( array( 'gm_draft' ) );

		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::DRAFT ) );

		$row = $this->invoice_row( $invoice, 'gm_draft' );
		$this->assertNotNull( $row );
		$this->assertFalse( $row['can_pay'], 'A draft invoice must not be payable.' );

		$result = GatewayManager::instance()->init_payment( 'gm_draft', $invoice );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_status', $result->get_error_code() );
	}

	public function test_a_paid_invoice_cannot_be_paid_again(): void {
		$this->register_gateway( 'gm_paid' );
		$this->enable_only( array( 'gm_paid' ) );

		$invoice = $this->make_invoice(
			array(
				'status'      => InvoiceStatus::PAID,
				'amount_paid' => 100.0,
			)
		);

		$this->assertFalse( $this->invoice_row( $invoice, 'gm_paid' )['can_pay'] );

		$result = GatewayManager::instance()->init_payment( 'gm_paid', $invoice );
		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_status', $result->get_error_code() );
	}

	/**
	 * A fully-settled invoice that is still marked unpaid must also be
	 * refused — the balance is what matters, not the label.
	 */
	public function test_an_invoice_with_no_balance_cannot_be_paid(): void {
		$this->register_gateway( 'gm_nobalance' );
		$this->enable_only( array( 'gm_nobalance' ) );

		$invoice = $this->make_invoice(
			array(
				'status'      => InvoiceStatus::UNPAID,
				'amount_paid' => 100.0,
			)
		);

		$result = GatewayManager::instance()->init_payment( 'gm_nobalance', $invoice );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_data', $result->get_error_code() );
	}

	/**
	 * Requesting a gateway the invoice excludes must be refused at init, not
	 * only hidden from the list.
	 */
	public function test_init_payment_refuses_a_gateway_the_invoice_excludes(): void {
		$this->register_gateway( 'gm_ok' );
		$this->register_gateway( 'gm_not_allowed' );
		$this->enable_only( array( 'gm_ok', 'gm_not_allowed' ) );

		$invoice = $this->make_invoice(
			array( 'allowed_payment_modes' => array( 'gm_ok' ) )
		);

		$result = GatewayManager::instance()->init_payment( 'gm_not_allowed', $invoice );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_data', $result->get_error_code() );
	}

	// -------------------------------------------------------------------
	// Context isolation
	// -------------------------------------------------------------------

	/**
	 * An invoice gateway must not be reachable through the booking context.
	 */
	public function test_contexts_are_isolated(): void {
		$this->register_gateway( 'gm_invoice_only' );

		$this->assertNotNull(
			GatewayManager::instance()->get( GatewayManager::CONTEXT_INVOICE, 'gm_invoice_only' )
		);
		$this->assertNull(
			GatewayManager::instance()->get( GatewayManager::CONTEXT_BOOKING, 'gm_invoice_only' )
		);
	}

	// -------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @return string[]
	 */
	private function payable_slugs( InvoiceModel $invoice ): array {
		return array_map(
			static function ( $gateway ): string {
				return (string) $gateway->slug;
			},
			GatewayManager::instance()->get_payable_for_invoice( $invoice )
		);
	}

	/**
	 * A minimal PayableSubject for the init() guard tests, which bail before
	 * the subject is ever used.
	 *
	 * @return \DoubleScale\Core\Payment\PayableSubject
	 */
	private function make_subject() {
		return new class() implements \DoubleScale\Core\Payment\PayableSubject {
			public function context(): string {
				return 'invoice';
			}

			public function entity_id(): int {
				return 1;
			}

			public function amount_due(): float {
				return 100.0;
			}

			public function currency(): string {
				return 'USD';
			}

			public function customer_name(): ?string {
				return null;
			}

			public function customer_email(): ?string {
				return null;
			}

			public function external_payment_ref(): ?string {
				return null;
			}

			public function set_external_payment_ref( string $id ): void {
				unset( $id );
			}

			public function metadata(): array {
				return array( 'source' => 'invoice' );
			}

			public function record_payment( object $charge ): void {
				unset( $charge );
			}
		};
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
