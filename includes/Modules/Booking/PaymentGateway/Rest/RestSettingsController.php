<?php
/**
 * Abstract REST settings controller for payment gateways.
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\PaymentGateway\Rest;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Booking\PaymentGateway\PaymentGateway;
use DoubleScale\Modules\Booking\Abstracts\REST_Controller;
use WP_REST_Server;
use WP_REST_Response;
use WP_Error;
use Exception;

/**
 * Payment gateway REST settings controller.
 */
abstract class RestSettingsController extends REST_Controller {

	/**
	 * Payment gateway.
	 *
	 * @var PaymentGateway
	 */
	protected $payment_gateway;

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	public $rest_base = 'payment-gateways';

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param PaymentGateway $payment_gateway
	 */
	public function __construct( PaymentGateway $payment_gateway ) {
		$this->payment_gateway = $payment_gateway;
		$this->rest_base       = "{$this->rest_base}/{$this->payment_gateway->slug}";

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get' ),
					'permission_callback' => array( $this, 'get_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update' ),
					'permission_callback' => array( $this, 'update_permissions_check' ),
					'args'                => rest_get_endpoint_args_for_schema( $this->get_schema(), WP_REST_Server::CREATABLE ),
				),
			)
		);

		// Register route for enabling/disabling the payment gateway
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/enabled",
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_enabled_status' ),
					'permission_callback' => array( $this, 'update_permissions_check' ),
					'args'                => array(
						'enabled' => array(
							'required'    => true,
							'type'        => 'boolean',
							'description' => __( 'Whether the payment gateway is enabled or not', 'doublescale' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Get payment gateway settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get( $request ) {
		try {
			$settings = $this->payment_gateway->get_settings();
			$enabled  = get_option( "doublescale_booking_{$this->payment_gateway->slug}_enabled", false );

			return new WP_REST_Response(
				array(
					'settings' => $settings,
					'enabled'  => (bool) $enabled,
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Update payment gateway enabled status.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update_enabled_status( $request ) {
		try {
			$params  = $request->get_json_params();
			$enabled = isset( $params['enabled'] ) ? (bool) $params['enabled'] : false;

			update_option( "doublescale_booking_{$this->payment_gateway->slug}_enabled", $enabled );

			return new WP_REST_Response(
				array(
					'enabled' => $enabled,
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Update payment gateway settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update( $request ) {
		try {
			$settings  = $request->get_json_params();
			$validator = $this->payment_gateway->validate( $settings );
			if ( is_wp_error( $validator ) ) {
				return $validator;
			}

			$this->payment_gateway->update_settings( $settings );

			return new WP_REST_Response(
				array(
					'settings' => $settings,
				),
				200
			);
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get Permissions Check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Update Permissions Check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function update_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
