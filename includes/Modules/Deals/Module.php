<?php
/**
 * Deals module bootstrap.
 *
 * Owns: pipelines, stages, deals, pipeline/deal managers, deal REST API.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Deals;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'deals';
	}

	public function label(): string {
		return __( 'Pipelines & Deals', 'doublescale' );
	}

	public function description(): string {
		return __( 'Manage sales pipelines, deal stages, and track deal progress.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core', 'contacts' );
	}

	public function register( Container $container ): void {
		// PipelineManager / DealManager are registered in PluginKernel::register_core_services()
		// so they remain available when the deals module is toggled off.
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestPipelineController::class,
			Rest\Controllers\RestDealController::class,
			Rest\Controllers\RestStageController::class,
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

		$container->get( Services\PipelineManager::class );
		$container->get( Services\DealManager::class );

		$this->loadModuleMergeTagFiles();
	}
}
