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
use QuillCRM\Services\Campaign_Rate_Limiter;

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

		// Cron status endpoint
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/cron-status",
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_cron_status' ),
				'permission_callback' => array( $this, 'get_permissions_check' ),
			)
		);

		// Run cron manually endpoint
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/run-cron",
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'run_cron_manually' ),
				'permission_callback' => array( $this, 'update_permissions_check' ),
				'args'                => array(
					'hook' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $param ) {
							return is_string( $param ) && ! empty( $param );
						},
					),
				),
			)
		);

		// Note: Bounce webhooks endpoint moved to Pro plugin (REST_Settings_Controller_Pro)
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
						'business_logo'    => array(
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
							'default' => Settings::get_default_email_footer(),
						),
						'max_in_second' => array(
							'type'    => 'integer',
							'default' => Campaign_Rate_Limiter::instance()->get_default_per_second_limit( 'email' ),
						),
						'max_in_day'    => array(
							'type'    => 'integer',
							'default' => Campaign_Rate_Limiter::instance()->get_default_daily_limit( 'email' ),
						),
					),
				),
				'sms'             => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'max_in_second' => array(
							'type'    => 'integer',
							'default' => Campaign_Rate_Limiter::instance()->get_default_per_second_limit( 'sms' ),
						),
					),
				),
				'whatsapp'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'max_in_second' => array(
							'type'    => 'integer',
							'default' => Campaign_Rate_Limiter::instance()->get_default_per_second_limit( 'whatsapp' ),
						),
					),
				),
				'double_optin'    => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'email_subject'         => array(
							'type'    => 'string',
							'default' => Settings::get_default_opt_in_subject(),
						),
						'email_content'         => array(
							'type'    => 'string',
							'default' => Settings::get_default_opt_in_content(),
						),
						'after_confirmation'    => array(
							'type'    => 'string',
							'default' => 'message',
						),
						'confirmation_message'  => array(
							'type'    => 'string',
							'default' => Settings::get_default_confirmation_message(),
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
				'debugging'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'properties'           => array(
						'log_level' => array(
							'type'    => 'string',
							'default' => 'error',
							'enum'    => array( 'error', 'error,debug', 'error,debug,info' ),
						),
					),
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
				// Handle button_settings specially since it's not a structured schema.
				$result[ $group_key ] = $settings[ $group_key ] ?? $group_schema['default'];
			} else {
				$result[ $group_key ] = array();
				foreach ( $group_schema['properties'] as $setting_key => $setting_schema ) {
					$saved_value = $settings[ $group_key ][ $setting_key ] ?? null;
					// Use default if value is null, empty string, or empty editor content (for string types).
					if ( null === $saved_value || ( 'string' === $setting_schema['type'] && $this->is_empty_value( $saved_value ) ) ) {
						$result[ $group_key ][ $setting_key ] = $setting_schema['default'];
					} else {
						$result[ $group_key ][ $setting_key ] = $saved_value;
					}
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

		// Collect warnings (non-blocking validation issues)
		$warnings = $this->collect_warnings( $settings );

		// Sanitize settings
		$settings = $this->sanitize_settings( $settings );

		Settings::update_many( $settings );

		$response = array( 'success' => true );
		if ( ! empty( $warnings ) ) {
			$response['warnings'] = $warnings;
		}

		return new WP_REST_Response( $response, 200 );
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

		// Validate WhatsApp settings
		if ( isset( $settings['whatsapp'] ) ) {
			$whatsapp_validation = $this->validate_whatsapp_settings( $settings['whatsapp'] );
			if ( is_wp_error( $whatsapp_validation ) ) {
				return $whatsapp_validation;
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
			// Note: QuillSMTP connection validation moved to collect_warnings() for non-blocking behavior
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

			// if ( $max_in_second > 100 ) {
			// 	return new WP_Error(
			// 		'invalid_rate_limit',
			// 		__( 'Max emails per second cannot exceed 100 (server limitation)', 'quillcrm' ),
			// 		array( 'status' => 400 )
			// 	);
			// }
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
	 * Collect warnings for settings (non-blocking validation issues)
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings Settings to check.
	 * @return array Array of warning messages.
	 */
	private function collect_warnings( $settings ) {
		$warnings = array();

		// Check QuillSMTP connection for from_email
		if ( isset( $settings['email']['from_email'] ) && ! empty( $settings['email']['from_email'] ) ) {
			$email_warning = $this->check_quillsmtp_connection( $settings['email']['from_email'] );
			if ( $email_warning ) {
				$warnings[] = $email_warning;
			}
		}

		return $warnings;
	}

	/**
	 * Check QuillSMTP connection for an email address (non-blocking)
	 *
	 * @since 1.0.0
	 *
	 * @param string $email Email address to check.
	 * @return string|null Warning message if there's an issue, null otherwise.
	 */
	private function check_quillsmtp_connection( $email ) {
		// Check if QuillSMTP is available
		if ( ! class_exists( '\QuillSMTP\Settings' ) ) {
			return __( 'Warning: QuillSMTP plugin is not active. Emails may not be sent properly. Please install and activate QuillSMTP to ensure reliable email delivery.', 'quillcrm' );
		}

		// Check if the email has a connection configured
		$connection_id = \QuillSMTP\Settings::get_connection_by_from_email( $email );

		if ( empty( $connection_id ) ) {
			return sprintf(
				/* translators: %s: email address */
				__( 'Warning: No QuillSMTP connection configured for: %s. Emails may not be sent properly. Please configure an SMTP connection in QuillSMTP settings for reliable email delivery.', 'quillcrm' ),
				$email
			);
		}

		return null;
	}

	/**
	 * Validate SMS settings
	 *
	 * @since 1.0.0
	 *
	 * @param array &$sms SMS settings (passed by reference to allow cleanup).
	 * @return true|WP_Error True if valid, WP_Error otherwise.
	 */
	private function validate_sms_settings( &$sms ) {
		// Remove max_in_day if present (legacy field, not enforced)
		// SMS providers (Twilio, etc.) enforce their own account quotas
		if ( isset( $sms['max_in_day'] ) ) {
			unset( $sms['max_in_day'] );
		}

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
					__( 'Max SMS per second cannot exceed 10 (provider API limit)', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Validate WhatsApp settings
	 *
	 * @since 1.0.0
	 *
	 * @param array &$whatsapp WhatsApp settings (passed by reference to allow cleanup).
	 * @return true|WP_Error
	 */
	private function validate_whatsapp_settings( &$whatsapp ) {
		// Remove max_in_day if present (legacy field, not enforced)
		// Meta WhatsApp enforces tier-based quotas (1K/10K/100K/unlimited per 24h)
		if ( isset( $whatsapp['max_in_day'] ) ) {
			unset( $whatsapp['max_in_day'] );
		}

		// Validate max_in_second is within acceptable range (1-10)
		if ( isset( $whatsapp['max_in_second'] ) ) {
			$max_in_second = intval( $whatsapp['max_in_second'] );

			if ( $max_in_second > 10 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max WhatsApp per second cannot exceed 10 (provider API limit)', 'quillcrm' ),
					array(
						'status' => 400,
					)
				);
			}

			if ( $max_in_second < 1 ) {
				return new WP_Error(
					'invalid_rate_limit',
					__( 'Max WhatsApp per second must be at least 1', 'quillcrm' ),
					array(
						'status' => 400,
					)
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
	 * Note: get_bounce_webhooks() method removed - functionality moved to Pro plugin
	 * See: QuillCRM_Pro\REST_API\Controllers\V1\REST_Settings_Controller_Pro
	 */

	/**
	 * Check if a value is considered empty
	 *
	 * This checks for empty strings and also for empty editor content like
	 * '<p class="editor-paragraph"><br></p>' which is the default empty state
	 * from the Lexical editor component.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $value The value to check.
	 * @return bool True if value is empty, false otherwise.
	 */
	private function is_empty_value( $value ) {
		// Check for empty string.
		if ( '' === $value ) {
			return true;
		}

		// Check for empty editor content (Lexical editor's empty state).
		$trimmed = trim( $value );
		if ( '<p class="editor-paragraph"><br></p>' === $trimmed ) {
			return true;
		}

		// Check for other common empty HTML patterns.
		$stripped = trim( strip_tags( $value ) );
		if ( '' === $stripped ) {
			return true;
		}

		return false;
	}

	/**
	 * Get cron job status
	 *
	 * Returns status information about all scheduled cron jobs including
	 * last run time, next scheduled time, and server configuration.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_cron_status( $request ) {
		$events = array();

		// Email campaigns (every 60 seconds).
		$campaigns_tasks = \QuillCRM\QuillCRM::instance()->campaigns_tasks;
		$email_heartbeat = $campaigns_tasks->get_heartbeat_status( 'quillcrm_email_campaigns' );

		$last_run = $email_heartbeat['last_run'] ?? null;

		// Calculate next_scheduled on-the-fly.
		if ( $last_run ) {
			$next_run = strtotime( $last_run ) + 60;
		} else {
			$next_run = as_next_scheduled_action( 'quillcrm_campaigns_quillcrm_email_campaigns' );
		}

		if ( ! $next_run || true === $next_run ) {
			$next_run = time() + 60;
		}

		$events[] = array(
			'hook'       => 'quillcrm_campaigns_quillcrm_email_campaigns',
			'is_overdue' => $this->is_task_overdue( $last_run, 90 ), // 90 seconds threshold.
			'human_name' => __( 'Scheduled Email Sending Tasks', 'quillcrm' ),
			'next_run'   => $next_run ? human_time_diff( $next_run, time() ) : __( 'Unknown', 'quillcrm' ),
			'last_run'   => $last_run ? human_time_diff( strtotime( $last_run ), time() ) . ' ' . __( 'ago', 'quillcrm' ) : __( 'Never', 'quillcrm' ),
			'interval'   => 60,
		);

		// SMS campaigns (every 60 seconds) - Pro only.
		if ( class_exists( 'QuillCRM_Pro\QuillCRM_Pro' ) ) {
			$sms_heartbeat = $campaigns_tasks->get_heartbeat_status( 'quillcrm_sms_campaigns' );
			$last_run      = $sms_heartbeat['last_run'] ?? null;

			// Calculate next_scheduled on-the-fly.
			if ( $last_run ) {
				$next_run = strtotime( $last_run ) + 60;
			} else {
				$next_run = as_next_scheduled_action( 'quillcrm_campaigns_quillcrm_sms_campaigns' );
			}

			if ( ! $next_run || true === $next_run ) {
				$next_run = time() + 60;
			}

			$events[] = array(
				'hook'       => 'quillcrm_campaigns_quillcrm_sms_campaigns',
				'is_overdue' => $this->is_task_overdue( $last_run, 90 ),
				'human_name' => __( 'Scheduled SMS Sending Tasks', 'quillcrm' ),
				'next_run'   => $next_run ? human_time_diff( $next_run, time() ) : __( 'Unknown', 'quillcrm' ),
				'last_run'   => $last_run ? human_time_diff( strtotime( $last_run ), time() ) . ' ' . __( 'ago', 'quillcrm' ) : __( 'Never', 'quillcrm' ),
				'interval'   => 60,
			);
		}

		// Email sequences - Not shipping in this version.
		// $sequences_heartbeat = $campaigns_tasks->get_heartbeat_status( 'quillcrm_email_sequences' );
		// $next_run = isset( $sequences_heartbeat['next_scheduled'] ) ? strtotime( $sequences_heartbeat['next_scheduled'] ) : time() + 60;
		// $last_run = $sequences_heartbeat['last_run'] ?? null;
		//
		// $events[] = array(
		// 'hook'       => 'quillcrm_campaigns_quillcrm_email_sequences',
		// 'is_overdue' => $this->is_task_overdue( $last_run, 90 ),
		// 'human_name' => __( 'Scheduled Email Processing', 'quillcrm' ),
		// 'next_run'   => $next_run ? human_time_diff( $next_run, time() ) : __( 'Unknown', 'quillcrm' ),
		// 'last_run'   => $last_run ? human_time_diff( strtotime( $last_run ), time() ) . ' ' . __( 'ago', 'quillcrm' ) : __( 'Never', 'quillcrm' ),
		// 'interval'   => 60,
		// 'run_count'  => $sequences_heartbeat['run_count'] ?? 0,
		// );

		// WhatsApp campaigns - Not shipping in this version.
		// if ( class_exists( 'QuillCRM_Pro\QuillCRM_Pro' ) ) {
		// $whatsapp_heartbeat = $campaigns_tasks->get_heartbeat_status( 'quillcrm_whatsapp_campaigns' );
		// $next_run = isset( $whatsapp_heartbeat['next_scheduled'] ) ? strtotime( $whatsapp_heartbeat['next_scheduled'] ) : time() + 60;
		// $last_run = $whatsapp_heartbeat['last_run'] ?? null;
		//
		// $events[] = array(
		// 'hook'       => 'quillcrm_campaigns_quillcrm_whatsapp_campaigns',
		// 'is_overdue' => $this->is_task_overdue( $last_run, 90 ),
		// 'human_name' => __( 'Scheduled WhatsApp Sending Tasks', 'quillcrm' ),
		// 'next_run'   => $next_run ? human_time_diff( $next_run, time() ) : __( 'Unknown', 'quillcrm' ),
		// 'last_run'   => $last_run ? human_time_diff( strtotime( $last_run ), time() ) . ' ' . __( 'ago', 'quillcrm' ) : __( 'Never', 'quillcrm' ),
		// 'interval'   => 60,
		// 'run_count'  => $whatsapp_heartbeat['run_count'] ?? 0,
		// );
		// }

		// Daily tasks.
		$daily_tasks      = \QuillCRM\QuillCRM::instance()->daily_tasks;
		$daily3_heartbeat = $daily_tasks->get_heartbeat_status( 'quillcrm_daily3' );
		$last_run         = $daily3_heartbeat['last_run'] ?? null;

		// Calculate next_scheduled on-the-fly.
		if ( $last_run ) {
			$next_run = strtotime( $last_run ) + DAY_IN_SECONDS;
		} else {
			$next_run = as_next_scheduled_action( 'quillcrm_daily_quillcrm_daily3' );
		}

		if ( ! $next_run || true === $next_run ) {
			$next_run = time() + DAY_IN_SECONDS;
		}

		$events[] = array(
			'hook'       => 'quillcrm_daily_quillcrm_daily3',
			'is_overdue' => $this->is_task_overdue( $last_run, 90000 ), // ~25 hours threshold.
			'human_name' => __( 'Scheduled Automation Tasks', 'quillcrm' ),
			'next_run'   => $next_run ? human_time_diff( $next_run, time() ) : __( 'Unknown', 'quillcrm' ),
			'last_run'   => $last_run ? human_time_diff( strtotime( $last_run ), time() ) . ' ' . __( 'ago', 'quillcrm' ) : __( 'Never', 'quillcrm' ),
			'interval'   => DAY_IN_SECONDS,
		);

		// Server information
		$memory_limit  = $this->get_memory_limit_in_mb();
		$memory_usage  = memory_get_usage( true ) / 1024 / 1024;
		$usage_percent = ( $memory_usage / $memory_limit ) * 100;

		$has_server_cron = defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON;
		$site_url        = site_url();
		$cron_url        = add_query_arg( 'doing_wp_cron', '', $site_url . '/wp-cron.php' );

		return new WP_REST_Response(
			array(
				'cron_events' => $events,
				'server'      => array(
					'memory_limit'       => $memory_limit . 'MB',
					'usage_percent'      => round( $usage_percent, 2 ),
					'max_execution_time' => ini_get( 'max_execution_time' ) . ' seconds',
					'has_server_cron'    => $has_server_cron,
					'cron_url'           => $cron_url,
					'site_path'          => ABSPATH,
				),
			),
			200
		);
	}

	/**
	 * Check if task is overdue
	 *
	 * @since 1.0.0
	 *
	 * @param string|null $last_run Last run timestamp.
	 * @param int         $threshold Seconds threshold.
	 * @return bool
	 */
	private function is_task_overdue( $last_run, $threshold ) {
		if ( ! $last_run ) {
			return false; // Never ran, not overdue yet
		}

		$last_run_timestamp = strtotime( $last_run );
		if ( ! $last_run_timestamp ) {
			return false; // Invalid datetime format
		}

		$time_since_last_run = time() - $last_run_timestamp;

		return $time_since_last_run > $threshold;
	}

	/**
	 * Get memory limit in MB
	 *
	 * @since 1.0.0
	 *
	 * @return int Memory limit in megabytes.
	 */
	private function get_memory_limit_in_mb() {
		$memory_limit = ini_get( 'memory_limit' );

		if ( preg_match( '/^(\d+)(.)$/', $memory_limit, $matches ) ) {
			if ( 'G' === $matches[2] ) {
				return $matches[1] * 1024;
			} elseif ( 'M' === $matches[2] ) {
				return $matches[1];
			} elseif ( 'K' === $matches[2] ) {
				return $matches[1] / 1024;
			}
		}

		return 128; // Default fallback
	}

	/**
	 * Manually run a cron job
	 *
	 * Triggers a scheduled task immediately for debugging or manual execution.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function run_cron_manually( $request ) {
		$hook = $request->get_param( 'hook' );

		// Whitelist of allowed hooks.
		$valid_hooks = array(
			'quillcrm_campaigns_quillcrm_email_campaigns' => __( 'Scheduled Email Sending Tasks', 'quillcrm' ),
			'quillcrm_daily_quillcrm_daily3'              => __( 'Scheduled Automation Tasks', 'quillcrm' ),
			'quillcrm_daily_quillcrm_daily4'              => __( 'Daily Cleanup Tasks', 'quillcrm' ),
		);

		// Add Pro hooks if Pro plugin is active.
		if ( class_exists( 'QuillCRM_Pro\QuillCRM_Pro' ) ) {
			$valid_hooks['quillcrm_campaigns_quillcrm_sms_campaigns'] = __( 'Scheduled SMS Sending Tasks', 'quillcrm' );
			// WhatsApp not shipping in this version.
			// $valid_hooks['quillcrm_campaigns_quillcrm_whatsapp_campaigns'] = __( 'Scheduled WhatsApp Sending Tasks', 'quillcrm' );
		}

		// Email sequences not shipping in this version.
		// $valid_hooks['quillcrm_campaigns_quillcrm_email_sequences'] = __( 'Scheduled Email Processing', 'quillcrm' );

		if ( ! isset( $valid_hooks[ $hook ] ) ) {
			return new WP_Error(
				'invalid_hook',
				__( 'The provided hook name is not valid', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		// Trigger the action immediately
		try {
			do_action( $hook );
		} catch ( \Exception $e ) {
			return new WP_Error(
				'cron_execution_failed',
				sprintf(
					/* translators: %s: error message */
					__( 'Failed to run task: %s', 'quillcrm' ),
					$e->getMessage()
				),
				array( 'status' => 500 )
			);
		} catch ( \Throwable $e ) {
			// Catch PHP 7+ errors as well
			return new WP_Error(
				'cron_execution_failed',
				sprintf(
					/* translators: %s: error message */
					__( 'Failed to run task: %s', 'quillcrm' ),
					$e->getMessage()
				),
				array( 'status' => 500 )
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => sprintf(
					/* translators: %s: task name */
					__( 'Successfully ran %s', 'quillcrm' ),
					$valid_hooks[ $hook ]
				),
			),
			200
		);
	}
}
