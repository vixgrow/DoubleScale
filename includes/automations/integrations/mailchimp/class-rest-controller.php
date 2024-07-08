<?php
/**
 * Class Mailchimp Rest Controller
 *
 * This class is responsible for handling the Mailchimp REST API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Mailchimp;

use QuillCRM\Abstracts\REST_Integration_Controller;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Mailchimp Rest Controller
 */
class REST_Controller extends REST_Integration_Controller {

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/list",
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_list' ),
					'permission_callback' => array( $this, 'update_list_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Get settings schema
	 *
	 * @return array
	 */
	public function get_settings_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'api_key' => array(
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'list_id' => array(
					'type'        => 'string',
					'required'    => false,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			),
		);
	}

	/**
	 * Update list
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function update_list( $request ) {
		$list_id = $request->get_param( 'list_id' );
		if ( empty( $list_id ) ) {
			return new WP_Error( 'invalid_list_id', __( 'List ID is required.', 'quillcrm' ) );
		}

		$this->integration->update_setting( 'list_id', $list_id );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'List ID updated.', 'quillcrm' ),
			),
		);
	}

	/**
	 * Update list permissions check
	 *
	 * @param WP_REST_Request $request Request.
	 * @return bool|WP_Error
	 */
	public function update_list_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
