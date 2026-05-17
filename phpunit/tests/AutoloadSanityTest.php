<?php
/**
 * Smoke test: core classes load when bootstrap runs.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class AutoloadSanityTest extends TestCase {

	public function test_rest_controller_abstract_loads() {
		$this->assertTrue( class_exists( \DoubleScale\Core\Abstracts\RestController::class ) );
	}

	public function test_core_module_loads() {
		$this->assertTrue( class_exists( \DoubleScale\Core\CoreModule::class ) );
	}

	public function test_contacts_module_loads() {
		$this->assertTrue( class_exists( \DoubleScale\Modules\Contacts\Module::class ) );
	}
}
