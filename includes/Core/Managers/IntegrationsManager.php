<?php
/**
 * Integrations facade: delegates to the Pro implementation when the Pro plugin is active.
 *
 * CRM vendor integrations live in DoubleScale Pro; the free plugin keeps this FQCN so
 * automations and admin config can reference it without fatals when Pro is not installed.
 *
 * @package DoubleScale\Managers
 */

namespace DoubleScale\Core\Managers;

defined( 'ABSPATH' ) || exit;

/**
 * Singleton entry point for integration registry access.
 */
final class IntegrationsManager {

	/**
	 * @var self|null
	 */
	private static $instance;

	/**
	 * @return self|\DoubleScale\Pro\Modules\Integrations\Services\IntegrationsManager
	 */
	public static function instance() {
		if ( class_exists( \DoubleScale\Pro\Modules\Integrations\Services\IntegrationsManager::class, true ) ) {
			return \DoubleScale\Pro\Modules\Integrations\Services\IntegrationsManager::instance();
		}

		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	private function __construct() {}

	/**
	 * @param string $slug Integration slug.
	 * @return bool
	 */
	public function is_active( $slug ) {
		return false;
	}

	/**
	 * @param string $slug Integration slug.
	 * @return null
	 */
	public function get_integration( $slug ) {
		unset( $slug );
		return null;
	}

	/**
	 * @return array
	 */
	public function get_options() {
		return array();
	}
}
