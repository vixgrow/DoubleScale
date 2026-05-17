<?php
/**
 * Regression: REST controller classes registered from modules match the committed manifest.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__ ) . '/RestControllerManifestUtil.php';

/**
 * @group smoke
 */
final class RestApiControllersManifestTest extends TestCase {

	public function test_register_rest_routes_controller_list_matches_manifest() {
		$root = dirname( __DIR__, 2 );

		$module_files = doublescale_rest_module_files( $root );
		$this->assertNotEmpty( $module_files, 'No module definition files found for REST manifest.' );

		foreach ( $module_files as $f ) {
			$this->assertFileExists( $f, "Module file must exist: {$f}" );
		}

		$this->assertSame(
			0,
			doublescale_count_unparsed_rest_controllers( $root ),
			'If a module overrides restControllers(), use a single return array( SomeController::class, ... ) block so the manifest can be parsed (see includes/Core/AbstractModule.php).'
		);

		$current = doublescale_collect_rest_controller_short_names( $root );

		$expected_path = $root . '/phpunit/data/rest-controller-classes.expected.json';
		$this->assertFileExists( $expected_path, 'Run: php tools/phpunit/build-rest-controller-manifest.php' );

		$expected = json_decode( (string) file_get_contents( $expected_path ), true );
		$this->assertIsArray( $expected, 'Expected manifest must be a JSON array.' );
		$expected = array_values( $expected );
		sort( $expected );

		$this->assertSame(
			$expected,
			$current,
			'REST controller list changed. If intentional, run: php tools/phpunit/build-rest-controller-manifest.php'
		);

		$map_path = $root . '/phpunit/data/rest-controller-fqcn-map.json';
		$this->assertFileExists( $map_path, 'Run: php tools/phpunit/build-rest-controller-manifest.php' );
		$map = json_decode( (string) file_get_contents( $map_path ), true );
		$this->assertIsArray( $map, 'FQCN map must be a JSON object.' );
		$map_keys = array_keys( $map );
		sort( $map_keys );
		$this->assertSame(
			$expected,
			$map_keys,
			'rest-controller-fqcn-map.json keys must match controller short names (regenerate manifest tool).'
		);
	}
}
