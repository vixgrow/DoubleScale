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
use DoubleScale\Core\PluginKernel;
use DoubleScale\Database\Install;
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

		$registry = PluginKernel::instance()->get_module_registry();
		$all      = $registry->all();
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

		// Dependency validation: cannot disable a module that an enabled module depends on.
		$errors = array();
		foreach ( $proposed as $slug => $enabled ) {
			if ( $enabled ) {
				continue;
			}
			$dependents = $this->get_enabled_dependents( $slug, $all, $proposed );
			if ( ! empty( $dependents ) ) {
				$labels = array_map(
					static function ( $dep_slug ) use ( $all ) {
						return $all[ $dep_slug ]->label();
					},
					$dependents
				);
				$errors[] = sprintf(
					/* translators: 1: module label, 2: comma-separated dependent labels */
					__( 'Cannot disable "%1$s" because it is required by: %2$s.', 'doublescale' ),
					$all[ $slug ]->label(),
					implode( ', ', $labels )
				);
			}
		}

		if ( ! empty( $errors ) ) {
			return new WP_Error(
				'dependency_conflict',
				implode( ' ', $errors ),
				array( 'status' => 400 )
			);
		}

		$prev_stored = is_array( $stored ) ? $stored : array();
		update_option( 'doublescale_enabled_modules', $proposed );

		$run_install = false;
		foreach ( $all as $slug => $module ) {
			if ( ! $module->is_toggleable() ) {
				continue;
			}
			$before = isset( $prev_stored[ $slug ] ) ? (bool) $prev_stored[ $slug ] : true;
			$after  = isset( $proposed[ $slug ] ) ? (bool) $proposed[ $slug ] : true;
			if ( false === $before && true === $after ) {
				$run_install = true;
				break;
			}
		}
		if ( $run_install && class_exists( Install::class ) ) {
			Install::install();
		}

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
		$registry = PluginKernel::instance()->get_module_registry();
		$all      = $registry->all();
		$stored   = get_option( 'doublescale_enabled_modules', array() );
		$result   = array();

		foreach ( $all as $slug => $module ) {
			$deps = array_filter(
				$module->dependencies(),
				static function ( $d ) {
					return 'core' !== $d;
				}
			);

			$enabled = $module->is_toggleable()
				? ( ! isset( $stored[ $slug ] ) || (bool) $stored[ $slug ] )
				: true;

			$result[] = array(
				'slug'         => $slug,
				'label'        => $module->label(),
				'description'  => $module->description(),
				'enabled'      => $enabled,
				'is_toggleable' => $module->is_toggleable(),
				'dependencies' => array_values( $deps ),
			);
		}

		return $result;
	}

	/**
	 * Find enabled modules that depend on $slug.
	 *
	 * @param string                                     $slug
	 * @param array<string, \DoubleScale\Core\ModuleInterface> $all
	 * @param array<string, bool>                        $proposed
	 * @return string[]
	 */
	private function get_enabled_dependents( string $slug, array $all, array $proposed ): array {
		$dependents = array();
		foreach ( $all as $other_slug => $module ) {
			if ( $other_slug === $slug ) {
				continue;
			}
			$is_enabled = ! $module->is_toggleable()
				|| ( ! isset( $proposed[ $other_slug ] ) || (bool) $proposed[ $other_slug ] );

			if ( $is_enabled && in_array( $slug, $module->dependencies(), true ) ) {
				$dependents[] = $other_slug;
			}
		}
		return $dependents;
	}
}
