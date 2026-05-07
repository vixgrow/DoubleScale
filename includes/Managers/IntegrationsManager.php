<?php
/**
 * Integrations facade for the free plugin (CRM vendor integrations ship in Pro).
 *
 * @package DoubleScale\Managers
 */

namespace DoubleScale\Managers;

defined( 'ABSPATH' ) || exit;

/**
 * Singleton placeholder used by automations, admin config, and legacy call sites.
 */
final class IntegrationsManager {

	/**
	 * @var self|null
	 */
	private static $instance;

	/**
	 * @return self
	 */
	public static function instance() {
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
		return null;
	}

	/**
	 * @return array
	 */
	public function get_options() {
		return array();
	}
}
