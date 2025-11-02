<?php
/**
 * Class Bounce_Handler_Manager
 * This class is responsible for managing bounce handlers
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;

/**
 * Bounce_Handler_Manager class
 */
final class Bounce_Handler_Manager {

	/**
	 * Registered bounce handlers
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $handlers = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Bounce_Handler_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Bounce_Handler_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'quillcrm_loaded', array( $this, 'load_handlers' ) );
	}

	/**
	 * Load bounce handlers
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_handlers() {
		$handlers_dir = QUILLCRM_PLUGIN_DIR . 'includes/bounce-handlers/';

		if ( ! is_dir( $handlers_dir ) ) {
			return;
		}

		foreach ( glob( $handlers_dir . 'class-*-bounce-handler.php' ) as $file ) {
			require_once $file;
		}

		do_action( 'quillcrm_bounce_handlers_loaded' );
	}

	/**
	 * Register a bounce handler
	 *
	 * @since 1.0.0
	 *
	 * @param string $class_name Handler class name
	 *
	 * @return bool
	 */
	public function register( $class_name ) {
		if ( ! class_exists( $class_name ) ) {
			return false;
		}

		try {
			$handler = new $class_name();
			$slug    = $this->get_slug_from_class( $class_name );

			$this->handlers[ $slug ] = $handler;

			return true;
		} catch ( Exception $e ) {
			error_log( 'QuillCRM Bounce Handler Registration Error: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Get slug from class name
	 *
	 * @since 1.0.0
	 *
	 * @param string $class_name Class name
	 *
	 * @return string
	 */
	private function get_slug_from_class( $class_name ) {
		// QuillCRM\Bounce_Handlers\Sendgrid_Bounce_Handler -> sendgrid
		$parts = explode( '\\', $class_name );
		$class = end( $parts );
		$slug  = str_replace( array( '_bounce_handler', '-' ), '', strtolower( $class ) );

		return $slug;
	}

	/**
	 * Register REST API routes
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			'quillcrm/v1',
			'/webhooks/bounce/(?P<provider>[a-z0-9-]+)',
			array(
				'methods'             => array( 'GET', 'POST' ),
				'callback'            => array( $this, 'handle_webhook' ),
				'permission_callback' => array( $this, 'verify_webhook_security' ),
				'args'                => array(
					'provider' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Verify webhook security
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Request object
	 *
	 * @return bool|\WP_Error
	 */
	public function verify_webhook_security( $request ) {
		$security_key = get_option( 'quillcrm_bounce_security_key' );

		if ( ! $security_key ) {
			// Generate longer key (32 chars instead of 16) for better security
			$security_key = 'qcrm_' . wp_generate_password( 32, false );
			update_option( 'quillcrm_bounce_security_key', $security_key );
			update_option( 'quillcrm_bounce_security_key_generated_at', time() );
		}

		$provided_key = $request->get_param( 'key' );

		// Use hash_equals() to prevent timing attacks
		// CRITICAL: Never use === or !== for security comparisons
		if ( ! hash_equals( $security_key, (string) $provided_key ) ) {
			// Log failed attempts for security monitoring
			do_action(
				'quillcrm_bounce_webhook_failed_auth',
				array(
					'provider'  => $request->get_param( 'provider' ),
					'ip'        => isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '',
					'timestamp' => time(),
				)
			);

			return new \WP_Error( 'invalid_key', 'Invalid security key', array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Handle webhook
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Request object
	 *
	 * @return \WP_REST_Response
	 */
	public function handle_webhook( $request ) {
		$provider = $request->get_param( 'provider' );

		if ( ! isset( $this->handlers[ $provider ] ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Unknown provider: ' . $provider,
				),
				404
			);
		}

		$handler = $this->handlers[ $provider ];

		// Get data from request
		$data = $request->get_json_params();
		if ( empty( $data ) ) {
			$data = $request->get_params();
		}

		// Special handling for raw input (e.g., Amazon SNS)
		if ( empty( $data ) || $provider === 'amazonses' ) {
			$raw_data = file_get_contents( 'php://input' );
			if ( $raw_data ) {
				$decoded = json_decode( $raw_data, true );
				if ( $decoded ) {
					$data = $decoded;
				}
			}
		}

		// Log if debugging enabled
		if ( defined( 'QUILLCRM_BOUNCE_DEBUG' ) && QUILLCRM_BOUNCE_DEBUG ) {
			error_log( 'QuillCRM Bounce Webhook - Provider: ' . $provider );
			error_log( 'QuillCRM Bounce Webhook - Data: ' . print_r( $data, true ) );
		}

		$handler->set_data( $data );
		$result = $handler->handle();

		return new \WP_REST_Response(
			array(
				'success'  => true,
				'provider' => $provider,
				'message'  => 'Bounce webhook processed',
				'result'   => $result,
			),
			200
		);
	}

	/**
	 * Get webhook URLs
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_webhook_urls() {
		$security_key = get_option( 'quillcrm_bounce_security_key' );
		$base_url     = rest_url( 'quillcrm/v1/webhooks/bounce/' );

		$urls = array();
		foreach ( $this->handlers as $slug => $handler ) {
			$urls[ $slug ] = array(
				'name' => $handler->get_name(),
				'url'  => add_query_arg( 'key', $security_key, $base_url . $slug ),
			);
		}

		return $urls;
	}

	/**
	 * Get registered handlers
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_handlers() {
		return $this->handlers;
	}
}
