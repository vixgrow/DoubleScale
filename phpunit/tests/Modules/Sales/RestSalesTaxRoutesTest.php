<?php
/**
 * Sales tax REST route registration.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Rest\Controllers\RestSalesTaxController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestUtil.php';

/**
 * @group smoke
 */
final class RestSalesTaxRoutesTest extends TestCase {

	public function test_registers_tax_crud_routes(): void {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( RestSalesTaxController::class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		$routes = array_map(
			static function ( array $ep ): string {
				return (string) $ep['route'];
			},
			doublescale_rest_collect_flat_endpoints()
		);

		$this->assertContains( '/sales/taxes', $routes );
		$this->assertContains( '/sales/taxes/(?P<id>[\d]+)', $routes );
	}
}
