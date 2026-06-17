<?php
/**
 * Sales contract REST route registration.
 *
 * @package DoubleScale\Tests\Modules\Contracts
 */

namespace DoubleScale\Tests\Modules\Contracts;

use DoubleScale\Modules\Contracts\Rest\Controllers\RestContractController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestUtil.php';

/**
 * @group smoke
 */
final class RestContractRoutesTest extends TestCase {

	public function test_registers_contract_crud_and_action_routes(): void {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( RestContractController::class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		$routes = array_map(
			static function ( array $ep ): string {
				return (string) $ep['route'];
			},
			doublescale_rest_collect_flat_endpoints()
		);

		$this->assertContains( '/sales/contracts', $routes );
		$this->assertContains( '/sales/contracts/summary', $routes );
		$this->assertContains( '/sales/contracts/(?P<id>[\d]+)', $routes );
		$this->assertContains( '/sales/contracts/(?P<id>[\d]+)/send', $routes );
		$this->assertContains( '/sales/contracts/(?P<id>[\d]+)/pdf', $routes );
		$this->assertContains( '/sales/contracts/(?P<id>[\d]+)/signature', $routes );
		$this->assertContains( '/sales/contracts/(?P<id>[\d]+)/attachments', $routes );
		$this->assertContains( '/sales/contracts/(?P<id>[\d]+)/attachments/(?P<file_hash>[a-zA-Z0-9]+)', $routes );
		$this->assertContains( '/sales/contracts/(?P<id>[\d]+)/attachments/(?P<file_hash>[a-zA-Z0-9]+)/download', $routes );
	}
}
