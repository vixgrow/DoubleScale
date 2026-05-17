<?php
/**
 * Integration test for \DoubleScale\Lifecycle.
 *
 * Lifecycle is the plugin's entry point. By the time the integration bootstrap
 * has run, Lifecycle::boot() has already fired during muplugins_loaded, so
 * the assertions here verify the side effects of a real boot.
 *
 * @package DoubleScale\Tests\Integration\Core
 */

namespace DoubleScale\Tests\Integration\Core;

use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class LifecycleTest extends IntegrationTestCase {

	public function test_plugin_constants_are_defined(): void {
		$this->assertTrue( defined( 'DOUBLESCALE_PLUGIN_DIR' ) );
		$this->assertTrue( defined( 'DOUBLESCALE_PLUGIN_URL' ) );
		$this->assertTrue( defined( 'DOUBLESCALE_VERSION' ) );
		$this->assertTrue( defined( 'DOUBLESCALE_PLUGIN_FILE' ) );
		$this->assertTrue( defined( 'DOUBLESCALE_FREE_PLUGIN_LOADED' ) );
	}

	public function test_lifecycle_class_is_loaded_via_autoload(): void {
		$this->assertTrue( class_exists( \DoubleScale\Lifecycle::class ) );
	}

	public function test_lifecycle_does_not_double_boot(): void {
		// Calling boot a second time must be a no-op (guarded by the
		// DOUBLESCALE_FREE_PLUGIN_LOADED constant in doublescale.php).
		$exception_thrown = false;
		try {
			\DoubleScale\Lifecycle::boot( DOUBLESCALE_PLUGIN_FILE );
		} catch ( \Throwable $e ) {
			$exception_thrown = true;
		}
		$this->assertFalse( $exception_thrown, 'Lifecycle::boot() called a second time must not throw.' );
	}

	public function test_non_toggleable_tables_exist_after_activation(): void {
		global $wpdb;

		$expected = array(
			$wpdb->prefix . 'doublescale_contacts',
			$wpdb->prefix . 'doublescale_activities',
			$wpdb->prefix . 'doublescale_logs',
		);

		foreach ( $expected as $table ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$found = $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" );
			$this->assertSame( $table, $found, "Non-toggleable table must exist after activation: {$table}" );
		}
	}

	public function test_module_registry_has_core_and_feature_modules(): void {
		$container = new \DoubleScale\Core\Container();
		$registry  = new \DoubleScale\Core\ModuleRegistry( $container );
		$registry->register( new \DoubleScale\Core\CoreModule() );
		$registry->discover( DOUBLESCALE_PLUGIN_DIR . 'includes/Modules' );

		$slugs = array_keys( $registry->all() );
		sort( $slugs );

		$this->assertContains( 'core', $slugs );
		$this->assertContains( 'contacts', $slugs );
		$this->assertContains( 'activities', $slugs );
		$this->assertContains( 'tracking', $slugs );
		$this->assertContains( 'emails', $slugs );
		$this->assertContains( 'booking', $slugs );
		$this->assertContains( 'campaigns', $slugs );
		$this->assertContains( 'automations', $slugs );
		$this->assertContains( 'smtp', $slugs );
	}
}
