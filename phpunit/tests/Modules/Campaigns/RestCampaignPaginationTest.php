<?php
/**
 * Campaigns list REST pagination contract.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Campaigns;

use DoubleScale\Modules\Campaigns\Rest\Controllers\RestCampaignController;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
class RestCampaignPaginationTest extends TestCase {

	/**
	 * Collection params expose page/per_page defaults used by the campaigns list UI.
	 */
	public function test_get_collection_params_declares_pagination(): void {
		$controller = new RestCampaignController();
		$params     = $controller->get_collection_params();

		$this->assertArrayHasKey( 'page', $params );
		$this->assertArrayHasKey( 'per_page', $params );
		$this->assertSame( 1, $params['page']['default'] );
		$this->assertSame( 10, $params['per_page']['default'] );
	}
}
