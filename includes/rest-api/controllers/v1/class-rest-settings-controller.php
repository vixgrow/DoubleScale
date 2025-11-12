<?php

/**
 * REST_Settings_Controller class.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Settings;
use QuillCRM\User_Roles\Permissions;
use QuillCRM\Managers\Bounce_Handler_Manager;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;

/**
 * REST_Settings_Controller class.
 *
 * @since 1.0.0
 */
class REST_Settings_Controller extends REST_Controller {


	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'settings';

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
			"/{$this->rest_base}",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get' ),
					'permission_callback' => array( $this, 'get_permissions_check' ),
					'args'                => array(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update' ),
					'permission_callback' => array( $this, 'update_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/bounce-webhooks",
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_bounce_webhooks' ),
				'permission_callback' => array( $this, 'get_permissions_check' ),
				'args'                => array(
					'provider' => array(
						'description'       => __( 'Optional email provider slug to filter results (e.g., sendgrid, mailgun, postmark). If not provided, returns all providers.', 'quillcrm' ),
						'type'              => 'string',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $param ) {
							// Allow only lowercase alphanumeric and hyphens.
							return preg_match( '/^[a-z0-9-]+$/', $param );
						},
					),
				),
			)
		);
	}

	/**
	 * Retrieves schema, conforming to JSON Schema.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_schema() {
		$schema = array(
			'$schema'              => 'http://json-schema.org/draft-04/schema#',
			'title'                => 'settings',
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(
				'business'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'business_name'    => array(
							'type'    => 'string',
							'default' => '',
						),
						'business_address' => array(
							'type'    => 'string',
							'default' => '',
						),
					),
				),
				'email'           => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'from_name'     => array(
							'type'    => 'string',
							'default' => '',
						),
						'from_email'    => array(
							'type'    => 'string',
							'default' => '',
						),
						'reply_to'      => array(
							'type'    => 'string',
							'default' => get_option( 'admin_email' ),
						),
						'email_footer'  => array(
							'type'    => 'string',
							'default' => '',
						),
						'max_in_second' => array(
							'type'    => 'integer',
							'default' => 15,
						),
						'max_in_day'    => array(
							'type'    => 'integer',
							'default' => 10000,
						),
					),
				),
				'sms'             => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'max_in_second' => array(
							'type'    => 'integer',
							'default' => 10,
						),
						'max_in_day'    => array(
							'type'    => 'integer',
							'default' => 1000,
						),
					),
				),
				'double_optin'    => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'email_subject'         => array(
							'type'    => 'string',
							'default' => '',
						),
						'email_content'         => array(
							'type'    => 'string',
							'default' => '',
						),
						'after_confirmation'    => array(
							'type'    => 'string',
							'default' => 'message',
						),
						'confirmation_message'  => array(
							'type'    => 'string',
							'default' => '',
						),
						'confirmation_redirect' => array(
							'type'    => 'string',
							'default' => '',
						),
					),
				),
				'cart'            => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'enable_cart_tracking' => array(
							'type'    => 'boolean',
							'default' => false,
						),
						'wait_period'          => array(
							'type'    => 'integer',
							'default' => 1,
						),
						'cool_off_period'      => array(
							'type'    => 'integer',
							'default' => 15,
						),
						'lost_cart_days'       => array(
							'type'    => 'integer',
							'default' => 15,
						),
						'gdpr_compliance'      => array(
							'type'    => 'boolean',
							'default' => false,
						),
						'gdpr_message'         => array(
							'type'    => 'string',
							'default' => 'Your email and cart are saved so we can send you email reminders about this order. {{no_thanks text="No Thanks"}}',
						),
						'tags'                 => array(
							'type'    => 'array',
							'items'   => array(
								'type' => array( 'number', 'string' ),
							),
							'default' => array(),
						),
						'lists'                => array(
							'type'    => 'array',
							'items'   => array(
								'type' => array( 'number', 'string' ),
							),
							'default' => array(),
						),
						'lost_tags'            => array(
							'type'    => 'array',
							'items'   => array(
								'type' => array( 'number', 'string' ),
							),
							'default' => array(),
						),
						'lost_lists'           => array(
							'type'    => 'array',
							'items'   => array(
								'type' => array( 'number', 'string' ),
							),
							'default' => array(),
						),
					),
				),
				'currency'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'currency' => array(
							'type'    => 'string',
							'default' => 'USD',
						),
					),
				),
				'button_settings' => array(
					'type'                 => 'object',
					'additionalProperties' => true,
					'default'              => array(),
				),
			),
		);
		return $schema;
	}

	/**
	 * Retrieves settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get( $request ) 	{ // phpcs:ignore
		$settings = Settings::get_all();

		$result = array();
		foreach ( $this->get_schema()['properties'] as $group_key => $group_schema ) {
			if ( $group_key === 'button_settings' ) {
				// Handle button_settings specially since it's not a structured schema
				$result[ $group_key ] = $settings[ $group_key ] ?? $group_schema['default'];
			} else {
				$result[ $group_key ] = array();
				foreach ( $group_schema['properties'] as $setting_key => $setting_schema ) {
					$result[ $group_key ][ $setting_key ] = $settings[ $group_key ][ $setting_key ] ?? $setting_schema['default'];
				}
			}
		}

		return new WP_REST_Response( $result, 200 );
	}



	/**
	 * Updates settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update( $request ) {
		$settings = $request->get_json_params();

		// Validate and sanitize settings
		$validation_result = $this->validate_settings( $settings );
		if ( is_wp_error( $validation_result ) ) {
			return $validation_result;
		}

		// Sanitize settings
		$settings = $this->sanitize_settings( $settings );

		Settings::update_many( $settings );
		return new WP_REST_Response( array( 'success' => true ), 200 );
	}

	/**
	 * Validate settings before saving
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings Settings to validate.
	 * @return true|WP_Error True if valid, WP_Error otherwise.
	 */
	private function validate_settings( $settings ) {
		// Validate email settings
		if ( isset( $settings['email'] ) ) {
			$email_validation = $this->validate_email_settings( $settings['email'] );
			if ( is_wp_error( $email_validation ) ) {
				return $email_validation;
			}
		}

		// Validate SMS settings
		if ( isset( $settings['sms'] ) ) {
			$sms_validation = $this->validate_sms_settings( $settings['sms'] );
			if ( is_wp_error( $sms_validation ) ) {
				return $sms_validation;
			}
		}

		return true;
	}

	/**
	 * Validate email settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $email Email settings.
	 * @return true|WP_Error True if valid, WP_Error otherwise.
	 */
	private function validate_email_settings( $email ) {
		// Validate from_email
		if ( isset( $email['from_email'] ) && ! empty( $email['from_email'] ) ) {
			if ( ! is_email( $email['from_email'] ) ) {
				return new WP_Error(
					'invalid_email',
					__( 'From email is not a valid email address', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}
		}

		// Validate reply_to
		if ( isset( $email['reply_to'] ) && ! empty( $email['reply_to'] ) ) {
			if ( ! is_email( $email['reply_to'] ) ) {
				return new WP_Error(
					'invalid_email',
					__( 'Reply-to is not a valid email address', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}
		}

		// Validate max_in_second
		if ( isset( $email['max_in_second'] ) ) {
			$max_in_second = intval( $email['max_in_second'] );

			if ( $max_in_second < 1 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max emails per second must be at least 1', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			if ( $max_in_second > 100 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max emails per second cannot exceed 100 (server limitation)', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}
		}

		// Validate max_in_day
		if ( isset( $email['max_in_day'] ) ) {
			$max_in_day = intval( $email['max_in_day'] );

			if ( $max_in_day < 1 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max emails per day must be at least 1', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			if ( $max_in_day > 1000000 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max emails per day cannot exceed 1,000,000', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Validate SMS settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $sms SMS settings.
	 * @return true|WP_Error True if valid, WP_Error otherwise.
	 */
	private function validate_sms_settings( $sms ) {
		// Validate max_in_second
		if ( isset( $sms['max_in_second'] ) ) {
			$max_in_second = intval( $sms['max_in_second'] );

			if ( $max_in_second < 1 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max SMS per second must be at least 1', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			if ( $max_in_second > 10 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max SMS per second cannot exceed 10 (Twilio account limit)', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}
		}

		// Validate max_in_day
		if ( isset( $sms['max_in_day'] ) ) {
			$max_in_day = intval( $sms['max_in_day'] );

			if ( $max_in_day < 1 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max SMS per day must be at least 1', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			if ( $max_in_day > 100000 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max SMS per day cannot exceed 100,000', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Sanitize settings recursively
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings Settings to sanitize.
	 * @return array Sanitized settings.
	 */
	private function sanitize_settings( $settings ) {
		$sanitized = array();

		foreach ( $settings as $key => $value ) {
			if ( is_array( $value ) ) {
				$sanitized[ $key ] = $this->sanitize_settings( $value );
			} elseif ( is_string( $value ) ) {
				// Special handling for email_footer and email_content (allow HTML)
				if ( in_array( $key, array( 'email_footer', 'email_content', 'confirmation_message', 'gdpr_message' ), true ) ) {
					$sanitized[ $key ] = wp_kses_post( $value );
				} else {
					$sanitized[ $key ] = sanitize_text_field( $value );
				}
			} elseif ( is_numeric( $value ) ) {
				$sanitized[ $key ] = absint( $value );
			} elseif ( is_bool( $value ) ) {
				$sanitized[ $key ] = (bool) $value;
			} else {
				$sanitized[ $key ] = $value;
			}
		}

		return $sanitized;
	}

	/**
	 * Checks if a given request has access to update settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function update_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Checks if a given request has access to get settings.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Get bounce webhook URLs.
	 *
	 * Retrieves bounce webhook URLs for email providers. If a provider parameter
	 * is specified, returns only that provider's webhook URL. Otherwise, returns
	 * all available provider webhook URLs.
	 *
	 * These URLs can be used to configure webhooks in email service providers
	 * (SendGrid, Mailgun, Postmark, etc.) to automatically handle email bounces.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object with bounce webhook URLs or error.
	 */
	public function get_bounce_webhooks( $request ) {
		$manager  = Bounce_Handler_Manager::instance();
		$urls     = $manager->get_webhook_urls();
		$provider = $request->get_param( 'provider' );

		// If no provider specified, return all webhooks.
		if ( empty( $provider ) ) {
			return new WP_REST_Response( $urls, 200 );
		}

		// Provider specified - validate and return single webhook.
		if ( ! isset( $urls[ $provider ] ) ) {
			return new WP_Error(
				'invalid_provider',
				sprintf(
					/* translators: 1: provider slug, 2: available providers */
					__( 'Provider "%1$s" not found. Available providers: %2$s', 'quillcrm' ),
					$provider,
					implode( ', ', array_keys( $urls ) )
				),
				array( 'status' => 404 )
			);
		}

		// Return single provider webhook.
		return new WP_REST_Response(
			array(
				'provider' => $provider,
				'name'     => $urls[ $provider ]['name'],
				'url'      => $urls[ $provider ]['url'],
			),
			200
		);
	}
}
