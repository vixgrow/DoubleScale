<?php
/**
 * Activities module bootstrap.
 *
 * Owns: activity models, associations, comments, migrations, timeline service,
 * and REST activity controller.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Activities;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'activities';
	}

	public function label(): string {
		return __( 'Activities', 'doublescale' );
	}

	public function description(): string {
		return __( 'Activity timeline, notes, and interaction history across contacts and deals.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core', 'contacts' );
	}

	public function register( Container $container ): void {
		$container->singleton(
			Services\ActivityManager::class,
			static fn() => Services\ActivityManager::instance()
		);
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestActivityController::class,
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		$legacy_controllers = $this->restControllers();
		add_action(
			'rest_api_init',
			static function () use ( $legacy_controllers ) {
				foreach ( $legacy_controllers as $class ) {
					if ( ! is_string( $class ) || ! is_subclass_of( $class, RestController::class, true ) ) {
						continue;
					}
					if ( ! method_exists( $class, 'register_routes_legacy' ) ) {
						continue;
					}
					( new $class() )->register_routes_legacy();
				}
			},
			11
		);

		$container->get( Services\ActivityManager::class );
	}
}
