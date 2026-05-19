<?php
/**
 * Automations list REST pagination contract.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use DoubleScale\Modules\Automations\Rest\Controllers\RestAutomationController;
use PHPUnit\Framework\TestCase;

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
}
