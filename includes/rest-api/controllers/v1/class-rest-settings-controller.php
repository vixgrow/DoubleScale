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
		Settings::update_many( $settings );
		return new WP_REST_Response( array( 'success' => true ), 200 );
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
}
