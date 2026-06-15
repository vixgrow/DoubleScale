<?php
/**
 * Tests the customer-facing Sales Documents portal gate.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

require_once \DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';

use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class SalesDocumentsReadyGateTest extends TestCase {

	public function test_gate_function_is_defined(): void {
		$this->assertTrue(
			function_exists( 'doublescale_sales_documents_ready' ),
			'doublescale_sales_documents_ready() must live in Core/functions.php so it is always loaded.'
		);
	}

	public function test_filter_can_force_the_surface_off(): void {
		$cb = static function ( $ready ) {
			unset( $ready );
			return false;
		};
		add_filter( 'doublescale_sales_documents_ready', $cb );

		$this->assertFalse( doublescale_sales_documents_ready() );

		remove_filter( 'doublescale_sales_documents_ready', $cb );
	}

	public function test_filter_can_force_the_surface_on(): void {
		$cb = static function ( $ready ) {
			unset( $ready );
			return true;
		};
		add_filter( 'doublescale_sales_documents_ready', $cb );

		$this->assertTrue( doublescale_sales_documents_ready() );

		remove_filter( 'doublescale_sales_documents_ready', $cb );
	}
}
