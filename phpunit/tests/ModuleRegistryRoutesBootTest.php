<?php
/**
 * Boots the ModuleRegistry the same way Lifecycle does, walks every registered
 * module, instantiates each module's REST controllers, and calls
 * `register_routes()` on each one — asserting no exception is thrown.
 *
 * Catches regressions where a controller compiles fine and appears in the
 * manifest JSON but throws during route registration (missing dependency,
 * undefined constant, etc). The companion RestAllEndpointsRegistrationTest
 * iterates the static manifest; this test iterates the live module tree.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use DoubleScale\Core\Container;
use DoubleScale\Core\CoreModule;
use DoubleScale\Core\ModuleRegistry;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use Throwable;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__ ) . '/RestApiEndpointTestStubs.php';

/**
 * @group smoke
 */
final class ModuleRegistryRoutesBootTest extends TestCase {

	public function test_every_module_controller_register_routes_does_not_throw(): void {
		$container = new Container();
		$registry  = new ModuleRegistry( $container );
		$registry->register( new CoreModule() );
		$registry->discover( DOUBLESCALE_PLUGIN_DIR . 'includes/Modules' );

		$modules = $registry->all();
		$this->assertNotEmpty( $modules, 'ModuleRegistry must contain at least core + discovered modules.' );

		$controller_count = 0;

		foreach ( $modules as $slug => $module ) {
			$controllers = $module->restControllers();
			$this->assertIsArray( $controllers, "Module '{$slug}' must return an array from restControllers()." );

			foreach ( $controllers as $controller_class ) {
				$this->assertTrue(
					class_exists( $controller_class ),
					"Controller class must exist: {$controller_class} (module: {$slug})"
				);

				doublescale_rest_reset_route_registry();

				try {
					$ref      = new ReflectionClass( $controller_class );
					$instance = $ref->newInstanceWithoutConstructor();
					$instance->register_routes();
				} catch ( Throwable $e ) {
					$this->fail(
						"Controller {$controller_class} (module: {$slug}) threw during register_routes(): "
						. $e->getMessage()
					);
				}

				$controller_count++;
			}
		}

		$this->assertGreaterThan(
			0,
			$controller_count,
			'At least one REST controller must be registered across all modules.'
		);
	}
}
