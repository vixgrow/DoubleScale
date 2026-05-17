<?php
/**
 * Integration test for \DoubleScale\Core\Container.
 *
 * The Container is a thin wrapper around Illuminate\Container. These tests
 * lock in the public API (singleton/bind/instance/get/has/global) so refactors
 * can't change semantics silently.
 *
 * @package DoubleScale\Tests\Integration\Core
 */

namespace DoubleScale\Tests\Integration\Core;

use DoubleScale\Core\Container;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class ContainerTest extends IntegrationTestCase {

	public function test_bind_resolves_a_fresh_instance_each_time(): void {
		$container = new Container();
		$container->bind( 'fresh', static function () {
			return new \stdClass();
		} );

		$a = $container->get( 'fresh' );
		$b = $container->get( 'fresh' );

		$this->assertNotSame( $a, $b, 'bind() must return a new instance per resolve.' );
	}

	public function test_singleton_resolves_the_same_instance_each_time(): void {
		$container = new Container();
		$container->singleton( 'shared', static function () {
			return new \stdClass();
		} );

		$a = $container->get( 'shared' );
		$b = $container->get( 'shared' );

		$this->assertSame( $a, $b, 'singleton() must return the same instance on subsequent resolves.' );
	}

	public function test_instance_registers_a_concrete_object(): void {
		$container = new Container();
		$obj       = new \stdClass();
		$obj->tag  = 'fixed';

		$container->instance( 'tagged', $obj );

		$this->assertSame( $obj, $container->get( 'tagged' ) );
	}

	public function test_has_returns_true_only_for_bound_abstracts(): void {
		$container = new Container();
		$container->bind( 'bound', static function () {
			return 'value';
		} );

		$this->assertTrue( $container->has( 'bound' ) );
		$this->assertFalse( $container->has( 'unbound' ) );
	}

	public function test_global_returns_null_until_set_as_global(): void {
		Container::reset_global_for_tests();
		$this->assertNull( Container::global() );

		$container = new Container();
		$container->set_as_global();

		$this->assertSame( $container, Container::global() );

		Container::reset_global_for_tests();
		$this->assertNull( Container::global() );
	}
}
