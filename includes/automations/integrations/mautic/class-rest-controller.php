<?php

/**
 * Class Mautic Rest Controller
 *
 * This class is responsible for handling the Mautic REST API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Mautic;

use QuillCRM\Abstracts\REST_Integration_Controller;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\User_Roles\Permissions;

/**
 * Mautic Rest Controller
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
			"/{$this->rest_base}/auth",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'auth_uri' ),
					'permission_callback' => array( $this, 'auth_uri_permissions_check' ),
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
				 'app' => array(
					 'type'       => 'object',
					 'context'    => array( 'view' ),
					 'properties' => array(
						 'base_url'      => array(
							 'label'    => __( 'Base URL', 'quillcrm' ),
							 'type'     => 'string',
							 'required' => true,
							 'context'  => array( 'view' ),
						 ),
						 'client_id'     => array(
							 'label'    => __( 'Client ID', 'quillcrm' ),
							 'type'     => 'string',
							 'required' => true,
							 'context'  => array( 'view' ),
						 ),
						 'client_secret' => array(
							 'label'    => __( 'Client Secret', 'quillcrm' ),
							 'type'     => 'string',
							 'required' => true,
							 'context'  => array(),
						 ),
					 ),
				 ),
			 ),
		 );
	}

	/**
	 * Get auth uri
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function auth_uri( $request ) {
		/** @var App $app */
		$app      = $this->integration->app;
		$auth_uri = $app->get_auth_uri();

		return new WP_REST_Response( array( 'auth_uri' => $auth_uri ) );
	}

	/**
	 * Auth uri permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function auth_uri_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
