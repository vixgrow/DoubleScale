<?php
/**
 * REST Device Controller
 *
 * Handles FCM device token registration and unregistration.
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Core\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Notifications\Services\DeviceTokenService;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestDeviceController class
 */
class RestDeviceController extends WP_REST_Controller {

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'doublescale/v1';

	/**
	 * REST Base.
	 *
	 * @var string
	 */
	protected $rest_base = 'devices';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/register",
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'register_device' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'token'    => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $value ) {
							return ! empty( $value ) && is_string( $value ) && strlen( $value ) <= 500;
						},
					),
					'platform' => array(
						'required'          => false,
						'type'              => 'string',
						'default'           => 'android',
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $value ) {
							return in_array( $value, array( 'android', 'ios' ), true );
						},
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/unregister",
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'unregister_device' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'token' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $value ) {
							return ! empty( $value ) && is_string( $value );
						},
					),
				),
			)
		);
	}

	/**
	 * Register a device token for the current user.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function register_device( $request ) {
		$user_id  = get_current_user_id();
		$token    = $request->get_param( 'token' );
		$platform = $request->get_param( 'platform' );

		$result = DeviceTokenService::register( $user_id, $token, $platform );

		if ( ! $result ) {
			return new WP_Error(
				'registration_failed',
				__( 'Failed to register device token.', 'doublescale' ),
				array( 'status' => 500 )
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Device registered successfully.', 'doublescale' ),
			),
			200
		);
	}

	/**
	 * Unregister a device token for the current user.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function unregister_device( $request ) {
		$user_id = get_current_user_id();
		$token   = $request->get_param( 'token' );

		DeviceTokenService::unregister( $user_id, $token );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Device unregistered successfully.', 'doublescale' ),
			),
			200
		);
	}

	/**
	 * Permission check — any authenticated user with CRM access.
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function permissions_check() {
		return is_user_logged_in();
	}
}
