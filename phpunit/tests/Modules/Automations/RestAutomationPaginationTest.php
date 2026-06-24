<?php
/**
 * Automations list REST pagination contract.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use DoubleScale\Modules\Automations\Rest\Controllers\RestAutomationController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestUtil.php';

/**
 * @group smoke
 */
class RestAutomationPaginationTest extends TestCase {

	/**
	 * Collection params expose page/per_page defaults used by the automations list UI.
	 */
	public function test_get_collection_params_declares_pagination(): void {
		$controller = new RestAutomationController();
		$params     = $controller->get_collection_params();

		$this->assertArrayHasKey( 'page', $params );
		$this->assertArrayHasKey( 'per_page', $params );
		$this->assertSame( 1, $params['page']['default'] );
		$this->assertSame( 10, $params['per_page']['default'] );
		$this->assertSame( 200, $params['per_page']['maximum'] );
	}

	/**
	 * Duplicate route is registered for workflow copy.
	 */
	public function test_duplicate_route_is_registered(): void {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( RestAutomationController::class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		$duplicate_route = '/automations/(?P<id>[\d]+)/duplicate';
		$found           = false;

		foreach ( doublescale_rest_collect_flat_endpoints() as $endpoint ) {
			if ( $duplicate_route !== (string) $endpoint['route'] ) {
				continue;
			}
			if ( \WP_REST_Server::CREATABLE === (int) $endpoint['methods'] ) {
				$found = true;
				break;
			}
		}

		$this->assertTrue( $found, 'POST /automations/{id}/duplicate route should be registered.' );
	}
}
