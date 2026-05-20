<?php

/**
 * REST Api: Site Verification & Auth Controller (Mobile App)
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Core\Rest\Controllers;


defined( 'ABSPATH' ) || exit;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Application_Passwords;
use DoubleScale\Core\Abstracts\RestController;

class RestSiteVerificationController extends RestController {
	protected $rest_base = 'site';

	const TEMP_TOKEN_TTL = 900; // 15 minutes

	public function register_routes() {
		// Verify site.
		//
		// Public endpoint by design: returns plugin name + version + SSL
		// status. The DoubleScale mobile app calls this BEFORE login to
		// confirm the host is a real DoubleScale install and that
		// Application Passwords are available. No sensitive data is
		// exposed and the response shape is identical for every caller.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/verify',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'verify_site' ),
					'permission_callback' => '__return_true',
				),
			)
		);

		// Login (username/password).
		//
		// Public endpoint by design: this is the auth handshake itself —
		// the caller cannot be authenticated yet because they are obtaining
		// credentials. Safeguards in login():
		//   * SSL is enforced (HTTP returns 403).
		//   * Credentials are validated via wp_authenticate(), so the WP
		//     core hooks for rate-limiting / two-factor / login lockout
		//     plugins still apply.
		//   * On success only a short-lived (15 min) one-time temp token
		//     is issued; the user must follow up with create-app-password
		//     to obtain a long-lived credential.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/login',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'login' ),
					'permission_callback' => '__return_true',
					'args'                => array(
						'username' => array(
							'required' => true,
							'type'     => 'string',
						),
						'password' => array(
							'required' => true,
							'type'     => 'string',
						),
					),
				),
			)
		);

		// Create Application Password (with temp token).
		//
		// Not public — `check_temp_token` validates the one-time token issued
		// by /login above, ties the request to that user, and enforces token
		// expiry (15 minutes). The endpoint is reachable only as part of the
		// mobile-app login flow.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/create-app-password',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_application_password' ),
					'permission_callback' => array( $this, 'check_temp_token' ),
					'args'                => array(
						'name' => array(
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);
	}

	/**
	 * Verify site
	 */
	public function verify_site() {
		return new WP_REST_Response(
			array(
				'success' => true,
				'plugin'  => 'Double Scale',
				'version' => DOUBLESCALE_VERSION,
				'is_ssl'  => is_ssl(),
				'auth'    => array(
					'application_passwords' => $this->is_application_password_available(),
				),
			),
			200
		);
	}

	/**
	 * Login endpoint (temporary token)
	 */
	public function login( WP_REST_Request $request ) {
		if ( ! is_ssl() ) {
			return new WP_Error(
				'ssl_required',
				__( 'SSL is required for login.', 'doublescale'),
				array( 'status' => 403 )
			);
		}

		$user = wp_authenticate(
			$request->get_param( 'username' ),
			$request->get_param( 'password' )
		);

		if ( is_wp_error( $user ) ) {
			return new WP_Error(
				'login_failed',
				__( 'Invalid username or password.', 'doublescale'),
				array( 'status' => 401 )
			);
		}

		$token   = wp_generate_password( 64, false );
		$expires = time() + self::TEMP_TOKEN_TTL;

		update_user_meta( $user->ID, 'doublescale_temp_token', $token );
		update_user_meta( $user->ID, 'doublescale_temp_token_expiry', $expires );

		return new WP_REST_Response(
			array(
				'success' => true,
				'user_id' => $user->ID,
				'token'   => $token,
				'expires' => $expires,
				'message' => __( 'Login successful. Temporary token issued.', 'doublescale'),
			),
			200
		);
	}

	/**
	 * Create Application Password
	 */
	public function create_application_password( WP_REST_Request $request ) {

		if ( ! $this->is_application_password_available() ) {
			return new WP_Error(
				'application_password_not_available',
				__( 'Application password is not available. Please contact support.', 'doublescale'),
				array( 'status' => 403 )
			);
		}

		$user = wp_get_current_user();
		$name = $request->get_param( 'name' ) ?: 'Double Scale Mobile App';

		list($password, $item) =
			WP_Application_Passwords::create_new_application_password(
				$user->ID,
				array( 'name' => $name )
			);

		// One-time token cleanup
		delete_user_meta( $user->ID, 'doublescale_temp_token' );
		delete_user_meta( $user->ID, 'doublescale_temp_token_expiry' );

		return new WP_REST_Response(
			array(
				'success'              => true,
				'username'             => $user->user_login,
				'application_password' => $password,
				'uuid'                 => $item['uuid'],
			),
			201
		);
	}

	/**
	 * Validate temporary token
	 */
	public function check_temp_token( WP_REST_Request $request ) {
		$token = $request->get_header( 'x-doublescale-token' );
		if ( ! $token ) {
			$token = $request->get_header( 'x-ds-token' );
		}

		if ( ! $token ) {
			return new WP_Error(
				'missing_token',
				__( 'Temporary token is required.', 'doublescale'),
				array( 'status' => 401 )
			);
		}

		$users = get_users(
			array(
				'meta_key'   => 'doublescale_temp_token',
				'meta_value' => $token,
				'number'     => 1,
			)
		);

		if ( empty( $users ) ) {
			return new WP_Error(
				'invalid_token',
				__( 'Invalid token.', 'doublescale'),
				array( 'status' => 401 )
			);
		}

		$user   = $users[0];
		$expiry = (int) get_user_meta( $user->ID, 'doublescale_temp_token_expiry', true );

		if ( time() > $expiry ) {
			return new WP_Error(
				'token_expired',
				__( 'Token expired.', 'doublescale'),
				array( 'status' => 401 )
			);
		}

		wp_set_current_user( $user->ID );
		return true;
	}

	private function is_application_password_available() {
		return function_exists( 'wp_is_application_passwords_available' )
			&& wp_is_application_passwords_available();
	}
}
