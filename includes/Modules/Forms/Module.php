<?php
/**
 * Forms module bootstrap.
 *
 * Owns: form integrations (per-vendor adapters), FormsManager, form models,
 * submissions migration, REST form controller.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Forms;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'forms';
	}

	public function label(): string {
		return __( 'Forms', 'doublescale' );
	}

	public function description(): string {
		return __( 'Connect form builder plugins to capture leads and trigger automations.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core', 'contacts' );
	}

	public function register( Container $container ): void {
		$container->singleton(
			Services\FormsManager::class,
			static fn() => Services\FormsManager::instance()
		);
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestFormController::class,
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

		$container->get( Services\FormsManager::class );

		$this->loadModuleMergeTagFiles();

		$this->loadManifestOrGlobs(
			array( 'includes/Modules/Forms/*/Form.php' ),
			'forms'
		);

		add_filter( 'doublescale_forms', array( $this, 'register_forms' ) );
	}

	public function register_forms( $forms ) {
		$forms['elementor']      = new Elementor\Form();
		$forms['formidable']     = new Formidable\Form();
		$forms['forminator']     = new Forminator\Form();
		$forms['gravityforms']   = new Gravityforms\Form();
		$forms['metform']        = new Metform\Form();
		$forms['ninjaforms']     = new Ninjaforms\Form();
		$forms['wsform']         = new Wsform\Form();
		$forms['bitform']        = new Bitform\Form();
		$forms['sureforms']      = new Sureforms\Form();
		$forms['eform']          = new Eform\Form();
		$forms['jetformbuilder'] = new Jetformbuilder\Form();
		return $forms;
	}
}
