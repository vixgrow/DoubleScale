<?php
/**
 * Custom Fields module — registers REST controllers for field definitions and groups.
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\CustomFields;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;

final class Module extends AbstractModule {

	public function slug(): string {
		return 'custom-fields';
	}

	public function label(): string {
		return __( 'Custom Fields', 'doublescale' );
	}

	public function description(): string {
		return __( 'Custom field definitions and groups for contacts, deals, and other CRM records.', 'doublescale' );
	}

	public function is_toggleable(): bool {
		return false;
	}

	public function dependencies(): array {
		return array( 'core' );
	}

	public function boot( Container $container ): void {
		if ( defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
			foreach ( glob( DOUBLESCALE_PLUGIN_DIR . 'includes/Fields/Types/*.php' ) ?: array() as $file ) {
				require_once $file;
			}
		}
		parent::boot( $container );
	}

	public function restControllers(): array {
		return array(
			\DoubleScale\Core\CustomFields\Rest\RestCustomFieldController::class,
			\DoubleScale\Core\CustomFields\Rest\RestCustomFieldsGroupController::class,
		);
	}
}
