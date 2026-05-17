<?php
/**
 * Integration test for \DoubleScale\Core\ModuleRegistry.
 *
 * Covers:
 *  - discover() walks an arbitrary modules root and instantiates Module classes
 *  - register() + get() + all() shape the registered set
 *  - all_sorted_by_dependencies() respects each module's dependencies()
 *  - boot() skips disabled modules and fires the booted action with the
 *    booted slug list in order.
 *
 * @package DoubleScale\Tests\Integration\Core
 */

namespace DoubleScale\Tests\Integration\Core;

use DoubleScale\Core\Container;
use DoubleScale\Core\ModuleInterface;
use DoubleScale\Core\ModuleRegistry;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class ModuleRegistryTest extends IntegrationTestCase {

	public function test_discover_picks_up_free_modules_when_root_points_at_includes_modules(): void {
		$registry = new ModuleRegistry( new Container() );
		$registry->discover( DOUBLESCALE_PLUGIN_DIR . 'includes/Modules' );

		$slugs = array_keys( $registry->all() );
		sort( $slugs );

		// At least one discovered free module must register.
		$this->assertNotEmpty( $slugs, 'discover() must find Module.php files under the given root.' );
		$this->assertContains( 'contacts', $slugs );
	}

	public function test_register_then_get_returns_the_same_instance(): void {
		$registry = new ModuleRegistry( new Container() );
		$module   = $this->make_fake_module( 'fake_a', array() );
		$registry->register( $module );

		$this->assertSame( $module, $registry->get( 'fake_a' ) );
		$this->assertNull( $registry->get( 'does_not_exist' ) );
	}

	public function test_all_sorted_by_dependencies_returns_topological_order(): void {
		$registry = new ModuleRegistry( new Container() );

		// b depends on a; c depends on b.
		$registry->register( $this->make_fake_module( 'c', array( 'b' ) ) );
		$registry->register( $this->make_fake_module( 'a', array() ) );
		$registry->register( $this->make_fake_module( 'b', array( 'a' ) ) );

		$ordered = $registry->all_sorted_by_dependencies();
		$slugs   = array_map( static fn( $m ) => $m->slug(), $ordered );

		$this->assertSame( array( 'a', 'b', 'c' ), $slugs );
	}

	public function test_all_sorted_by_dependencies_falls_back_on_cycle(): void {
		$registry = new ModuleRegistry( new Container() );

		// a -> b -> a cycle.
		$registry->register( $this->make_fake_module( 'a', array( 'b' ) ) );
		$registry->register( $this->make_fake_module( 'b', array( 'a' ) ) );

		$ordered = $registry->all_sorted_by_dependencies();
		$this->assertCount( 2, $ordered, 'On a cycle, fallback returns all modules in registration order.' );
	}

	public function test_boot_skips_disabled_modules_and_calls_register_then_boot(): void {
		$registry = new ModuleRegistry( new Container() );

		$enabled  = $this->make_fake_module( 'enabled', array(), true );
		$disabled = $this->make_fake_module( 'disabled', array(), false );

		$registry->register( $enabled );
		$registry->register( $disabled );

		$booted_slugs = array();
		add_action( 'doublescale_modules_booted', static function ( $slugs ) use ( &$booted_slugs ) {
			$booted_slugs = $slugs;
		} );

		$registry->boot();

		$this->assertTrue( $enabled->was_registered, 'Enabled module register() must be called.' );
		$this->assertTrue( $enabled->was_booted, 'Enabled module boot() must be called.' );
		$this->assertFalse( $disabled->was_registered, 'Disabled module register() must NOT be called.' );
		$this->assertFalse( $disabled->was_booted, 'Disabled module boot() must NOT be called.' );

		$this->assertSame( array( 'enabled' ), $booted_slugs );
	}

	/**
	 * @param string   $slug
	 * @param string[] $deps
	 * @param bool     $enabled
	 */
	private function make_fake_module( string $slug, array $deps = array(), bool $enabled = true ): ModuleInterface {
		return new class( $slug, $deps, $enabled ) implements ModuleInterface {
			public bool $was_registered = false;
			public bool $was_booted     = false;

			public function __construct(
				private string $module_slug,
				private array $module_deps,
				private bool $is_module_enabled
			) {}

			public function slug(): string {
				return $this->module_slug;
			}
			public function label(): string {
				return $this->module_slug;
			}
			public function description(): string {
				return '';
			}
			public function is_toggleable(): bool {
				return true;
			}
			public function version(): string {
				return '0.0.0';
			}
			public function dependencies(): array {
				return $this->module_deps;
			}
			public function is_enabled(): bool {
				return $this->is_module_enabled;
			}
			public function isActive(): bool {
				return $this->is_module_enabled;
			}
			public function register( Container $container ): void {
				$this->was_registered = true;
			}
			public function boot( Container $container ): void {
				$this->was_booted = true;
			}
			public function migrations(): array {
				return array();
			}
			public function restControllers(): array {
				return array();
			}
			public function onActivate(): void {}
			public function onDeactivate(): void {}
			public function scheduledHooks(): array {
				return array();
			}
		};
	}
}
