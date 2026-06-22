<?php
/**
 * Registers every REST controller from the committed manifest and asserts each
 * route exposes callable handlers and permission callbacks that return bool|WP_Error.
 * Does not boot WordPress REST server or hit the database — this is route wiring coverage.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use PHPUnit\Framework\TestCase;
use ReflectionClass;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__ ) . '/RestApiEndpointTestStubs.php';
require_once dirname( __DIR__ ) . '/RestApiEndpointTestUtil.php';
require_once dirname( __DIR__ ) . '/ProTestAutoload.php';

/**
 * @group smoke
 */
final class RestAllEndpointsRegistrationTest extends TestCase {

	public static function setUpBeforeClass(): void {
		doublescale_phpunit_ensure_pro_autoload();
		parent::setUpBeforeClass();
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public static function manifest_controller_short_names() {
		$root = dirname( __DIR__, 2 );
		$path = $root . '/phpunit/data/rest-controller-classes.expected.json';
		$list = json_decode( (string) file_get_contents( $path ), true );
		if ( ! is_array( $list ) ) {
			self::fail( 'Invalid rest-controller-classes.expected.json' );
		}
		$out = array();
		foreach ( $list as $short ) {
			$out[ (string) $short ] = array( (string) $short );
		}
		return $out;
	}

	/**
	 * @dataProvider manifest_controller_short_names
	 */
	public function test_manifest_controller_resolves_to_fqcn( string $short ) {
		$root = dirname( __DIR__, 2 );
		$fqcn = doublescale_rest_controller_fqcn_from_map( $root, $short );
		$this->assertNotNull( $fqcn, "Missing FQCN for {$short} in rest-controller-fqcn-map.json — run: php tools/phpunit/build-rest-controller-manifest.php" );
		$this->assertTrue( class_exists( $fqcn ), "Class must exist: {$fqcn}" );
	}

	/**
	 * @dataProvider manifest_controller_short_names
	 */
	public function test_each_controller_registers_routes_with_callable_handlers( string $short ) {
		doublescale_rest_reset_route_registry();

		$root = dirname( __DIR__, 2 );
		$fqcn = doublescale_rest_controller_fqcn_from_map( $root, $short );
		$this->assertNotNull( $fqcn, "Missing FQCN for {$short} in rest-controller-fqcn-map.json" );

		$ref = new ReflectionClass( $fqcn );
		$this->assertTrue( $ref->hasMethod( 'register_routes' ), "{$fqcn} must declare register_routes()" );

		$controller = $ref->newInstanceWithoutConstructor();
		$controller->register_routes();

		$endpoints = doublescale_rest_collect_flat_endpoints();
		$this->assertNotEmpty(
			$endpoints,
			"{$short} must register at least one REST route (check register_rest_route calls)"
		);

		foreach ( $endpoints as $i => $ep ) {
			$label = "{$short}[{$i}] {$ep['namespace']}{$ep['route']}";

			$this->assertNotNull( $ep['methods'], $label . ' methods' );
			$this->assertIsCallable( $ep['callback'], $label . ' callback' );
			$this->assertIsCallable( $ep['permission'], $label . ' permission_callback' );
		}
	}

	public function test_total_registered_endpoints_matches_snapshot() {
		doublescale_rest_reset_route_registry();

		$root = dirname( __DIR__, 2 );
		$path = $root . '/phpunit/data/rest-controller-classes.expected.json';
		$shorts = json_decode( (string) file_get_contents( $path ), true );
		$this->assertIsArray( $shorts );

		foreach ( $shorts as $short ) {
			$fqcn = doublescale_rest_controller_fqcn_from_map( $root, (string) $short );
			$this->assertNotNull( $fqcn, (string) $short );
			$ref = new ReflectionClass( $fqcn );
			$ref->newInstanceWithoutConstructor()->register_routes();
		}

		$endpoints = doublescale_rest_collect_flat_endpoints();
		$count     = count( $endpoints );

		$snapshot_path = $root . '/phpunit/data/rest-endpoint-counts.expected.json';
		$this->assertFileExists( $snapshot_path, 'Missing rest-endpoint-counts.expected.json' );
		$snap = json_decode( (string) file_get_contents( $snapshot_path ), true );
		$this->assertIsArray( $snap );
		$this->assertArrayHasKey( 'total_endpoints', $snap );
		$this->assertSame(
			(int) $snap['total_endpoints'],
			$count,
			'Total REST endpoint count changed. If intentional, update phpunit/data/rest-endpoint-counts.expected.json (run phpunit with var_dump($count) once).'
		);
	}
}
