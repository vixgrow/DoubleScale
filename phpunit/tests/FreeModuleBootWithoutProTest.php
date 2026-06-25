<?php
/**
 * Free plugin discovers feature modules plus core without loading Pro.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use DoubleScale\Core\Container;
use DoubleScale\Core\CoreModule;
use DoubleScale\Core\ModuleRegistry;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class FreeModuleBootWithoutProTest extends TestCase {

	public function test_module_registry_contains_only_free_slugs_when_pro_not_hooked(): void {
		$container = new Container();
		$registry  = new ModuleRegistry( $container );
		$registry->register( new CoreModule() );
		$registry->discover( DOUBLESCALE_PLUGIN_DIR . 'includes/Modules' );

		$slugs = array_keys( $registry->all() );
		sort( $slugs );

		$this->assertSame(
			array( 'activities', 'automations', 'booking', 'campaigns', 'contacts', 'core', 'documents', 'emails', 'forms', 'knowledgebase', 'notifications', 'portal', 'sales', 'smtp', 'support', 'tracking' ),
			$slugs,
			'Free tree must register the expected module slugs (core + discovered feature modules) when Pro is not attached.'
		);
	}
}
