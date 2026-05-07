<?php
/**
 * Website tracking module bootstrap.
 *
 * Owns page-visit storage, migrations, public tracking script hooks, and REST.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\WebsiteTracking;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Container;
use DoubleScale\Modules\Tracking\Services\TrackingService;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'websitetracking';
	}

	public function label(): string {
		return __( 'Website tracking', 'doublescale' );
	}

	public function description(): string {
		return __( 'Page visits, visitor cookies, and anonymous visit stitching.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core', 'contacts', 'campaigns' );
	}

	public function register( Container $container ): void {
		if ( ! $container->has( TrackingService::class ) ) {
			$container->singleton( TrackingService::class );
		}

		$container->singleton(
			Website::class,
			static fn() => Website::instance()
		);
	}

	public function restControllers(): array {
		return array(
			\DoubleScale\Modules\WebsiteTracking\Rest\Controllers\RestPageVisitController::class,
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

		Website::instance();
	}
}
