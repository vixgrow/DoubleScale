<?php
/**
 * No-op notification REST routes when the Notifications module is disabled.
 *
 * The admin shell always mounts the notification bell; without these routes
 * apiFetch returns 404 and the console fills with errors. Real routes are
 * registered by {@see \DoubleScale\Modules\Notifications\Rest\Controllers\RestNotificationsController}
 * when the module boots — this controller only fills gaps.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Core\Rest\Controllers;

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * Late-registered REST shims for notification endpoints.
 */
final class RestNotificationShimController extends WP_REST_Controller {

	protected $namespace = 'doublescale/v1';

	/**
	 * Runs on {@see 'rest_api_init'} priority 999 after module controllers.
	 */
	public static function register_late_shims(): void {
		$server = rest_get_server();
		foreach ( array_keys( $server->get_routes() ) as $route ) {
			if ( false !== strpos( (string) $route, '/doublescale/v1/notifications/count' ) ) {
				return;
			}
		}

		$ctrl = new self();
		$ctrl->register_routes();
	}

	/**
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/notifications/count',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_unread_count' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/notifications',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_notifications' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'page'     => array(
						'default'           => 1,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'per_page' => array(
						'default'           => 20,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/notification-preferences',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_preferences' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'noop_post_preferences' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/notification-preferences/defaults',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_preferences' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/notification-preferences/categories',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_empty_object' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
	}

	/**
	 * @return bool|\WP_Error
	 */
	public function permissions_check() {
		if ( ! current_user_can( 'doublescale_access' ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to access this endpoint.', 'doublescale' ),
				array( 'status' => 403 )
			);
		}
		return true;
	}

	/**
	 * @return WP_REST_Response
	 */
	public function get_unread_count() {
		return new WP_REST_Response( array( 'unread_count' => 0 ), 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_notifications( $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = max( 1, min( 50, (int) $request->get_param( 'per_page' ) ) );

		return new WP_REST_Response(
			array(
				'notifications' => array(),
				'total'         => 0,
				'page'          => $page,
				'per_page'      => $per_page,
				'total_pages'   => 1,
			),
			200
		);
	}

	/**
	 * @return WP_REST_Response
	 */
	public function get_preferences() {
		return new WP_REST_Response( self::default_preferences_payload(), 200 );
	}

	/**
	 * @return WP_REST_Response
	 */
	public function noop_post_preferences() {
		return new WP_REST_Response( self::default_preferences_payload(), 200 );
	}

	/**
	 * @return WP_REST_Response
	 */
	public function get_empty_object() {
		return new WP_REST_Response( array(), 200 );
	}

	/**
	 * @return array<string, mixed>
	 */
	private static function default_preferences_payload(): array {
		return array(
			'channels'      => array(
				'bell'    => true,
				'email'   => true,
				'browser' => true,
				'push'    => false,
			),
			'subcategories' => array(),
		);
	}
}
