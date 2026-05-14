<?php
/**
 * REST Api: Modules Controller
 *
 * Exposes module metadata and allows toggling modules on/off.
 *
 * @since 2.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Core\Rest\Controllers;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\ModuleManager;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class RestModulesController extends RestController {

	/**
	 * @var string
	 */
	protected $rest_base = 'modules';

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_modules' ),
					'permission_callback' => array( $this, 'admin_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_modules' ),
					'permission_callback' => array( $this, 'admin_permissions_check' ),
				),
			)
		);
	}

	/**
	 * @param WP_REST_Request $request
	 * @return bool|WP_Error
	 */
	public function admin_permissions_check( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to manage modules.', 'doublescale' ),
				array( 'status' => 403 )
			);
		}
		return true;
	}

	/**
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response
	 */
	public function get_modules( $request ) {
		return new WP_REST_Response( $this->build_modules_payload(), 200 );
	}

	/**
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_modules( $request ) {
		$incoming = $request->get_param( 'modules' );

		if ( ! is_array( $incoming ) ) {
			return new WP_Error(
				'invalid_param',
				__( 'The "modules" parameter must be an object of slug => boolean.', 'doublescale' ),
				array( 'status' => 400 )
			);
		}

		$all = ModuleManager::all();
		$stored   = get_option( 'doublescale_enabled_modules', array() );

		// Merge incoming with stored values.
		$proposed = is_array( $stored ) ? $stored : array();
		foreach ( $incoming as $slug => $enabled ) {
			$module = $all[ $slug ] ?? null;

			if ( ! $module ) {
				continue;
			}

			if ( ! $module->is_toggleable() ) {
				continue;
			}

			$proposed[ $slug ] = (bool) $enabled;
		}

		$prev_stored = is_array( $stored ) ? $stored : array();
		update_option( 'doublescale_enabled_modules', $proposed );

		return new WP_REST_Response(
			array(
				'success' => true,
				'modules' => $this->build_modules_payload(),
			),
			200
		);
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	private function build_modules_payload(): array {
		$all    = ModuleManager::all();
		$stored = get_option( 'doublescale_enabled_modules', array() );
		$stored = is_array( $stored ) ? $stored : array();
		$result = array();

		foreach ( $all as $slug => $module ) {
			$deps = array_filter(
				$module->dependencies(),
				static function ( $d ) {
					return 'core' !== $d;
				}
			);

			$enabled = $module->is_enabled();

			$result[] = array(
				'slug'          => $slug,
				'label'         => $module->label(),
				'description'   => $module->description(),
				'enabled'       => $enabled,
				'active'        => $enabled,
				'is_toggleable' => $module->is_toggleable(),
				'is_explicit'   => array_key_exists( $slug, $stored ),
				'dependencies'  => array_values( $deps ),
			);
		}

		return $result;
	}
}
