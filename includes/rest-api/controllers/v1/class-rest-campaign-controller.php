<?php

/**
 * Class Rest_Campaign_Controller
 * Cross-type campaign controller for read-only operations
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
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Managers\Campaign_Status_Manager;

/**
 * REST_Campaign_Controller class
 *
 * Handles cross-type campaign operations (read-only):
 * - List all campaigns regardless of type
 * - Read individual campaign metadata (to determine type before routing to channel-specific controllers)
 *
 * Channel-specific operations delegated to:
 * - REST_Email_Campaign_Controller for email campaigns (/qc/v1/email-campaigns)
 * - REST_SMS_Campaign_Controller for SMS campaigns (/qc/v1/sms-campaigns)
 * - REST_WhatsApp_Campaign_Controller for WhatsApp campaigns (/qc/v1/whatsapp-campaigns)
 */
class REST_Campaign_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'campaigns';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		// Get all campaigns (cross-type list)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'keywords' => array(
							'description' => __( 'The keyword to search for.', 'quillcrm' ),
							'type'        => 'string',
						),
						'per_page' => array(
							'description' => __( 'The number of items to return per page.', 'quillcrm' ),
							'type'        => 'integer',
							'default'     => 10,
						),
						'page'     => array(
							'description' => __( 'The page number.', 'quillcrm' ),
							'type'        => 'integer',
							'default'     => 1,
						),
						'from'     => array(
							'description' => __( 'Start date for filtering campaigns.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
						'to'       => array(
							'description' => __( 'End date for filtering campaigns.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
						'type'     => array(
							'description' => __( 'Campaign type filter.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'email', 'sms', 'whatsapp' ),
						),
					),
				),
			)
		);

		// Individual campaign read (cross-type)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);

		// Bulk delete endpoint (cross-type)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/bulk-delete',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'bulk_delete' ),
					'permission_callback' => array( $this, 'bulk_delete_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'Array of campaign IDs to delete.', 'quillcrm' ),
							'type'        => 'array',
							'items'       => array( 'type' => 'integer' ),
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Schema for the campaign
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The campaign schema
	 */
	public function get_item_schema() {
		 $status_manager = Campaign_Status_Manager::instance();

		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'campaign',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'name'        => array(
					'description' => __( 'The name of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'description' => array(
					'description' => __( 'The description of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status'      => array(
					'description'       => __( 'The status of the campaign.', 'quillcrm' ),
					'type'              => 'string',
					'enum'              => $status_manager->get_all_statuses(),
					'default'           => Campaign_Status_Manager::DRAFT,
					'validate_callback' => array( $this, 'validate_campaign_status' ),
				),
				'type'        => array(
					'description' => __( 'The type/channel of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'enum'        => array( 'email', 'sms', 'whatsapp' ),
					'readonly'    => true,
				),
				'settings'    => array(
					'description' => __( 'The settings of the campaign.', 'quillcrm' ),
					'type'        => 'object',
				),
				'parent_id'   => array(
					'description' => __( 'The parent id of the campaign.', 'quillcrm' ),
					'type'        => 'integer',
				),
				'count'       => array(
					'description' => __( 'The count of the campaign.', 'quillcrm' ),
					'type'        => 'integer',
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'execute_at'  => array(
					'description' => __( 'The execute at of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'created_at'  => array(
					'description' => __( 'The created at of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'updated_at'  => array(
					'description' => __( 'The updated at of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'readonly'    => true,
				),
			),
		);
	}

	/**
	 * Get all campaigns (cross-type)
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_items( $request ) {
		try {
			$keywords = $request->get_param( 'keywords' ) ?? null;
			$per_page = $request->get_param( 'per_page' ) ?? 10;
			$page     = $request->get_param( 'page' ) ?? 1;
			$from     = $request->get_param( 'from' ) ?? null;
			$to       = $request->get_param( 'to' ) ?? null;
			$type     = $request->get_param( 'type' ) ?? null;
			$query    = Campaign_Model::query();

			// Get total count before applying filters
			$total_count = $query->count();

			// Apply type filter if specified
			if ( $type ) {
				if ( ! in_array( $type, array( 'email', 'sms', 'whatsapp' ) ) ) {
					return new WP_Error( 'invalid_type', __( 'Invalid campaign type. Must be email, sms, or whatsapp.', 'quillcrm' ), array( 'status' => 400 ) );
				}
				$query->where( 'type', $type );
			}

			// Apply keywords filter
			if ( $keywords ) {
				$query->where( 'name', 'like', '%' . $keywords . '%' );
			}

			// Apply date range filter
			if ( $from ) {
				$query->where( 'created_at', '>=', $from );
			}
			if ( $to ) {
				$query->where( 'created_at', '<=', $to );
			}
			$campaigns = $query->orderBy( 'created_at', 'desc' )
				->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response(
				$campaigns->toArray() + array( 'total_count' => $total_count ),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get individual campaign (cross-type)
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = Campaign_Model::find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $campaign, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Bulk delete campaigns (cross-type)
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function bulk_delete( $request ) {
		try {
			$campaign_ids = $request->get_param( 'ids' );

			if ( empty( $campaign_ids ) || ! is_array( $campaign_ids ) ) {
				return new WP_Error(
					'invalid_ids',
					__( 'Invalid campaign IDs provided', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			// Get campaigns to verify they exist
			$campaigns = Campaign_Model::whereIn( 'id', $campaign_ids )->get();

			if ( $campaigns->isEmpty() ) {
				return new WP_Error(
					'campaigns_not_found',
					__( 'No campaigns found with the provided IDs', 'quillcrm' ),
					array( 'status' => 404 )
				);
			}

			// Delete campaigns (works across all types: email, sms, whatsapp)
			Campaign_Model::destroy( $campaign_ids );

			return new WP_REST_Response(
				array(
					'deleted' => count( $campaign_ids ),
					'message' => __( 'Campaigns deleted successfully', 'quillcrm' ),
				),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Validate campaign status
	 *
	 * @param string          $status The status to validate
	 * @param WP_REST_Request $request The request object
	 * @param string          $param The parameter name
	 * @return bool|WP_Error
	 */
	public function validate_campaign_status( $status, $request, $param ) {
		$status_manager = Campaign_Status_Manager::instance();

		if ( ! $status_manager->is_valid_status( $status ) ) {
			return new WP_Error(
				'invalid_campaign_status',
				sprintf( __( 'Invalid campaign status: %s', 'quillcrm' ), $status ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	// ===================================================================
	// PERMISSION CHECKS
	// ===================================================================

	/**
	 * Check if a given request has access to get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function get_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to get a specific item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function get_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to bulk delete campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function bulk_delete_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
