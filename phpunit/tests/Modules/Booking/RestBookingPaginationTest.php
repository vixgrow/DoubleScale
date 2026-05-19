<?php
/**
 * Booking list REST pagination contract.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Booking;

use DoubleScale\Modules\Booking\Rest\Controllers\RestBookingController;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
class RestBookingPaginationTest extends TestCase {

	/**
	 * Collection params expose page/per_page defaults used by the bookings admin UI.
	 */
	public function test_get_collection_params_declares_pagination(): void {
		$controller = new RestBookingController();
		$params     = $controller->get_collection_params();

		$this->assertArrayHasKey( 'page', $params );
		$this->assertArrayHasKey( 'per_page', $params );
		$this->assertSame( 1, $params['page']['default'] );
		$this->assertSame( 10, $params['per_page']['default'] );
		$this->assertSame( 100, $params['per_page']['maximum'] );
	}
}
