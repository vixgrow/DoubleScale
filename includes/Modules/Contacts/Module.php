<?php
/**
 * Contacts module bootstrap.
 *
 * Owns: contacts, contact meta, lists, tags, segments (contact filters),
 * import/export, unsubscribe page. Lead scoring lives in the Lead Scoring module.
 *
 * @package DoubleScale\Modules\Contacts
 */

namespace DoubleScale\Modules\Contacts;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'contacts';
	}

	public function label(): string {
		return __( 'Contacts', 'doublescale' );
	}

	public function description(): string {
		return __( 'Contact management, lists, tags, segments, and import/export.', 'doublescale' );
	}

	public function is_toggleable(): bool {
		return false;
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core' );
	}

	public function register( Container $container ): void {
		$container->singleton(
			Filters\FiltersManager::class,
			static fn() => Filters\FiltersManager::instance()
		);

		$container->singleton(
			ImportExport\Importers\Manager::class,
			static fn() => ImportExport\Importers\Manager::instance()
		);
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestContactController::class,
			Rest\Controllers\RestListController::class,
			Rest\Controllers\RestTagController::class,
			Rest\Controllers\RestImportExportController::class,
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		$container->get( Filters\FiltersManager::class );
		$container->get( ImportExport\Importers\Manager::class );

		add_action(
			'doublescale_ready',
			static function () {
				if ( class_exists( \DoubleScale\Modules\Integrations\Gohighlevel\GohighlevelOauth::class ) ) {
					\DoubleScale\Modules\Integrations\Gohighlevel\GohighlevelOauth::init();
				}
			},
			15
		);

		$this->loadModuleMergeTagFiles();

		$this->loadManifestOrGlobs(
			array( 'includes/Modules/Contacts/Filters/*/*.php' ),
			'contacts-filters'
		);

		/**
		 * Register the form-submission contact filter after the full kernel boot.
		 *
		 * The filter class file loads with the glob above, but registration must depend on the
		 * Pro `forms` module being active. Doing this on {@see 'doublescale_ready'} guarantees
		 * module registry + enabled flags are final before {@see \DoubleScale\Admin\AdminConfig}
		 * reads {@see FiltersManager::get_groups()} on admin pages.
		 */
		add_action(
			'doublescale_ready',
			static function (): void {
				if ( ! function_exists( 'doublescale_is_module_active' ) || ! doublescale_is_module_active( 'forms' ) ) {
					return;
				}
				if ( ! class_exists( Filters\Submission\FormSubmission::class, true ) ) {
					return;
				}
				$mgr = Filters\FiltersManager::instance();
				if ( array_key_exists( 'form_submission', $mgr->get_filters() ) ) {
					return;
				}
				try {
					$mgr->register( new Filters\Submission\FormSubmission() );
				} catch ( \Throwable $e ) {
					// Duplicate registration or invalid state — do not break bootstrap.
				}
			},
			20
		);
	}
}
