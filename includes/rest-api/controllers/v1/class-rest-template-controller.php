<?php

/**
 * Class REST_Template_Controller
 * This class is responsible for handling the rest api requests for templates
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Models\Campaign_Model;
use QuillCRM\User_Roles\Permissions;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Template_Model;
use QuillCRM\Emails\Email_Renderer;
use QuillCRM\Emails\Block_Registry;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Constants\Campaign_Channel;

/**
 * REST_Template_Controller class
 */
class REST_Template_Controller extends REST_Controller {


	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'templates';

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Smart save endpoint - creates or updates based on usage
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/save',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_template' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
			)
		);

		// Register endpoint for rendering templates (merged from email-builder controller)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/render',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'render_template' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'merge_tags' => array(
							'description' => __( 'Merge tags to use in the template', 'quillcrm' ),
							'type'        => 'object',
							'default'     => array(),
						),
					),
				),
			)
		);

		// Register endpoint for getting user templates (non-hidden)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/user-templates',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_user_templates' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'type'   => array(
							'description' => __( 'Filter by template type.', 'quillcrm' ),
							'type'        => 'string',
							'default'     => Campaign_Channel::STR_EMAIL,
							'enum'        => Campaign_Channel::get_core_channel_strings(),
						),
						'search' => array(
							'description'       => __( 'Search templates by name.', 'quillcrm' ),
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		// Register endpoint for getting email blocks (merged from email-builder controller)
		register_rest_route(
			$this->namespace,
			'/email-blocks',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_blocks' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Schema for the template
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The template schema
	 */
	public function get_item_schema() {
		 return array(
			 '$schema'    => 'http://json-schema.org/draft-04/schema#',
			 'title'      => 'template',
			 'type'       => 'object',
			 'properties' => array(
				 'id'         => array(
					 'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					 'type'        => 'integer',
					 'readonly'    => true,
				 ),
				 'name'       => array(
					 'description' => __( 'Name of the template.', 'quillcrm' ),
					 'type'        => 'string',
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'type'       => array(
					 'description' => __( 'Type of the template.', 'quillcrm' ),
					 'type'        => 'string',
					 'enum'        => Campaign_Channel::get_core_channel_strings(),
				 ),
				 'subject'    => array(
					 'description' => __( 'Subject of the template.', 'quillcrm' ),
					 'type'        => 'string',
					 'required'    => false,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'body'       => array(
					 'description' => __( 'Body of the template.', 'quillcrm' ),
					 'type'        => 'string',
					 'required'    => false,
				 ),
				 'settings'   => array(
					 'description' => __( 'Settings of the template.', 'quillcrm' ),
					 'type'        => array( 'object', 'null' ),
				 ),
				 'created_at' => array(
					 'description' => __( 'Creation time of the template.', 'quillcrm' ),
					 'type'        => 'string',
					 'readonly'    => false,
				 ),
				 'updated_at' => array(
					 'description' => __( 'Update time of the template.', 'quillcrm' ),
					 'type'        => 'string',
					 'readonly'    => false,
				 ),
				 'thumbnail'  => array(
					 'description' => __( 'Thumbnail URL of the template.', 'quillcrm' ),
					 'type'        => 'string',
					 'required'    => false,
					 'arg_options' => array(
						 'sanitize_callback' => 'esc_url_raw',
					 ),
				 ),
				 'hidden'     => array(
					 'description' => __( 'Whether the template is hidden from users.', 'quillcrm' ),
					 'type'        => 'boolean',
					 'required'    => false,
					 'default'     => false,
				 ),
			 ),
		 );
	}

	/**
	 * Get collection params
	 * Enhanced with filtering options
	 *
	 * @since 1.0.0
	 *
	 * @return array $params The collection params
	 */
	public function get_collection_params() {
		return array(
			'keyword'  => array(
				'description'       => __( 'Limit results to those matching a string.', 'quillcrm' ),
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'search'   => array(
				'description'       => __( 'Search templates by name.', 'quillcrm' ),
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'type'     => array(
				'description' => __( 'Filter by template type.', 'quillcrm' ),
				'type'        => 'string',
				'default'     => Campaign_Channel::STR_EMAIL,
				'enum'        => Campaign_Channel::get_core_channel_strings(),
			),
			'category' => array(
				'description'       => __( 'Filter by template category.', 'quillcrm' ),
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'hidden'   => array(
				'description' => __( 'Filter by hidden status.', 'quillcrm' ),
				'type'        => 'integer',
				'enum'        => array( 0, 1 ),
			),
			'is_pro'   => array(
				'description' => __( 'Filter by pro status.', 'quillcrm' ),
				'type'        => 'integer',
				'enum'        => array( 0, 1 ),
			),
			'per_page' => array(
				'description' => __( 'Number of items to return in one page.', 'quillcrm' ),
				'type'        => 'integer',
				'default'     => 20,
			),
			'page'     => array(
				'description' => __( 'Current page of the collection.', 'quillcrm' ),
				'type'        => 'integer',
				'default'     => 1,
			),
			'orderby'  => array(
				'description' => __( 'Order by field.', 'quillcrm' ),
				'type'        => 'string',
				'default'     => 'id',
			),
			'order'    => array(
				'description' => __( 'Order direction.', 'quillcrm' ),
				'type'        => 'string',
				'default'     => 'DESC',
				'enum'        => array( 'ASC', 'DESC' ),
			),
		);
	}

	/**
	 * Get items
	 * Enhanced with better filtering support
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_items( $request ) {
		try {
			// Get parameters with defaults
			$type     = $request->get_param( 'type' ) ?: Campaign_Channel::STR_EMAIL;
			$per_page = (int) ( $request->get_param( 'per_page' ) ?: 20 );
			$page     = (int) ( $request->get_param( 'page' ) ?: 1 );
			$orderby  = $request->get_param( 'orderby' ) ?: 'id';
			$order    = $request->get_param( 'order' ) ?: 'DESC';
			$search   = $request->get_param( 'search' );
			$keyword  = $request->get_param( 'keyword' ); // Backward compatibility
			$category = $request->get_param( 'category' );

			// Convert string type to integer for database query
			$type_int = Campaign_Channel::to_integer( $type ) ?? Campaign_Channel::CHANNEL_EMAIL;

			// Build query
			$query = Template_Model::where( 'type', $type_int );

			// Add conditional filters
			if ( $request->has_param( 'hidden' ) ) {
				$query->where( 'hidden', (int) $request->get_param( 'hidden' ) );
			} else {
				// Default: show only non-hidden templates
				$query->where( 'hidden', 0 );
			}

			if ( $request->has_param( 'is_pro' ) ) {
				$query->where( 'is_pro', (int) $request->get_param( 'is_pro' ) );
			}

			if ( $category ) {
				$query->where( 'category', $category );
			}

			// Search by name (support both 'search' and 'keyword' for backward compatibility)
			$search_term = $search ?: $keyword;
			if ( $search_term ) {
				$query->where( 'name', 'LIKE', '%' . $search_term . '%' );
			}

			// Get total count for pagination
			$total = $query->count();

			// Get paginated results with ordering
			$templates = $query->orderBy( $orderby, $order )
				->offset( ( $page - 1 ) * $per_page )
				->limit( $per_page )
				->get();

			return new WP_REST_Response(
				array(
					'templates' => $templates,
					'total'     => (int) $total,
					'pages'     => ceil( $total / $per_page ),
					'page'      => $page,
					'per_page'  => $per_page,
				),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get user templates (non-hidden only)
	 * Dedicated endpoint for user-created templates
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_user_templates( $request ) {
		try {
			// Get parameters with defaults
			$type   = $request->get_param( 'type' ) ?: Campaign_Channel::STR_EMAIL;
			$search = $request->get_param( 'search' );

			// Convert string type to integer for database query
			$type_int = Campaign_Channel::to_integer( $type ) ?? Campaign_Channel::CHANNEL_EMAIL;

			// Build query - only non-hidden templates
			$query = Template_Model::where( 'type', $type_int )
				->where( 'hidden', 0 ); // Only user-created templates

			// Search by name if provided
			if ( $search ) {
				$query->where( 'name', 'LIKE', '%' . $search . '%' );
			}

			// Get results ordered by most recent first
			$templates = $query->orderBy( 'created_at', 'DESC' )
				->get();

			return new WP_REST_Response( $templates, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_item( $request ) {
		try {
			$template_id = $request->get_param( 'id' );
			$template    = Template_Model::find( $template_id );

			if ( ! $template ) {
				return new WP_Error( 'error', __( 'Template not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $template, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function create_item( $request ) {
		try {
			$template_data = $this->prepare_template( $request );
			$template      = Template_Model::create( $template_data );

			return new WP_REST_Response( $template, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function update_item( $request ) {
		try {
			$template_id = $request->get_param( 'id' );
			$template    = Template_Model::find( $template_id );

			if ( ! $template ) {
				return new WP_Error( 'error', __( 'Template not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$template_data = $this->prepare_template( $request );
			$template->update( $template_data );

			return new WP_REST_Response( $template, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Smart save - creates or updates based on template usage
	 *
	 * Logic:
	 * - No ID: Create new template
	 * - ID exists + template in use (tracked): Create new template (preserve original)
	 * - ID exists + template NOT in use: Update existing template
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function save_template( $request ) {
		try {
			$template_id   = $request->get_param( 'id' );
			$campaign_id   = $request->get_param( 'campaign_id' );
			$template_data = $this->prepare_template( $request );

			// Case 1: No ID - create new template
			if ( ! $template_id ) {
				$template = Template_Model::create( $template_data );

				// Update campaign to use new template ID
				if ( $campaign_id ) {
					$this->add_template_to_campaign( $campaign_id, $template->id );
				}

				return new WP_REST_Response( $template, 201 );
			}

			// Case 2 & 3: ID exists - check if template is in use
			$template = Template_Model::find( $template_id );

			if ( ! $template ) {
				return new WP_Error( 'error', __( 'Template not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Check if template has been used in any sent messages
			if ( Template_Model::is_used_in_tracking( $template_id ) ) {
				// Template is in use - create new copy to preserve original
				unset( $template_data['id'] );
				$new_template = Template_Model::create( $template_data );

				// Update campaign to use new template ID
				if ( $campaign_id ) {
					$this->update_campaign_template_id( $campaign_id, $template_id, $new_template->id );
				}

				return new WP_REST_Response( $new_template, 201 );
			} else {
				// Template is NOT in use - safe to update
				$template->update( $template_data );
				return new WP_REST_Response( $template, 200 );
			}
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Add template ID to campaign's template_ids (for first-time creation)
	 *
	 * @param int $campaign_id Campaign ID
	 * @param int $template_id Template ID to add
	 */
	private function add_template_to_campaign( $campaign_id, $template_id ) {
		$campaign = Campaign_Model::find( $campaign_id );

		if ( ! $campaign ) {
			return;
		}

		$settings = is_array( $campaign->settings ) ? $campaign->settings : json_decode( $campaign->settings, true );

		// Initialize template_ids array if it doesn't exist
		if ( ! isset( $settings['template_ids'] ) ) {
			$settings['template_ids'] = array();
		}

		// Add template ID if not already in array
		if ( ! in_array( $template_id, $settings['template_ids'] ) ) {
			$settings['template_ids'][] = $template_id;
		}

		// Save campaign
		$campaign->update( array( 'settings' => $settings ) );
	}

	/**
	 * Update campaign's template_ids when a new template is created (replaces old ID)
	 *
	 * @param int $campaign_id Campaign ID
	 * @param int $old_template_id Old template ID
	 * @param int $new_template_id New template ID
	 */
	private function update_campaign_template_id( $campaign_id, $old_template_id, $new_template_id ) {
		$campaign = Campaign_Model::find( $campaign_id );

		if ( ! $campaign ) {
			return;
		}

		$settings = is_array( $campaign->settings ) ? $campaign->settings : json_decode( $campaign->settings, true );

		// Update template_ids array
		if ( isset( $settings['template_ids'] ) && is_array( $settings['template_ids'] ) ) {
			$key = array_search( $old_template_id, $settings['template_ids'] );
			if ( $key !== false ) {
				$settings['template_ids'][ $key ] = $new_template_id;
			}
		}

		// Save campaign
		$campaign->update( array( 'settings' => $settings ) );
	}

	/**
	 * Delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function delete_items( $request ) {
		try {
			$template_ids = $request->get_param( 'ids' );
			$templates    = Template_Model::find_many( $template_ids );

			if ( ! $templates ) {
				return new WP_Error( 'error', __( 'Templates not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			Template_Model::destroy( $template_ids );

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function delete_item( $request ) {
		try {
			$template_id = $request->get_param( 'id' );
			$template    = Template_Model::find( $template_id );

			if ( ! $template ) {
				return new WP_Error( 'error', __( 'Template not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$template->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare template
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return array $template_data The template data
	 */
	public function prepare_template( $request ) {
		$type = $request->get_param( 'type' ) ?? Campaign_Channel::STR_EMAIL;
		$name = $request->get_param( 'name' );

		$template_data = array(
			'id'           => $request->get_param( 'id' ),
			'type'         => $type,
			'subject'      => $request->get_param( 'subject' ),
			'body'         => $request->get_param( 'body' ),
			'settings'     => $request->get_param( 'settings' ),
			'preview_text' => $request->get_param( 'preview_text' ),
			'thumbnail'    => $request->get_param( 'thumbnail' ),
			'hidden'       => $request->get_param( 'hidden' ) ?? false,
		);

		// Only set name if provided, otherwise leave it out (for updates that don't change name)
		if ( $name !== null ) {
			$template_data['name'] = $name ?: 'New Template';
		}

		// Note: email_body data is now sent directly in the body field as JSON

		// Keep subject field for email templates even if empty (it's required for validation)
		// For non-email templates, subject should be removed if empty
		$is_email_template = in_array(
			$type,
			array(
				Campaign_Channel::STR_EMAIL,
				Campaign_Channel::STR_EMAIL_SEQUENCE,
				Campaign_Channel::STR_SEQUENCE_MAIL,
			)
		);

		foreach ( $template_data as $key => $value ) {
			// Don't remove subject for email templates - it's a required field
			if ( $key === 'subject' && $is_email_template ) {
				continue;
			}

			// Don't remove thumbnail field - allow empty strings to be saved
			if ( $key === 'thumbnail' ) {
				continue;
			}

			// Don't remove hidden field - allow false values to be saved
			if ( $key === 'hidden' ) {
				continue;
			}

			// For ID: keep if it has a value, remove if null/empty
			if ( empty( $value ) && $value !== '0' && $value !== 0 ) {
				unset( $template_data[ $key ] );
			}
		}

		return $template_data;
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return bool $permission The permission
	 */
	public function get_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return bool $permission The permission
	 */
	public function get_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Create item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return bool $permission The permission
	 */
	public function create_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return bool $permission The permission
	 */
	public function update_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Delete items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return bool $permission The permission
	 */
	public function delete_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return bool $permission The permission
	 */
	public function delete_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Render a template
	 * Merged from REST_Email_Builder_Controller
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response|WP_Error The response object
	 */
	public function render_template( $request ) {
		$template_id = (int) $request->get_param( 'id' );
		$merge_tags  = $request->get_param( 'merge_tags' ) ?: array();

		// Extract contact from merge_tags if provided (for backward compatibility)
		// Most commonly used for preview, so contact may be null
		$contact = null;
		if ( ! empty( $merge_tags ) ) {
			// Check if contact is in 'contact' key
			if ( isset( $merge_tags['contact'] ) && ( $merge_tags['contact'] instanceof \QuillCRM\Models\Contact_Model || $merge_tags['contact'] instanceof \QuillCRM\Models\Automation_Contact_Model ) ) {
				$contact = $merge_tags['contact'];
			} elseif ( ! empty( $merge_tags[0] ) && ( $merge_tags[0] instanceof \QuillCRM\Models\Contact_Model || $merge_tags[0] instanceof \QuillCRM\Models\Automation_Contact_Model ) ) {
				$contact = $merge_tags[0];
			}
		}

		$renderer = new Email_Renderer();
		$html     = $renderer->render_template( $template_id, $contact );

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
	 * Get available email blocks
	 * Merged from REST_Email_Builder_Controller
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response The response object
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
}
