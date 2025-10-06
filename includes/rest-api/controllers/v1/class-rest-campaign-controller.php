<?php

/**
 * Class Rest_Campaign_Controller
 * This class is responsible for handling the campaign rest api
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
use QuillCRM\Utils;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;

use QuillCRM\Managers\Campaign_Status_Manager;

/**
 * Rest_Campaign_Controller class
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
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'keyword'  => array(
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
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'The ids of the items to delete.', 'quillcrm' ),
							'type'        => 'array',
							'items'       => array(
								'type' => 'integer',
							),
							'required'    => true,
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
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Analytics route (cross-type)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/duplicate',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'duplicate_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		// Get campaign emails
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/emails',
			array(
				'args' => array(
					'id'       => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
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
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_emails' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id'       => array(
							'description' => __( 'The id of the campaign.', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
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
						'status'   => array(
							'description' => __( 'The status of the email.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'all', 'sent', 'opened', 'clicked', 'failed' ),
							'required'    => false,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/email-analytics',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_analytics' ),
					'permission_callback' => array( $this, 'get_analytics_permissions_check' ),
					'args'                => array(
						'interval'   => array(
							'description' => __( 'Interval for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'custom', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year', 'last_year' ),
							'required'    => false,
						),
						'start_date' => array(
							'description' => __( 'Start date for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
						'end_date'   => array(
							'description' => __( 'End date for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
					),
				),
			)
		);

		// Note: Individual campaign CRUD operations are handled by type-specific endpoints:
		// - /qc/v1/email-campaigns/* for email campaign management
		// - /qc/v1/sms-campaigns/* for SMS campaign management
		// - /qc/v1/whatsapp-campaigns/* for WhatsApp campaign management
		// Frontend should use these endpoints for create, update, delete, and duplicate operations
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
	 * Get all campaigns
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
	 * Bulk operations on campaigns (cross-type)
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_campaign_emails( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$per_page    = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page        = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$status      = $request->get_param( 'status' ) ? $request->get_param( 'status' ) : '';

			$query = Campaign_Email_Model::where( 'campaign_id', $campaign_id );

			switch ( $status ) {
				case 'opened':
					$query->where( 'opened', 1 );
					break;
				case 'clicked':
					$query->where( 'clicked', 1 );
					break;
				case 'failed':
					$query->where( 'status', 'failed' );
					break;
				case 'sent':
					$query->where( 'status', 'sent' );
					break;
			}

			$campaign_emails = $query->with( 'contact', 'template' )
				->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $campaign_emails, 200 );
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
	 * Create a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function create_item( $request ) {
		try {
			$campaign_data = $this->prepare_campaign( $request );
			$campaign      = Campaign_Model::create( $campaign_data );

			return new WP_REST_Response( $campaign, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Duplicate a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function duplicate_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = Campaign_Model::find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$campaign_data = $campaign->toArray();
			unset( $campaign_data['id'] );
			unset( $campaign_data['created_at'] );
			unset( $campaign_data['updated_at'] );

			foreach ( $campaign_data['settings']['templates'] ?? array() as $key => $template ) {
				unset( $campaign_data['settings']['templates'][ $key ]['template_id'] );
			}

			$campaign_data['status'] = 'draft';
			$campaign_data['name']   = $campaign_data['name'] . ' - Copy';
			$campaign                = Campaign_Model::create( $campaign_data );

			return new WP_REST_Response( $campaign, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function update_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = Campaign_Model::find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$campaign_data = $this->prepare_campaign( $request );
			$campaign->update( $campaign_data );

			return new WP_REST_Response( $campaign, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function delete_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = Campaign_Model::find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$campaign->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete multiple campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function delete_items( $request ) {
		try {
			$campaign_ids = $request->get_param( 'ids' );
			$campaigns    = Campaign_Model::find( $campaign_ids );

			if ( ! $campaigns ) {
				return new WP_Error( 'error', __( 'Campaigns not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			Campaign_Model::destroy( $campaign_ids );

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare the campaign data
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return array $campaign_data The campaign data
	 */
	private function prepare_campaign( $request ) {
		$campaign_data = array(
			'name'        => $request->get_param( 'name' ),
			'description' => $request->get_param( 'description' ),
			'status'      => $request->get_param( 'status' ),
			'settings'    => $request->get_param( 'settings' ),
			'parent_id'   => $request->get_param( 'parent_id' ),
			'count'       => $request->get_param( 'count' ),
			'execute_at'  => $request->get_param( 'execute_at' ),
		);

		foreach ( $campaign_data as $key => $value ) {
			if ( empty( $value ) ) {
				unset( $campaign_data[ $key ] );
			}
		}

		return $campaign_data;
	}



	/**
	 * Get analytics
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_analytics( $request ) {
		try {
			$interval   = $request->get_param( 'interval' ) ? $request->get_param( 'interval' ) : 'last_30_days';
			$start_date = $request->get_param( 'start_date' ) ? $request->get_param( 'start_date' ) : '';
			$end_date   = $request->get_param( 'end_date' ) ? $request->get_param( 'end_date' ) : '';

			if ( 'custom' !== $interval ) {
				$start_date = Utils::get_start_date( $interval, $start_date );
				$end_date   = Utils::get_end_date( $interval, $end_date );
			}

			$dates  = Utils::get_dates_between_dates( $start_date, $end_date );
			$type   = $dates['type'] ?? 'hour';
			$emails = array();

			foreach ( $dates['dates'] as $date ) {
				switch ( $type ) {
					case 'hour':
						$emails[ $date ] = Campaign_Email_Model::whereBetween( 'created_at', array( $date, date( 'Y-m-d H:i:s', strtotime( $date . ' +1 hour' ) ) ) )->count();
						break;
					case 'day':
						$emails[ $date ] = Campaign_Email_Model::whereDay( 'created_at', date( 'd', strtotime( $date ) ) )->count();
						break;
					case 'month':
						$emails[ $date ] = Campaign_Email_Model::whereMonth( 'created_at', date( 'm', strtotime( $date ) ) )->count();
						break;
					case 'year':
						$emails[ $date ] = Campaign_Email_Model::whereYear( 'created_at', date( 'Y', strtotime( $date ) ) )->count();
						break;
				}
			}

			$total_emails  = Campaign_Email_Model::count();
			$total_opened  = Campaign_Email_Model::where( 'status', 'opened' )->count();
			$total_clicked = Campaign_Email_Model::where( 'status', 'clicked' )->count();

			$analytics = array(
				'emails'  => $emails,
				'data'    => $dates,
				'total'   => $total_emails,
				'opened'  => $total_opened,
				'clicked' => $total_clicked,
			);
			return new WP_REST_Response( $analytics, 200 );
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
	 * Check if a given request has access to bulk operations
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function create_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to update a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function update_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to delete a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function delete_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to delete multiple campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function delete_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Get analytics permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_analytics_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
