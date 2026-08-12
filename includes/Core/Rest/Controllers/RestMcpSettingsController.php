<?php
/**
 * REST Api: MCP Settings Controller
 *
 * Backs the Settings → MCP screen: connection status, endpoint, tool list,
 * and the on/off switch for the MCP endpoint.
 *
 * @since 1.0.0
 * @package DoubleScale
 */

namespace DoubleScale\Core\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abilities\AbilitiesBootstrap;
use DoubleScale\Core\Abilities\AbilityRegistrar;
use DoubleScale\Core\Abilities\Mcp\ApiKeyStore;
use DoubleScale\Core\Abilities\McpServer;
use DoubleScale\Core\Abstracts\RestController;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class RestMcpSettingsController extends RestController {

	/**
	 * @var string
	 */
	protected $rest_base = 'mcp';

	/**
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/status',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_status' ),
					'permission_callback' => array( $this, 'admin_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/settings',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'admin_permissions_check' ),
					'args'                => array(
						'enabled' => array(
							'required' => true,
							'type'     => 'boolean',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/keys',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_key' ),
					'permission_callback' => array( $this, 'admin_permissions_check' ),
					'args'                => array(
						'label' => array(
							'required' => false,
							'type'     => 'string',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/keys/(?P<id>[a-f0-9]+)',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_key' ),
					'permission_callback' => array( $this, 'admin_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Issue a new API key for the current administrator.
	 *
	 * The key acts as this user, so its reach is exactly their own — it cannot
	 * be used to widen access beyond what they can already see.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function create_key( $request ) {
		$label = (string) $request->get_param( 'label' );

		$created = ApiKeyStore::create( $label, get_current_user_id() );

		return new WP_REST_Response(
			array(
				// Returned exactly once — only the hash is stored.
				'key'      => $created['key'],
				'id'       => $created['id'],
				'label'    => $created['label'],
				'api_keys' => ApiKeyStore::list_for_display(),
				'message'  => __( 'API key created. Copy it now — it will not be shown again.', 'doublescale' ),
			),
			201
		);
	}

	/**
	 * Revoke an API key.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function delete_key( $request ) {
		$deleted = ApiKeyStore::delete( (string) $request->get_param( 'id' ) );

		return new WP_REST_Response(
			array(
				'deleted'  => $deleted,
				'api_keys' => ApiKeyStore::list_for_display(),
			),
			200
		);
	}

	/**
	 * Only administrators may see or change the MCP surface: it governs which
	 * CRM data leaves the site.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request.
	 * @return true|WP_Error
	 */
	public function admin_permissions_check( $request ) {
		unset( $request );

		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to manage MCP settings.', 'doublescale' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Everything the settings screen needs to explain the current state.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_status( $request ) {
		unset( $request );

		// The Abilities API ships in WordPress 6.9. Test for the functions
		// rather than the version number: a site can be on 6.9+ with the API
		// removed by another plugin, or on an older build that provides it.
		// The version is reported only so the admin knows why.
		$api_available = function_exists( 'wp_register_ability' )
			&& function_exists( 'wp_register_ability_category' );

		$abilities_enabled = $api_available && ! get_option( AbilitiesBootstrap::DISABLE_OPTION, false );
		$mcp_enabled       = McpServer::is_enabled();

		return new WP_REST_Response(
			array(
				'abilities_api_available' => $api_available,
				'wp_version'              => get_bloginfo( 'version' ),
				'required_wp_version'     => '6.9',
				'abilities_enabled'       => $abilities_enabled,
				'mcp_enabled'             => $mcp_enabled,
				'connected'               => $abilities_enabled && $mcp_enabled,
				'endpoint_url'            => McpServer::endpoint_url(),
				'tools'                   => $this->tool_summaries(),
				'api_keys'                => ApiKeyStore::list_for_display(),
				'current_user'            => wp_get_current_user()->user_login,
				'app_passwords_url'       => admin_url( 'profile.php#application-passwords-section' ),
				// Application passwords need HTTPS. Without this the connect
				// instructions would send an admin down a path that silently
				// fails on their local or staging site.
				'app_passwords_available' => function_exists( 'wp_is_application_passwords_available' )
					? (bool) wp_is_application_passwords_available()
					: false,
			),
			200
		);
	}

	/**
	 * Toggle the MCP endpoint.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function update_settings( $request ) {
		$enabled = (bool) $request->get_param( 'enabled' );

		update_option( McpServer::ENABLE_OPTION, $enabled );

		return new WP_REST_Response(
			array(
				'mcp_enabled' => $enabled,
				'message'     => $enabled
					? __( 'MCP endpoint enabled.', 'doublescale' )
					: __( 'MCP endpoint disabled.', 'doublescale' ),
			),
			200
		);
	}

	/**
	 * The tools published on the endpoint, grouped for display.
	 *
	 * Reads the live ability registry, so a disabled module's tools are absent
	 * here exactly as they are absent from the endpoint itself.
	 *
	 * @since 1.0.0
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function tool_summaries(): array {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			return array();
		}

		$tools = array();
		foreach ( wp_get_abilities() as $ability ) {
			if ( ! is_object( $ability ) || ! method_exists( $ability, 'get_name' ) ) {
				continue;
			}

			$name = (string) $ability->get_name();
			if ( 0 !== strpos( $name, AbilityRegistrar::NAMESPACE_PREFIX ) ) {
				continue;
			}

			$tools[] = array(
				'name'        => $name,
				'label'       => method_exists( $ability, 'get_label' ) ? $ability->get_label() : $name,
				'description' => method_exists( $ability, 'get_description' ) ? $ability->get_description() : '',
				'category'    => method_exists( $ability, 'get_category' ) ? $ability->get_category() : '',
			);
		}

		return $tools;
	}
}
