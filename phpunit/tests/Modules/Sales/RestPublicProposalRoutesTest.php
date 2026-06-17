<?php
/**
 * Ensures guest proposal endpoints (accept, decline, PDF) are registered.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Rest\Controllers\RestPublicProposalController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestUtil.php';

/**
 * @group smoke
 */
final class RestPublicProposalRoutesTest extends TestCase {

	public function test_registers_guest_accept_decline_and_pdf_routes(): void {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( RestPublicProposalController::class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		$routes = array_map(
			static function ( array $ep ): string {
				return (string) $ep['route'];
			},
			doublescale_rest_collect_flat_endpoints()
		);

		$base = '/sales/public/proposals/(?P<hash>[a-f0-9]{32})';

		$this->assertContains( $base, $routes );
		$this->assertContains( $base . '/accept', $routes );
		$this->assertContains( $base . '/decline', $routes );
		$this->assertContains( $base . '/pdf', $routes );
	}
}
