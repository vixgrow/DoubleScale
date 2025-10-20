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

		// Register endpoint for sending test emails
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/send-test',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'send_test_email' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'to'         => array(
							'description'       => __( 'Recipient email address for the test email', 'quillcrm' ),
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_email',
							'validate_callback' => 'is_email',
						),
						'merge_tags' => array(
							'description' => __( 'Merge tags to use in the email', 'quillcrm' ),
							'type'        => 'object',
						),
					),
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
					 'enum'        => array( 'email', 'sms', 'whatsapp' ),
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
			'default'     => 'email',
			'enum'        => array( 'email', 'sms', 'whatsapp' ),
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
		$type     = $request->get_param( 'type' ) ?: 'email';
		$per_page = (int) ( $request->get_param( 'per_page' ) ?: 20 );
		$page     = (int) ( $request->get_param( 'page' ) ?: 1 );
			$orderby    = $request->get_param( 'orderby' ) ?: 'id';
			$order      = $request->get_param( 'order' ) ?: 'DESC';
			$search     = $request->get_param( 'search' );
			$keyword    = $request->get_param( 'keyword' ); // Backward compatibility
			$category   = $request->get_param( 'category' );

			// Build query
			$query = Template_Model::where( 'type', $type );

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
		$type = $request->get_param( 'type' ) ?? 'email';
		
		$template_data = array(
			'name'         => $request->get_param( 'name' ) ?? __( 'New Template', 'quillcrm' ),
			'type'         => $type,
			'subject'      => $request->get_param( 'subject' ),
			'body'         => $request->get_param( 'body' ),
			'settings'     => $request->get_param( 'settings' ),
			'preview_text' => $request->get_param( 'preview_text' ),
			'created_at'   => current_time( 'mysql' ),
			'updated_at'   => current_time( 'mysql' ),
		);

		// Note: email_body data is now sent directly in the body field as JSON

		foreach ( $template_data as $key => $value ) {
			if ( empty( $value ) && $value !== '0' && $value !== 0 ) {
				unset( $template_data[ $key ] );
			}
		}

		return $template_data;
	}



	/**
	 * Send a test email using the template
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object
	 *
	 * @return WP_REST_Response|WP_Error Response object
	 */
	public function send_test_email( $request ) {
		try {
			$template_id = $request->get_param( 'id' );
			$to          = $request->get_param( 'to' );
			$merge_tags  = $request->get_param( 'merge_tags' ) ?: array();

			// Default merge tags for testing
			$default_merge_tags = array(
				'first_name' => 'John',
				'last_name'  => 'Doe',
				'email'      => $to,
				'site_name'  => get_bloginfo( 'name' ),
				'site_url'   => site_url(),
				'date'       => current_time( 'mysql' ),
			);

			// Merge the default tags with any provided tags, with provided tags taking precedence
			$merge_tags = wp_parse_args( $merge_tags, $default_merge_tags );

			// Find the template
			$template = Template_Model::find( $template_id );

			if ( ! $template ) {
				return new WP_Error( 'template_not_found', __( 'Template not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Render the email content
			$renderer = new Email_Renderer();
			$content  = $renderer->render_template( $template_id, $merge_tags );

			if ( empty( $content ) ) {
				return new WP_Error( 'rendering_failed', __( 'Failed to render email template', 'quillcrm' ), array( 'status' => 500 ) );
			}

			// Set up email headers
			$headers    = array();
			$from_name  = get_bloginfo( 'name' );
			$from_email = get_option( 'admin_email' );
			$reply_to   = '';

			// Use template settings if available
			if ( ! empty( $template->settings ) ) {
				$settings = is_array( $template->settings ) ? $template->settings : json_decode( $template->settings, true );

				// Set from name if provided
				if ( ! empty( $settings['from_name'] ) ) {
					$from_name = $settings['from_name'];
				}

				// Set from email if provided and valid
				if ( ! empty( $settings['from_email'] ) && is_email( $settings['from_email'] ) ) {
					$from_email = $settings['from_email'];
				}

				// Set reply-to if provided and valid
				if ( ! empty( $settings['reply_to'] ) && is_email( $settings['reply_to'] ) ) {
					$reply_to = $settings['reply_to'];
				}
			}

			// Format headers
			$headers[] = 'Content-Type: text/html; charset=UTF-8';
			$headers[] = 'From: ' . $from_name . ' <' . $from_email . '>';
			if ( ! empty( $reply_to ) ) {
				$headers[] = 'Reply-To: ' . $reply_to;
			}

			// Use template subject and process merge tags using Merge_Tags_Manager
			$subject = ! empty( $template->subject ) ? $template->subject : 'Test Email';

			// Create a mock contact for merge tag processing
			$mock_contact = (object) $merge_tags;
			$subject      = Merge_Tags_Manager::instance()->process_merge_tags( $subject, $mock_contact );

			// Send the email using wp_mail directly
			$result = wp_mail( $to, $subject, $content, $headers );

			if ( ! $result ) {
				return new WP_Error( 'send_failed', __( 'Failed to send test email', 'quillcrm' ), array( 'status' => 500 ) );
			}

			return new WP_REST_Response(
				array(
					'success' => true,
					'message' => __( 'Test email sent successfully', 'quillcrm' ),
				),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
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
