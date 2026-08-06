<?php
/**
 * WhatsApp share route registration for sales documents.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

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
final class SendWhatsappRoutesTest extends TestCase {

	/**
	 * Registered routes for a controller.
	 *
	 * @param string $class Controller class.
	 * @return array<int, string>
	 */
	private function routes_for( string $class ): array {
		doublescale_rest_reset_route_registry();

		$controller = ( new ReflectionClass( $class ) )->newInstanceWithoutConstructor();
		$controller->register_routes();

		return array_map(
			static function ( array $ep ): string {
				return (string) $ep['route'];
			},
			doublescale_rest_collect_flat_endpoints()
		);
	}

	public function test_invoice_controller_registers_send_whatsapp(): void {
		$routes = $this->routes_for( RestInvoiceController::class );

		$this->assertContains( '/sales/invoices/(?P<id>[\d]+)/send-whatsapp', $routes );
	}

	public function test_proposal_controller_registers_send_whatsapp(): void {
		$routes = $this->routes_for( RestProposalController::class );

		$this->assertContains( '/sales/proposals/(?P<id>[\d]+)/send-whatsapp', $routes );
	}

	/**
	 * The email route must survive alongside the new one — WhatsApp is an
	 * addition, not a replacement.
	 */
	public function test_email_send_route_still_registered(): void {
		$routes = $this->routes_for( RestInvoiceController::class );

		$this->assertContains( '/sales/invoices/(?P<id>[\d]+)/send', $routes );
	}

	public function test_handlers_are_callable(): void {
		foreach ( array( RestInvoiceController::class, RestProposalController::class ) as $class ) {
			$this->assertTrue(
				method_exists( $class, 'send_item_whatsapp' ),
				"{$class} is missing send_item_whatsapp()."
			);
		}
	}
}
