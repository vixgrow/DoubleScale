<?php
/**
 * Sales settings payment gateway resolution.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

require_once \DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';

use DoubleScale\Core\Payment\Gateway;
use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Sales\Services\SalesSettings;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class SalesSettingsPaymentGatewaysTest extends TestCase {

	/** @var Gateway */
	private $test_gateway;

	protected function setUp(): void {
		parent::setUp();
		delete_option( 'doublescale_sales_settings' );
		add_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_available' ) );
		$this->test_gateway = new class() extends Gateway {
			public $slug = 'stripe';
			public $name = 'Stripe';
			public $description = 'Test';

			protected function register(): void {
				GatewayManager::instance()->register( GatewayManager::CONTEXT_INVOICE, $this );
			}

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
		};
		GatewayManager::instance()->register( GatewayManager::CONTEXT_INVOICE, $this->test_gateway );
	}

	protected function tearDown(): void {
		remove_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_available' ) );
		remove_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_unavailable' ) );
		delete_option( 'doublescale_sales_settings' );
		parent::tearDown();
	}

	/**
	 * @param bool $available Default.
	 * @return bool
	 */
	public function force_online_available( $available ): bool {
		unset( $available );
		return true;
	}

	/**
	 * @param bool $available Default.
	 * @return bool
	 */
	public function force_online_unavailable( $available ): bool {
		unset( $available );
		return false;
	}

	public function test_helper_follows_pro_addon_and_filter(): void {
		remove_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_available' ) );
		add_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_unavailable' ) );

		$this->assertFalse( doublescale_sales_online_payments_available() );

		remove_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_unavailable' ) );
		add_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_available' ) );
		$this->assertTrue( doublescale_sales_online_payments_available() );
	}

	public function test_resolved_enabled_gateways_empty_when_online_payments_unavailable(): void {
		remove_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_available' ) );
		add_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_unavailable' ) );

		$this->assertSame( array(), SalesSettings::get_resolved_enabled_online_gateways() );
		$this->assertFalse( GatewayManager::instance()->is_enabled_for_sales( 'stripe' ) );
	}

	public function test_update_blanks_online_gateway_lists_when_unavailable(): void {
		remove_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_available' ) );
		add_filter( 'doublescale_sales_online_payments_available', array( $this, 'force_online_unavailable' ) );

		SalesSettings::update(
			array(
				'enabled_online_gateways'         => array( 'stripe' ),
				'default_online_payment_gateways' => array( 'stripe' ),
				'default_offline_payment_modes'   => array( 'cash' ),
			)
		);

		$all = SalesSettings::get_all();
		$this->assertSame( array(), $all['enabled_online_gateways'] );
		$this->assertSame( array(), $all['default_online_payment_gateways'] );
		$this->assertSame( array( 'cash' ), $all['default_offline_payment_modes'] );
	}

	public function test_resolved_enabled_gateways_default_to_all_registered(): void {
		$this->assertSame( array( 'stripe' ), SalesSettings::get_resolved_enabled_online_gateways() );
		$this->assertTrue( GatewayManager::instance()->is_enabled_for_sales( 'stripe' ) );
	}

	public function test_explicit_enabled_gateway_list_is_respected(): void {
		SalesSettings::update(
			array(
				'enabled_online_gateways' => array(),
			)
		);

		$this->assertSame( array(), SalesSettings::get_resolved_enabled_online_gateways() );
		$this->assertFalse( GatewayManager::instance()->is_enabled_for_sales( 'stripe' ) );
	}
}
