<?php
/**
 * Sales settings payment gateway resolution.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Managers\InvoiceOnlineGatewaysManager;
use DoubleScale\Modules\Sales\PaymentGateway\InvoiceOnlineGateway;
use DoubleScale\Modules\Sales\Services\SalesSettings;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class SalesSettingsPaymentGatewaysTest extends TestCase {

	/** @var InvoiceOnlineGateway */
	private $test_gateway;

	protected function setUp(): void {
		parent::setUp();
		delete_option( 'doublescale_sales_settings' );
		$this->test_gateway = new class() extends InvoiceOnlineGateway {
			public $slug = 'stripe';
			public $name = 'Stripe';
			public $description = 'Test';

			public function is_available(): bool {
				return true;
			}

			public function is_configured(): bool {
				return true;
			}

			public function init_payment( $invoice ) {
				return array();
			}

			public function confirm_payment( $invoice ) {
				return array();
			}
		};
		InvoiceOnlineGatewaysManager::instance()->register( $this->test_gateway );
	}

	protected function tearDown(): void {
		delete_option( 'doublescale_sales_settings' );
		parent::tearDown();
	}

	public function test_resolved_enabled_gateways_default_to_all_registered(): void {
		$this->assertSame( array( 'stripe' ), SalesSettings::get_resolved_enabled_online_gateways() );
		$this->assertTrue( InvoiceOnlineGatewaysManager::instance()->is_enabled_for_sales( 'stripe' ) );
	}

	public function test_explicit_enabled_gateway_list_is_respected(): void {
		SalesSettings::update(
			array(
				'enabled_online_gateways' => array(),
			)
		);

		$this->assertSame( array(), SalesSettings::get_resolved_enabled_online_gateways() );
		$this->assertFalse( InvoiceOnlineGatewaysManager::instance()->is_enabled_for_sales( 'stripe' ) );
	}
}
