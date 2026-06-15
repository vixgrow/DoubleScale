<?php
/**
 * Sales settings payment gateway resolution.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

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
		delete_option( 'doublescale_sales_settings' );
		parent::tearDown();
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
