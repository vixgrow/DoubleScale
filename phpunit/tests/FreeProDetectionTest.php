<?php
/**
 * Pro detection helper and REST surfaces that expose {@see is_pro} metadata when Pro is inactive.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use DoubleScale\Modules\Automations\Rest\Controllers\RestAutomationController;
use DoubleScale\Modules\Campaigns\Rest\Controllers\RestTemplateController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

final class FreeProDetectionTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options']  = array();
		$GLOBALS['__doublescale_phpunit_filters']    = array();
		$GLOBALS['__doublescale_phpunit_hooks']      = array();
		$GLOBALS['__doublescale_phpunit_transients'] = array();
	}

	public function test_doublescale_is_plugin_active_false_for_pro_path_when_not_active(): void {
		if ( ! defined( 'DOUBLESCALE_PRO_PLUGIN_PATH' ) ) {
			define( 'DOUBLESCALE_PRO_PLUGIN_PATH', 'doublescale-pro/doublescale-pro.php' );
		}

		require_once \DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';

		update_option( 'active_plugins', array() );
		$this->assertFalse( doublescale_is_plugin_active( \DOUBLESCALE_PRO_PLUGIN_PATH ) );

		update_option( 'active_plugins', array( \DOUBLESCALE_PRO_PLUGIN_PATH ) );
		$this->assertTrue( doublescale_is_plugin_active( \DOUBLESCALE_PRO_PLUGIN_PATH ) );
	}

	public function test_rest_template_collection_includes_is_pro_filter(): void {
		$controller = new RestTemplateController();
		$params     = $controller->get_collection_params();
		$this->assertArrayHasKey( 'is_pro', $params );
		$this->assertSame( 'integer', $params['is_pro']['type'] ?? null );
	}

	public function test_rest_automation_dependency_marks_pro_only_trigger_when_pro_inactive(): void {
		if ( ! defined( 'DOUBLESCALE_PRO_PLUGIN_PATH' ) ) {
			define( 'DOUBLESCALE_PRO_PLUGIN_PATH', 'doublescale-pro/doublescale-pro.php' );
		}
		require_once \DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';
		update_option( 'active_plugins', array() );

		// Use a CRM group that is gated purely by Pro (no module dependency).
		// `deal` would short-circuit on the module-off check, which intentionally
		// wins over the Pro check (see check_trigger_plugin_dependency), so it
		// would never exercise the is_pro branch this test asserts.
		$trigger        = new \stdClass();
		$trigger->source = 'crm';
		$trigger->group  = 'contact';
		$trigger->is_pro = true;

		$ref  = new ReflectionClass( RestAutomationController::class );
		$ctrl = $ref->newInstanceWithoutConstructor();
		$m    = $ref->getMethod( 'check_trigger_plugin_dependency' );
		$m->setAccessible( true );
		/** @var array<string, mixed> $out */
		$out = $m->invoke( $ctrl, $trigger );

		$this->assertTrue( (bool) ( $out['is_pro'] ?? false ) );
	}
}
