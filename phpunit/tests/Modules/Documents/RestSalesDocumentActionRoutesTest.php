<?php
/**
 * Ensures the admin proposal/invoice row-action endpoints are registered.
 *
 * @package DoubleScale\Tests\Modules\Documents
 */

namespace DoubleScale\Tests\Modules\Documents;

use DoubleScale\Modules\Documents\Rest\Controllers\RestInvoiceController;
use DoubleScale\Modules\Documents\Rest\Controllers\RestProposalController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestUtil.php';

/**
 * @group smoke
 */
final class RestSalesDocumentActionRoutesTest extends TestCase {

	/**
	 * @param class-string $controller_class Controller to register.
	 * @return array<int, array{route: string, methods: array<string, bool>}>
	 */
	private function endpoints_for( string $controller_class ): array {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( $controller_class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		return doublescale_rest_collect_flat_endpoints();
	}

	/**
	 * @param array<int, array<string, mixed>> $endpoints Flat endpoints.
	 * @return string[]
	 */
	private function routes_from( array $endpoints ): array {
		return array_map(
			static function ( array $ep ): string {
				return (string) $ep['route'];
			},
			$endpoints
		);
	}

	public function test_registers_proposal_duplicate_and_status_routes(): void {
		$routes = $this->routes_from( $this->endpoints_for( RestProposalController::class ) );

		$base = '/sales/proposals/(?P<id>[\d]+)';

		$this->assertContains( $base . '/duplicate', $routes );
		$this->assertContains( $base . '/status', $routes );
		$this->assertContains( $base . '/convert-to-invoice', $routes );
	}

	public function test_registers_invoice_duplicate_and_status_routes(): void {
		$routes = $this->routes_from( $this->endpoints_for( RestInvoiceController::class ) );

		$base = '/sales/invoices/(?P<id>[\d]+)';

		$this->assertContains( $base . '/duplicate', $routes );
		$this->assertContains( $base . '/status', $routes );
	}

	/**
	 * The id catch-all must stay last: registering it first would shadow the
	 * named sub-routes.
	 */
	public function test_status_route_is_registered_before_the_id_catch_all(): void {
		$routes = $this->routes_from( $this->endpoints_for( RestProposalController::class ) );

		$status_index    = array_search( '/sales/proposals/(?P<id>[\d]+)/status', $routes, true );
		$catch_all_index = array_search( '/sales/proposals/(?P<id>[\d]+)', $routes, true );

		$this->assertNotFalse( $status_index );
		$this->assertNotFalse( $catch_all_index );
		$this->assertLessThan( $catch_all_index, $status_index );
	}

	public function test_action_routes_expose_callable_handlers(): void {
		$endpoints = array_merge(
			$this->endpoints_for( RestProposalController::class ),
			$this->endpoints_for( RestInvoiceController::class )
		);

		$guarded = array(
			'/sales/proposals/(?P<id>[\d]+)/status',
			'/sales/proposals/(?P<id>[\d]+)/duplicate',
			'/sales/invoices/(?P<id>[\d]+)/status',
			'/sales/invoices/(?P<id>[\d]+)/duplicate',
		);

		$seen = array();
		foreach ( $endpoints as $endpoint ) {
			if ( ! in_array( (string) $endpoint['route'], $guarded, true ) ) {
				continue;
			}

			$seen[] = (string) $endpoint['route'];
			$this->assertIsCallable( $endpoint['callback'], (string) $endpoint['route'] );
			$this->assertIsCallable( $endpoint['permission'], (string) $endpoint['route'] );
		}

		// A silently unregistered route would otherwise pass this test vacuously.
		$this->assertSame( 4, count( $seen ) );
	}
}
