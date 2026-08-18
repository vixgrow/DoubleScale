<?php
/**
 * Gateway currency mismatch guard (Pro).
 *
 * Stripe, PayPal, Mollie, Razorpay, WooCommerce, and Authorize.Net all call
 * this helper. Loading the single file avoids Pro's Composer autoload, which
 * would leak into tests that assert Pro is absent.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 2 ) . '/RestApiEndpointTestStubs.php';

final class PaymentCurrencyGuardTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();

		$path = dirname( rtrim( DOUBLESCALE_PLUGIN_DIR, '/\\' ) ) . '/doublescale-pro/includes/Modules/Pro/Payment/PaymentCurrency.php';
		if ( ! is_file( $path ) ) {
			$this->markTestSkipped( 'Requires doublescale-pro PaymentCurrency.' );
		}
		require_once $path;
	}

	public function test_matching_codes_are_allowed(): void {
		$this->assertNull(
			\DoubleScale\Pro\Modules\Pro\Payment\PaymentCurrency::guard( 'usd', 'USD', 'Stripe' )
		);
	}

	public function test_mismatch_returns_400(): void {
		$result = \DoubleScale\Pro\Modules\Pro\Payment\PaymentCurrency::guard( 'EUR', 'USD', 'Stripe' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'currency_mismatch', $result->get_error_code() );
		$this->assertSame( 400, $result->get_error_data()['status'] );
	}
}
