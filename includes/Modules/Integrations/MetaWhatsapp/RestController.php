<?php
/**
 * Meta WhatsApp REST Controller
 *
 * REST Api endpoints for Meta WhatsApp integration settings
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Integrations\MetaWhatsapp;

use DoubleScale\Modules\Integrations\Abstracts\RestIntegrationController;

defined( 'ABSPATH' ) || exit;

/**
 * RestController class for Meta WhatsApp
 */
class RestController extends RestIntegrationController {

	/**
	 * Get settings schema for Meta WhatsApp
	 *
	 * @return array Settings schema with properties
	 */
	public function get_settings_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'access_token'         => array(
					'label'       => __( 'Access Token', 'doublescale'),
					'type'        => 'string',
					'required'    => true,
					'description' => __( 'Permanent access token from Meta Developer Console.', 'doublescale'),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'phone_number_id'      => array(
					'label'       => __( 'Phone Number ID', 'doublescale'),
					'type'        => 'string',
					'required'    => true,
					'description' => __( 'Whatsapp phone number ID from Meta Developer Console.', 'doublescale'),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'business_account_id'  => array(
					'label'       => __( 'Business Account ID', 'doublescale'),
					'type'        => 'string',
					'required'    => true,
					'description' => __( 'Whatsapp Business Account ID (WABA ID).', 'doublescale'),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'webhook_verify_token' => array(
					'label'       => __( 'Webhook Verify Token', 'doublescale'),
					'type'        => 'string',
					'required'    => true,
					'description' => __( 'Random string for webhook verification. Enter this same value in Meta Developer Console.', 'doublescale'),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'app_secret'           => array(
					'label'       => __( 'App Secret', 'doublescale'),
					'type'        => 'string',
					'required'    => true,
					'description' => __( 'Meta App Secret for webhook signature verification.', 'doublescale'),
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			),
		);
	}

	/**
	 * Register additional routes specific to Meta WhatsApp
	 *
	 * @return void
	 */
	public function register_additional_routes() {
		// Get phone numbers for dropdown selection
		register_rest_route(
			$this->namespace,
			'/integrations/' . $this->integration->slug . '/phone-numbers',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_phone_numbers' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		// Get webhook configuration info
		register_rest_route(
			$this->namespace,
			'/integrations/' . $this->integration->slug . '/webhook-info',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_webhook_info' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		// Test connection endpoint
		register_rest_route(
			$this->namespace,
			'/integrations/' . $this->integration->slug . '/test',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'test_connection' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);
	}

	/**
	 * Check admin permission
	 *
	 * @return bool True if user has permission.
	 */
	public function check_admin_permission() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get phone numbers from the Business Account
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return \WP_REST_Response Response object.
	 */
	public function get_phone_numbers( $request ) {
		$remote_data = new RemoteData( $this->integration );
		$phones      = $remote_data->get_phone_numbers();

		return new \WP_REST_Response(
			array(
				'success'       => true,
				'phone_numbers' => $phones,
			),
			200
		);
	}

	/**
	 * Get webhook configuration information
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return \WP_REST_Response Response object.
	 */
	public function get_webhook_info( $request ) {
		return new \WP_REST_Response(
			array(
				'success' => true,
				'webhook' => array(
					'callback_url' => $this->integration->get_webhook_url(),
					'verify_token' => $this->integration->get_setting( 'webhook_verify_token' ),
					'fields'       => array( 'messages', 'message_status' ),
				),
			),
			200
		);
	}

	/**
	 * Test connection to Meta Api
	 *
	 * Accepts credentials directly (like Twilio pattern) for testing before saving.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return \WP_REST_Response|\WP_Error Response object or error.
	 */
	public function test_connection( $request ) {
		// Get credentials from request (like Twilio pattern) or fallback to saved settings.
		$access_token        = $request->get_param( 'access_token' ) ?? $this->integration->get_setting( 'access_token' );
		$phone_number_id     = $request->get_param( 'phone_number_id' ) ?? $this->integration->get_setting( 'phone_number_id' );
		$business_account_id = $request->get_param( 'business_account_id' ) ?? $this->integration->get_setting( 'business_account_id' );

		if ( empty( $access_token ) || empty( $phone_number_id ) || empty( $business_account_id ) ) {
			return new \WP_Error(
				'missing_credentials',
				__( 'Please fill in Access Token, Phone Number ID, and Business Account ID.', 'doublescale'),
				array( 'status' => 400 )
			);
		}

		// Create Api instance with provided credentials.
		$api = new Api( $access_token, $phone_number_id, $business_account_id );

		// Test by fetching phone numbers.
		$result = $api->get_phone_numbers();

		if ( ! $result['success'] ) {
			return new \WP_Error(
				'connection_failed',
				$result['error'],
				array( 'status' => 500 )
			);
		}

		// Get business profile for additional info.
		$profile = $api->get_business_profile();

		return new \WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Successfully connected to Meta WhatsApp Api.', 'doublescale'),
				'data'    => array(
					'phone_numbers' => $result['data']['data'] ?? array(),
					'profile'       => $profile['success'] ? ( $profile['data']['data'][0] ?? null ) : null,
				),
			),
			200
		);
	}
}





