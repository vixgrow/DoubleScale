<?php
/**
 * Sales contract type REST route registration.
 *
 * @package DoubleScale\Tests\Modules\Contracts
 */

namespace DoubleScale\Tests\Modules\Contracts;

use DoubleScale\Modules\Contracts\Rest\Controllers\RestContractTypeController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestUtil.php';

/**
 * @group smoke
 */
final class RestContractTypeRoutesTest extends TestCase {

	public function test_registers_contract_type_crud_routes(): void {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( RestContractTypeController::class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		$routes = array_map(
			static function ( array $ep ): string {
				return (string) $ep['route'];
			},
			doublescale_rest_collect_flat_endpoints()
		);

		$this->assertContains( '/sales/contract-types', $routes );
		$this->assertContains( '/sales/contract-types/(?P<id>[\d]+)', $routes );
	}
}
