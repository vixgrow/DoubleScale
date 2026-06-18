<?php
/**
 * Online invoice payment REST routes.
 *
 * @package DoubleScale\Tests\Modules\Documents
 */

namespace DoubleScale\Tests\Modules\Documents;

use DoubleScale\Modules\Documents\Rest\Controllers\RestInvoiceOnlinePaymentController;
use DoubleScale\Modules\Documents\Rest\Controllers\RestPublicInvoiceController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestUtil.php';

/**
 * @group smoke
 */
final class RestInvoiceOnlinePaymentRoutesTest extends TestCase {

	public function test_admin_registers_gateway_and_legacy_stripe_routes(): void {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( RestInvoiceOnlinePaymentController::class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		$routes = array_map(
			static fn( array $ep ): string => (string) $ep['route'],
			doublescale_rest_collect_flat_endpoints()
		);

		$this->assertContains( '/sales/payment-gateways', $routes );
		$this->assertContains( '/sales/invoices/(?P<invoice_id>[\d]+)/pay/(?P<gateway>[a-z0-9_\-]+)/init', $routes );
		$this->assertContains( '/sales/invoices/(?P<invoice_id>[\d]+)/stripe/init', $routes );
	}

	public function test_public_registers_gateway_and_legacy_stripe_routes(): void {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( RestPublicInvoiceController::class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		$routes = array_map(
			static fn( array $ep ): string => (string) $ep['route'],
			doublescale_rest_collect_flat_endpoints()
		);

		$base = '/sales/public/invoices/(?P<hash>[a-f0-9]{32})';
		$this->assertContains( $base . '/pay/(?P<gateway>[a-z0-9_\-]+)/init', $routes );
		$this->assertContains( $base . '/stripe/init', $routes );
	}
}
