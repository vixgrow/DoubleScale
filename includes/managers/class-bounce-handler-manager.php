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
	 * @param string $class_name Handler class name.
	 *
	 * @return bool
	 */
	public function register( $class_name ) {
		// Validate input
		if ( empty( $class_name ) || ! is_string( $class_name ) ) {
			quillcrm_get_logger()->error(
				'Invalid class name provided for bounce handler registration',
				array(
					'source'     => 'bounce-handler-manager',
					'class_name' => $class_name,
					'type'       => gettype( $class_name ),
				)
			);
			return false;
		}

		// Check if class exists
		if ( ! class_exists( $class_name ) ) {
			quillcrm_get_logger()->error(
				'Bounce handler class does not exist: ' . $class_name,
				array(
					'source'     => 'bounce-handler-manager',
					'class_name' => $class_name,
				)
			);
			return false;
		}

		try {
			$handler = new $class_name();

			// Validate that handler extends the abstract class
			if ( ! $handler instanceof \QuillCRM\Abstracts\Bounce_Handler ) {
				quillcrm_get_logger()->error(
					'Bounce handler must extend QuillCRM\Abstracts\Bounce_Handler: ' . $class_name,
					array(
						'source'     => 'bounce-handler-manager',
						'class_name' => $class_name,
						'parent'     => get_parent_class( $handler ),
					)
				);
				return false;
			}

			$slug = $this->get_slug_from_class( $class_name );

			// Check for duplicate registrations
			if ( isset( $this->handlers[ $slug ] ) ) {
				quillcrm_get_logger()->warning(
					'Bounce handler already registered, overwriting: ' . $slug,
					array(
						'source'        => 'bounce-handler-manager',
						'class_name'    => $class_name,
						'slug'          => $slug,
						'existing_name' => $this->handlers[ $slug ]->get_name(),
					)
				);
			}

			$this->handlers[ $slug ] = $handler;

			quillcrm_get_logger()->info(
				'Bounce handler registered successfully: ' . $handler->get_name(),
				array(
					'source'     => 'bounce-handler-manager',
					'class_name' => $class_name,
					'slug'       => $slug,
					'name'       => $handler->get_name(),
				)
			);

			return true;
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				'Bounce handler registration error: ' . $e->getMessage(),
				array(
					'source'     => 'bounce-handler-manager',
					'class_name' => $class_name,
					'exception'  => $e->getMessage(),
					'trace'      => $e->getTraceAsString(),
				)
			);
			return false;
		}
	}

	/**
	 * Get slug from class name
	 *
	 * @since 1.0.0
	 *
	 * @param string $class_name Class name.
	 *
	 * @return string
	 */
	private function get_slug_from_class( $class_name ) {
		// QuillCRM\Bounce_Handlers\Sendgrid_Bounce_Handler -> sendgrid.
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
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return bool|\WP_Error
	 */
	public function verify_webhook_security( $request ) {
		$provider  = $request->get_param( 'provider' );
		$client_ip = $this->get_client_ip();

		// Check rate limiting first
		if ( ! $this->check_rate_limit( $provider, $client_ip ) ) {
			quillcrm_get_logger()->warning(
				'Bounce webhook rate limit exceeded',
				array(
					'source'   => 'bounce-webhook',
					'provider' => $provider,
					'ip'       => $client_ip,
				)
			);

			return new \WP_Error( 'rate_limit_exceeded', 'Rate limit exceeded', array( 'status' => 429 ) );
		}

		$security_key = get_option( 'quillcrm_bounce_security_key' );

		if ( ! $security_key ) {
			// Generate longer key (32 chars instead of 16) for better security.
			$security_key = 'quillcrm_' . wp_generate_password( 32, false );
			update_option( 'quillcrm_bounce_security_key', $security_key );
			update_option( 'quillcrm_bounce_security_key_generated_at', time() );
		}

		$provided_key = $request->get_param( 'key' );

		// Validate key format
		if ( empty( $provided_key ) || ! is_string( $provided_key ) ) {
			quillcrm_get_logger()->warning(
				'Invalid security key format in bounce webhook',
				array(
					'source'   => 'bounce-webhook',
					'provider' => $provider,
					'ip'       => $client_ip,
					'key_type' => gettype( $provided_key ),
				)
			);

			return new \WP_Error( 'invalid_key_format', 'Invalid security key format', array( 'status' => 400 ) );
		}

		if ( ! hash_equals( $security_key, (string) $provided_key ) ) {
			// Log failed attempts for security monitoring
			quillcrm_get_logger()->warning(
				'Invalid security key in bounce webhook',
				array(
					'source'     => 'bounce-webhook',
					'provider'   => $provider,
					'ip'         => $client_ip,
					'key_length' => strlen( $provided_key ),
				)
			);

			do_action(
				'quillcrm_bounce_webhook_failed_auth',
				array(
					'provider'   => $provider,
					'ip'         => $client_ip,
					'timestamp'  => time(),
					'key_length' => strlen( $provided_key ),
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
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return \WP_REST_Response
	 */
	public function handle_webhook( $request ) {
		$start_time = microtime( true );
		$provider   = $request->get_param( 'provider' );
		$request_id = wp_generate_uuid4();

		// Validate provider
		if ( empty( $provider ) || ! is_string( $provider ) ) {
			quillcrm_get_logger()->error(
				'Invalid provider parameter in bounce webhook',
				array(
					'source'     => 'bounce-webhook',
					'provider'   => $provider,
					'request_id' => $request_id,
					'ip'         => $this->get_client_ip(),
				)
			);

			return new \WP_REST_Response(
				array(
					'success'    => false,
					'message'    => 'Invalid provider parameter',
					'request_id' => $request_id,
				),
				400
			);
		}

		// Check if handler exists
		if ( ! isset( $this->handlers[ $provider ] ) ) {
			quillcrm_get_logger()->warning(
				'Unknown provider in bounce webhook: ' . $provider,
				array(
					'source'             => 'bounce-webhook',
					'provider'           => $provider,
					'request_id'         => $request_id,
					'available_handlers' => array_keys( $this->handlers ),
					'ip'                 => $this->get_client_ip(),
				)
			);

			return new \WP_REST_Response(
				array(
					'success'    => false,
					'message'    => 'Unknown provider: ' . $provider,
					'request_id' => $request_id,
				),
				404
			);
		}

		$handler = $this->handlers[ $provider ];

		try {
			// Get and validate data from request
			$data = $this->extract_webhook_data( $request, $provider );

			if ( empty( $data ) ) {
				quillcrm_get_logger()->warning(
					'Empty webhook data received from provider: ' . $provider,
					array(
						'source'     => 'bounce-webhook',
						'provider'   => $provider,
						'request_id' => $request_id,
						'ip'         => $this->get_client_ip(),
					)
				);

				return new \WP_REST_Response(
					array(
						'success'    => false,
						'message'    => 'Empty webhook data',
						'request_id' => $request_id,
					),
					400
				);
			}

			// Log incoming webhook
			quillcrm_get_logger()->debug(
				sprintf( 'Bounce webhook received from provider: %s', $provider ),
				array(
					'source'     => 'bounce-webhook',
					'provider'   => $provider,
					'request_id' => $request_id,
					'data_size'  => is_array( $data ) ? count( $data ) : strlen( serialize( $data ) ),
					'ip'         => $this->get_client_ip(),
				)
			);

			// Process webhook with retry mechanism
			$result = $this->process_webhook_with_retry( $handler, $data, $provider, $request_id );

			$processing_time = round( ( microtime( true ) - $start_time ) * 1000, 2 );

			// Log successful processing
			quillcrm_get_logger()->info(
				sprintf( 'Bounce webhook processed successfully for provider: %s', $provider ),
				array(
					'source'          => 'bounce-webhook',
					'provider'        => $provider,
					'request_id'      => $request_id,
					'result'          => $result,
					'processing_time' => $processing_time . 'ms',
				)
			);

			// Fire action for external logging/monitoring systems
			do_action( 'quillcrm_bounce_webhook_processed', $provider, $result, $data, $request_id );

			return new \WP_REST_Response(
				array(
					'success'         => true,
					'provider'        => $provider,
					'message'         => 'Bounce webhook processed',
					'result'          => $result,
					'request_id'      => $request_id,
					'processing_time' => $processing_time . 'ms',
				),
				200
			);

		} catch ( \Exception $e ) {
			$processing_time = round( ( microtime( true ) - $start_time ) * 1000, 2 );

			quillcrm_get_logger()->error(
				'Bounce webhook processing failed: ' . $e->getMessage(),
				array(
					'source'          => 'bounce-webhook',
					'provider'        => $provider,
					'request_id'      => $request_id,
					'exception'       => $e->getMessage(),
					'trace'           => $e->getTraceAsString(),
					'processing_time' => $processing_time . 'ms',
					'ip'              => $this->get_client_ip(),
				)
			);

			// Fire action for failed webhook processing
			do_action( 'quillcrm_bounce_webhook_failed', $provider, $e, $request_id );

			return new \WP_REST_Response(
				array(
					'success'    => false,
					'message'    => 'Webhook processing failed',
					'request_id' => $request_id,
					'error'      => WP_DEBUG ? $e->getMessage() : 'Internal server error',
				),
				500
			);
		}
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

	/**
	 * Extract webhook data from request
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @param string           $provider Provider name.
	 *
	 * @return array|null
	 */
	private function extract_webhook_data( $request, $provider ) {
		// Try JSON params first
		$data = $request->get_json_params();

		// Fallback to regular params
		if ( empty( $data ) ) {
			$data = $request->get_params();
		}

		// Special handling for providers that send raw input
		$raw_input_providers = apply_filters( 'quillcrm_bounce_raw_input_providers', array( 'amazonses', 'ses' ) );

		if ( empty( $data ) || in_array( $provider, $raw_input_providers, true ) ) {
			$raw_data = file_get_contents( 'php://input' );

			if ( ! empty( $raw_data ) ) {
				// Try to decode as JSON
				$decoded = json_decode( $raw_data, true );

				if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
					$data = $decoded;
				} else {
					// Try to parse as form data
					parse_str( $raw_data, $parsed );
					if ( ! empty( $parsed ) ) {
						$data = $parsed;
					} else {
						// Store raw data for custom parsing
						$data = array( '_raw' => $raw_data );
					}
				}
			}
		}

		// Validate data structure
		if ( ! is_array( $data ) ) {
			quillcrm_get_logger()->warning(
				'Invalid webhook data structure from provider: ' . $provider,
				array(
					'source'    => 'bounce-webhook',
					'provider'  => $provider,
					'data_type' => gettype( $data ),
				)
			);
			return null;
		}

		// Apply provider-specific data filters
		$data = apply_filters( "quillcrm_bounce_webhook_data_{$provider}", $data, $request );
		$data = apply_filters( 'quillcrm_bounce_webhook_data', $data, $provider, $request );

		return $data;
	}

	/**
	 * Process webhook with retry mechanism
	 *
	 * @since 1.0.0
	 *
	 * @param \QuillCRM\Abstracts\Bounce_Handler $handler Handler instance.
	 * @param array                              $data Webhook data.
	 * @param string                             $provider Provider name.
	 * @param string                             $request_id Request ID.
	 *
	 * @return bool
	 * @throws \Exception If all retry attempts fail.
	 */
	private function process_webhook_with_retry( $handler, $data, $provider, $request_id ) {
		$max_retries = apply_filters( 'quillcrm_bounce_webhook_max_retries', 3 );
		$retry_delay = apply_filters( 'quillcrm_bounce_webhook_retry_delay', 1 ); // seconds

		$last_exception = null;

		for ( $attempt = 1; $attempt <= $max_retries; $attempt++ ) {
			try {
				$handler->set_data( $data );
				$result = $handler->handle();

				// If we get here, processing was successful
				if ( $attempt > 1 ) {
					quillcrm_get_logger()->info(
						sprintf( 'Bounce webhook processing succeeded on attempt %d for provider: %s', $attempt, $provider ),
						array(
							'source'     => 'bounce-webhook',
							'provider'   => $provider,
							'request_id' => $request_id,
							'attempt'    => $attempt,
							'result'     => $result,
						)
					);
				}

				return $result;

			} catch ( \Exception $e ) {
				$last_exception = $e;

				quillcrm_get_logger()->warning(
					sprintf( 'Bounce webhook processing failed on attempt %d for provider: %s - %s', $attempt, $provider, $e->getMessage() ),
					array(
						'source'     => 'bounce-webhook',
						'provider'   => $provider,
						'request_id' => $request_id,
						'attempt'    => $attempt,
						'exception'  => $e->getMessage(),
					)
				);

				// Don't sleep on the last attempt
				if ( $attempt < $max_retries ) {
					// Exponential backoff: delay * (2 ^ (attempt - 1))
					$delay = $retry_delay * pow( 2, $attempt - 1 );
					sleep( $delay );
				}
			}
		}

		// All attempts failed, throw the last exception
		throw $last_exception;
	}

	/**
	 * Get client IP address
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	private function get_client_ip() {
		// Check for various headers that might contain the real IP
		$headers = array(
			'HTTP_CF_CONNECTING_IP',     // Cloudflare
			'HTTP_X_REAL_IP',           // Nginx
			'HTTP_X_FORWARDED_FOR',     // Load balancers/proxies
			'HTTP_X_FORWARDED',         // Proxies
			'HTTP_X_CLUSTER_CLIENT_IP', // Cluster
			'HTTP_FORWARDED_FOR',       // Proxies
			'HTTP_FORWARDED',           // Proxies
			'REMOTE_ADDR',              // Standard
		);

		foreach ( $headers as $header ) {
			if ( ! empty( $_SERVER[ $header ] ) ) {
				$ip = sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) );

				// Handle comma-separated IPs (X-Forwarded-For can contain multiple IPs)
				if ( strpos( $ip, ',' ) !== false ) {
					$ip = trim( explode( ',', $ip )[0] );
				}

				// Validate IP address
				if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
					return $ip;
				}
			}
		}

		return 'unknown';
	}

	/**
	 * Check rate limiting for webhook requests
	 *
	 * @since 1.0.0
	 *
	 * @param string $provider Provider name.
	 * @param string $ip Client IP address.
	 *
	 * @return bool True if request is allowed, false if rate limited.
	 */
	private function check_rate_limit( $provider, $ip ) {
		$rate_limit_enabled = apply_filters( 'quillcrm_bounce_webhook_rate_limit_enabled', true );

		if ( ! $rate_limit_enabled ) {
			return true;
		}

		$max_requests = apply_filters( 'quillcrm_bounce_webhook_rate_limit_max', 100 ); // requests per window
		$window_size  = apply_filters( 'quillcrm_bounce_webhook_rate_limit_window', 300 ); // 5 minutes in seconds

		$cache_key    = "quillcrm_bounce_rate_limit_{$provider}_{$ip}";
		$current_time = time();
		$window_start = $current_time - $window_size;

		// Get current request timestamps
		$requests = get_transient( $cache_key );
		if ( ! is_array( $requests ) ) {
			$requests = array();
		}

		// Remove old requests outside the window
		$requests = array_filter(
			$requests,
			function( $timestamp ) use ( $window_start ) {
				return $timestamp > $window_start;
			}
		);

		// Check if limit exceeded
		if ( count( $requests ) >= $max_requests ) {
			quillcrm_get_logger()->warning(
				'Rate limit exceeded for bounce webhook',
				array(
					'source'        => 'bounce-webhook',
					'provider'      => $provider,
					'ip'            => $ip,
					'request_count' => count( $requests ),
					'max_requests'  => $max_requests,
					'window_size'   => $window_size,
				)
			);

			return false;
		}

		// Add current request
		$requests[] = $current_time;

		// Store updated requests with expiration
		set_transient( $cache_key, $requests, $window_size + 60 );

		return true;
	}
}
