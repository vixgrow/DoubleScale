<?php

/**
 * REST_Plugins_Controller class.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Abstracts\REST_Controller;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * REST_Plugins_Controller class.
 *
 * Handles basic plugin status checks and installs from WordPress.org.
 *
 * @since 1.0.0
 */
class REST_Plugins_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'plugins';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/status",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_status' ),
					'permission_callback' => array( $this, 'manage_plugins_permissions_check' ),
					'args'                => array(
						'plugins' => array(
							'required'          => true,
							'type'              => 'string',
							'description'       => __( 'Comma-separated list of plugin file paths.', 'quillcrm' ),
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/install",
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'install_and_activate' ),
					'permission_callback' => array( $this, 'manage_plugins_permissions_check' ),
					'args'                => array(
						'download_url' => array(
							'required'          => true,
							'type'              => 'string',
							'description'       => __( 'Zip download URL from WordPress.org.', 'quillcrm' ),
							'sanitize_callback' => 'esc_url_raw',
						),
						'plugin_file'  => array(
							'required'          => true,
							'type'              => 'string',
							'description'       => __( 'Plugin file path, e.g. slug/slug.php.', 'quillcrm' ),
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/activate",
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'activate' ),
					'permission_callback' => array( $this, 'manage_plugins_permissions_check' ),
					'args'                => array(
						'plugin_file' => array(
							'required'          => true,
							'type'              => 'string',
							'description'       => __( 'Plugin file path, e.g. slug/slug.php.', 'quillcrm' ),
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);
	}

	/**
	 * Check if current user can manage plugins.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function manage_plugins_permissions_check( $request ) {
		if ( current_user_can( 'install_plugins' ) && current_user_can( 'activate_plugins' ) ) {
			return true;
		}

		return new WP_Error(
			'quillcrm_rest_plugins_forbidden',
			__( 'Sorry, you are not allowed to manage plugins.', 'quillcrm' ),
			array( 'status' => 403 )
		);
	}

	/**
	 * Get plugin status (installed / active) for a list of plugin files.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_status( WP_REST_Request $request ) {
		$plugins_param = $request->get_param( 'plugins' );
		$plugins       = array_filter(
			array_map( 'trim', explode( ',', (string) $plugins_param ) )
		);

		if ( empty( $plugins ) ) {
			return new WP_Error(
				'quillcrm_rest_plugins_invalid',
				__( 'No plugins specified.', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$results = array();

		foreach ( $plugins as $plugin_file ) {
			$plugin_file = trim( $plugin_file );
			if ( '' === $plugin_file ) {
				continue;
			}

			$plugin_path  = WP_PLUGIN_DIR . '/' . $plugin_file;
			$is_installed = file_exists( $plugin_path );
			$actual_plugin_file = $plugin_file;

			// If the exact path doesn't exist, try to find the plugin by searching for the main plugin file name
			if ( ! $is_installed ) {
				$plugin_file_name = basename( $plugin_file );
				$plugins_dir      = WP_PLUGIN_DIR;
				$plugin_dirs      = glob( $plugins_dir . '/*', GLOB_ONLYDIR );

				foreach ( $plugin_dirs as $dir ) {
					$dir_name  = basename( $dir );
					$test_file = $dir_name . '/' . $plugin_file_name;
					$test_path = WP_PLUGIN_DIR . '/' . $test_file;
					if ( file_exists( $test_path ) ) {
						$actual_plugin_file = $test_file;
						$is_installed      = true;
						break;
					}
				}
			}

			$is_active = $is_installed && is_plugin_active( $actual_plugin_file );

			$results[ $plugin_file ] = array(
				'is_installed'      => $is_installed,
				'is_active'         => $is_active,
				'actual_plugin_file' => $actual_plugin_file !== $plugin_file ? $actual_plugin_file : null,
			);
		}

		return new WP_REST_Response(
			array(
				'data' => $results,
			),
			200
		);
	}

	/**
	 * Install and activate a plugin from a WordPress.org download URL.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function install_and_activate( WP_REST_Request $request ) {
		$download_url = (string) $request->get_param( 'download_url' );
		$plugin_file  = (string) $request->get_param( 'plugin_file' );

		if ( empty( $download_url ) || empty( $plugin_file ) ) {
			return new WP_Error(
				'quillcrm_rest_plugins_missing_params',
				__( 'Both download_url and plugin_file are required.', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		// Only allow installs from the official WordPress.org plugins directory.
		$parsed_url = wp_parse_url( $download_url );
		if ( empty( $parsed_url['host'] ) || 'downloads.wordpress.org' !== $parsed_url['host'] ) {
			return new WP_Error(
				'quillcrm_rest_plugins_invalid_source',
				__( 'Only installs from the WordPress.org plugins directory are allowed.', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		require_once ABSPATH . 'wp-admin/includes/misc.php';
		require_once ABSPATH . 'wp-admin/includes/class-automatic-upgrader-skin.php';

		// Initialize filesystem.
		$fs_initialized = WP_Filesystem();
		if ( ! $fs_initialized ) {
			return new WP_Error(
				'quillcrm_rest_plugins_fs_error',
				__( 'Unable to initialize the filesystem API.', 'quillcrm' ),
				array( 'status' => 500 )
			);
		}

		$skin     = new \Automatic_Upgrader_Skin();
		$upgrader = new \Plugin_Upgrader( $skin );

		$install_result = $upgrader->install( $download_url );

		if ( is_wp_error( $install_result ) ) {
			return new WP_Error(
				'quillcrm_rest_plugins_install_failed',
				$install_result->get_error_message(),
				array( 'status' => 500 )
			);
		}

		// Get the actual plugin file path from the upgrader after installation.
		// The plugin folder name might differ from what we expected.
		$actual_plugin_file = $upgrader->plugin_info();
		
		// If we couldn't get the actual plugin file, try to find it by the expected plugin file.
		if ( ! $actual_plugin_file ) {
			// Try the provided plugin_file first.
			$plugin_path = WP_PLUGIN_DIR . '/' . $plugin_file;
			if ( file_exists( $plugin_path ) ) {
				$actual_plugin_file = $plugin_file;
			} else {
				// Try to find the plugin by searching for the main plugin file name.
				$plugin_file_name = basename( $plugin_file );
				$plugins_dir       = WP_PLUGIN_DIR;
				$plugin_dirs      = glob( $plugins_dir . '/*', GLOB_ONLYDIR );
				
				foreach ( $plugin_dirs as $dir ) {
					$dir_name     = basename( $dir );
					$test_file    = $dir_name . '/' . $plugin_file_name;
					$test_path    = WP_PLUGIN_DIR . '/' . $test_file;
					if ( file_exists( $test_path ) ) {
						$actual_plugin_file = $test_file;
						break;
					}
				}
			}
		}

		// If we still don't have a plugin file, return an error.
		if ( ! $actual_plugin_file ) {
			return new WP_Error(
				'quillcrm_rest_plugins_plugin_file_not_found',
				esc_html__( 'Plugin installed successfully but plugin file could not be found.', 'quillcrm' ),
				array( 'status' => 500 )
			);
		}

		/**
		 * WordPress.org Review: Automatic activation removed
		 * Plugins cannot change the activation status of other plugins.
		 * The plugin is installed successfully, but user must activate manually.
		 */
		// Activate the plugin using the actual plugin file path.
		// $activate_result = activate_plugin( $actual_plugin_file );

		// if ( is_wp_error( $activate_result ) ) {
		// 	return new WP_Error(
		// 		'quillcrm_rest_plugins_activate_failed',
		// 		$activate_result->get_error_message(),
		// 		array( 'status' => 500 )
		// 	);
		// }

		return new WP_REST_Response(
			array(
				'success'      => true,
				'plugin_file'  => $actual_plugin_file,
				'download_url' => $download_url,
				'message'      => esc_html__( 'Plugin installed successfully. Please activate it manually from the WordPress Plugins page.', 'quillcrm' ),
			),
			200
		);
	}

	/**
	 * Activate an already-installed plugin.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function activate( WP_REST_Request $request ) {
		$plugin_file = (string) $request->get_param( 'plugin_file' );

		if ( empty( $plugin_file ) ) {
			return new WP_Error(
				'quillcrm_rest_plugins_missing_params',
				__( 'Plugin file is required.', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		if ( ! function_exists( 'activate_plugin' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		/**
		 * WordPress.org Review: Automatic activation removed
		 * Plugins cannot change the activation status of other plugins.
		 * This must be performed by the user manually.
		 */
		$plugin_path = WP_PLUGIN_DIR . '/' . $plugin_file;

		if ( ! file_exists( $plugin_path ) ) {
			return new WP_Error(
				'quillcrm_rest_plugins_not_installed',
				esc_html__( 'Plugin is not installed.', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		// WordPress.org Compliance: Automatic activation not allowed
		// $activate_result = activate_plugin( $plugin_file );

		// if ( is_wp_error( $activate_result ) ) {
		// 	return new WP_Error(
		// 		'quillcrm_rest_plugins_activate_failed',
		// 		$activate_result->get_error_message(),
		// 		array( 'status' => 500 )
		// 	);
		// }

		return new WP_REST_Response(
			array(
				'success'     => true,
				'plugin_file' => $plugin_file,
				'message'     => esc_html__( 'Plugin is installed. Please activate it manually from the WordPress Plugins page.', 'quillcrm' ),
			),
			200
		);
	}
}


