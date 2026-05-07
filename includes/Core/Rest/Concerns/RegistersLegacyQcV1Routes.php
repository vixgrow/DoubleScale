<?php
/**
 * Duplicate REST routes under legacy namespace qc/v1 (admin SPA compatibility).
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core\Rest\Concerns;

defined( 'ABSPATH' ) || exit;

trait RegistersLegacyQcV1Routes {

	/**
	 * Register the same routes as register_routes() under qc/v1.
	 *
	 * @return void
	 */
	public function register_routes_legacy(): void {
		$original        = $this->namespace;
		$this->namespace = 'qc/v1';
		$this->register_routes();
		$this->namespace = $original;
	}
}
