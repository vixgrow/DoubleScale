<?php

/**
 * REST Email Builder Controller
 *
 * Handles all REST API endpoints for the email builder system
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage REST_API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Emails\Email_Renderer;
use QuillCRM\Emails\Block_Registry;
use QuillCRM\Models\Template_Model;
use QuillCRM\User_Roles\Permissions;

/**
 * REST Email Builder Controller class
 */
class REST_Email_Builder_Controller extends REST_Controller {


	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'email-builder';

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		 // Email templates endpoints
		register_rest_route(
			$this->namespace,
			'/email-templates',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_templates' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_template' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/email-templates/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_template' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_template' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_template' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/email-templates/(?P<id>\d+)/render',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'render_template' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
			)
		);

		// Email blocks endpoint
		register_rest_route(
			$this->namespace,
			'/email-blocks',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_blocks' ),
					'permission_callback' => array( $this, 'check_permissions' ),
				),
			)
		);
	}



	/**
	 * Get templates
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response Response object
	 */
	public function get_templates( $request ) {
		// Get parameters
		$type     = $request->get_param( 'type' ) ?: 'email';
		$per_page = (int) ( $request->get_param( 'per_page' ) ?: 20 );
		$page     = (int) ( $request->get_param( 'page' ) ?: 1 );
		$orderby  = $request->get_param( 'orderby' ) ?: 'id';
		$order    = $request->get_param( 'order' ) ?: 'DESC';
		$search   = $request->get_param( 'search' );
		$category = $request->get_param( 'category' );

		// Start building the query
		$query = Template_Model::where( 'type', $type );

		// Add conditional filters
		if ( $request->has_param( 'hidden' ) ) {
			$query->where( 'hidden', (int) $request->get_param( 'hidden' ) );
		}

		if ( $request->has_param( 'is_pro' ) ) {
			$query->where( 'is_pro', (int) $request->get_param( 'is_pro' ) );
		}

		if ( $category ) {
			$query->where( 'category', $category );
		}

		if ( $search ) {
			$query->where( 'name', 'LIKE', '%' . $search . '%' );
		}

		// Get total count for pagination
		$total = $query->count();

		// Get paginated results with ordering
		$templates = $query->orderBy( $orderby, $order )
			->offset( ( $page - 1 ) * $per_page )
			->limit( $per_page )
			->get();

		return rest_ensure_response(
			array(
				'templates' => $templates,
				'total'     => (int) $total,
				'pages'     => ceil( $total / $per_page ),
			)
		);
	}

	/**
	 * Get a specific template
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error Response object
	 */
	public function get_template( $request ) {
		$template_id = (int) $request->get_param( 'id' );
		$template    = Template_Model::find( $template_id );

		if ( ! $template ) {
			return new WP_Error(
				'template_not_found',
				__( 'Template not found', 'quillcrm' ),
				array( 'status' => 404 )
			);
		}

		// Add parsed JSON fields for backward compatibility
		if ( $template->body ) {
			$template->parsed_body = json_decode( $template->body );
		}

		if ( $template->settings ) {
			// If settings is already an array (thanks to model casts), encode and decode it
			// to ensure consistency with the previous API response format
			$settings_json             = is_array( $template->settings ) ? wp_json_encode( $template->settings ) : $template->settings;
			$template->parsed_settings = json_decode( $settings_json );
		}

		return rest_ensure_response( $template );
	}

	/**
	 * Create a template
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error Response object
	 */
	public function create_template( $request ) {
		$data = $request->get_json_params();

		// Set defaults
		$defaults = array(
			'name'         => '',
			'type'         => 'email',
			'subject'      => '',
			'body'         => '{}',
			'settings'     => '{}',
			'hidden'       => 1,
			'preview_text' => '',
			'thumbnail'    => '',
			'category'     => 'general',
			'is_pro'       => 0,
			'created_by'   => get_current_user_id(),
		);

		$data = wp_parse_args( $data, $defaults );

		try {
			// Create a new template using the model
			$template = new Template_Model();
			$template->fill( $data );
			$template->save();

			if ( ! $template->id ) {
				return new WP_Error(
					'template_creation_failed',
					__( 'Failed to create template', 'quillcrm' ),
					array( 'status' => 500 )
				);
			}

			// Add parsed fields for consistency with old API
			if ( $template->body ) {
				$template->parsed_body = json_decode( $template->body );
			}

			if ( $template->settings ) {
				$settings_json             = is_array( $template->settings ) ? wp_json_encode( $template->settings ) : $template->settings;
				$template->parsed_settings = json_decode( $settings_json );
			}

			return rest_ensure_response( $template );
		} catch ( \Exception $e ) {
			return new WP_Error(
				'template_creation_failed',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Update a template
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error Response object
	 */
	public function update_template( $request ) {
		$template_id = (int) $request->get_param( 'id' );
		$data        = $request->get_json_params();

		// Find the template using the model
		$template = Template_Model::find( $template_id );

		if ( ! $template ) {
			return new WP_Error(
				'template_not_found',
				__( 'Template not found', 'quillcrm' ),
				array( 'status' => 404 )
			);
		}

		try {
			// Update the template with the provided data
			$template->fill( $data );
			$template->save();

			// Refresh the template from the database
			$template->refresh();

			// Add parsed fields for consistency with old API
			if ( $template->body ) {
				$template->parsed_body = json_decode( $template->body );
			}

			if ( $template->settings ) {
				$settings_json             = is_array( $template->settings ) ? wp_json_encode( $template->settings ) : $template->settings;
				$template->parsed_settings = json_decode( $settings_json );
			}

			return rest_ensure_response( $template );
		} catch ( \Exception $e ) {
			return new WP_Error(
				'template_update_failed',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Delete a template
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error Response object
	 */
	public function delete_template( $request ) {
		$template_id = (int) $request->get_param( 'id' );

		// Find the template using the model
		$template = Template_Model::find( $template_id );

		if ( ! $template ) {
			return new WP_Error(
				'template_not_found',
				__( 'Template not found', 'quillcrm' ),
				array( 'status' => 404 )
			);
		}

		// Store template data before deletion
		$previous_template = clone $template;

		try {
			// Delete the template
			$deleted = $template->delete();

			if ( ! $deleted ) {
				return new WP_Error(
					'template_deletion_failed',
					__( 'Failed to delete template', 'quillcrm' ),
					array( 'status' => 500 )
				);
			}

			return rest_ensure_response(
				array(
					'deleted'  => true,
					'previous' => $previous_template,
				)
			);
		} catch ( \Exception $e ) {
			return new WP_Error(
				'template_deletion_failed',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Render a template
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error Response object
	 */
	public function render_template( $request ) {
		$template_id = (int) $request->get_param( 'id' );
		$merge_tags  = $request->get_param( 'merge_tags' ) ?: array();

		$renderer = new Email_Renderer();
		$html     = $renderer->render_template( $template_id, $merge_tags );

		if ( empty( $html ) ) {
			return new WP_Error(
				'rendering_failed',
				__( 'Failed to render template', 'quillcrm' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'html' => $html,
			)
		);
	}

	/**
	 * Get available blocks
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response Response object
	 */
	public function get_blocks( $request ) {
		$registry = Block_Registry::instance();
		$blocks   = $registry->get_blocks();

		$response = array();
		foreach ( $blocks as $block ) {
			$response[] = array(
				'type'         => $block->get_type(),
				'name'         => $block->get_name(),
				'defaultProps' => $block->get_default_props(),
			);
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Check permissions for REST API
	 *
	 * @return bool
	 */
	public function check_permissions() {
		return Permissions::has_crm_manager_access();
	}
}
