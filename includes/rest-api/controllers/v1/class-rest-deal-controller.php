<?php

/**
 * REST API: Deal controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage REST_API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Managers\Deal_Manager;
use QuillCRM\Models\Custom_Field_Model;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Deal REST Controller class
 */
class REST_Deal_Controller extends REST_Controller {
















	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'deals';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		 // Deals endpoints
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

		// Deal stage movement
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/move-stage',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'move_to_stage' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
			)
		);

		// Deal pipeline movement
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/move-pipeline',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'move_to_pipeline' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
			)
		);

		// Deal status changes
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/mark-won',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'mark_as_won' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/mark-lost',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'mark_as_lost' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/reopen',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'reopen_deal' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
			)
		);

		// Deal activities
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/activities',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_activities' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
			)
		);

		// Overdue deals
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/overdue',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_overdue_deals' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
			)
		);

		// Deal statistics
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/statistics',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_statistics' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
			)
		);

		// Bulk operations
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/bulk',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'bulk_update' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
			)
		);
	}

	/**
	 * Get a collection of deals
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$filters = array(
			'pipeline_id'         => $request->get_param( 'pipeline_id' ),
			'stage_id'            => $request->get_param( 'stage_id' ),
			'status'              => $request->get_param( 'status' ),
			'owner_id'            => $request->get_param( 'owner_id' ),
			'contact_id'          => $request->get_param( 'contact_id' ),
			'value_min'           => $request->get_param( 'value_min' ),
			'value_max'           => $request->get_param( 'value_max' ),
			'date_from'           => $request->get_param( 'date_from' ),
			'date_to'             => $request->get_param( 'date_to' ),
			'expected_close_from' => $request->get_param( 'expected_close_from' ),
			'expected_close_to'   => $request->get_param( 'expected_close_to' ),
			'search'              => $request->get_param( 'search' ),
			'sort_by'             => $request->get_param( 'sort_by' ),
			'sort_order'          => $request->get_param( 'sort_order' ),
		);

		$per_page = $request->get_param( 'per_page' ) ?: 20;
		$page     = $request->get_param( 'page' ) ?: 1;

		// Remove null values
		$filters = array_filter(
			$filters,
			function ( $value ) {
				return $value !== null && $value !== '';
			}
		);

		$deals = Deal_Manager::instance()->get_deals_with_filters( $filters, $per_page, $page );

		$data = array();
		foreach ( $deals->items() as $deal ) {
			$data[] = $this->prepare_item_for_response( $deal, $request );
		}

		$response = new WP_REST_Response( $data, 200 );

		// Add pagination headers
		$response->header( 'X-Total-Count', $deals->total() );
		$response->header( 'X-Total-Pages', $deals->lastPage() );
		$response->header( 'X-Current-Page', $deals->currentPage() );

		return $response;
	}

	/**
	 * Get one deal
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$deal_id            = $request->get_param( 'id' );
		$with_relationships = $request->get_param( 'with_relationships' );

		if ( $with_relationships ) {
			$deal = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner', 'activities', 'custom_fields' ) )->find( $deal_id );
		} else {
			$deal = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner', 'custom_fields' ) )->find( $deal_id );
		}

		if ( ! $deal ) {
			return new WP_Error( 'deal_not_found', 'Deal not found', array( 'status' => 404 ) );
		}

		$data = $this->prepare_item_for_response( $deal, $request );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Create one deal
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		// Validate owner_id if provided
		$owner_id = $request->get_param( 'owner_id' );
		if ( $owner_id ) {
			$validation_error = $this->validate_owner_id( $owner_id );
			if ( is_wp_error( $validation_error ) ) {
				return $validation_error;
			}
		}

		$data = array(
			'title'               => sanitize_text_field( $request->get_param( 'title' ) ),
			'contact_id'          => intval( $request->get_param( 'contact_id' ) ),
			'pipeline_id'         => intval( $request->get_param( 'pipeline_id' ) ),
			'stage_id'            => intval( $request->get_param( 'stage_id' ) ),
			'value'               => floatval( $request->get_param( 'value' ) ),
			'currency'            => sanitize_text_field( $request->get_param( 'currency' ) ),
			'expected_close_date' => sanitize_text_field( $request->get_param( 'expected_close_date' ) ),
			'probability'         => $request->get_param( 'probability' ) !== null ? floatval( $request->get_param( 'probability' ) ) : null,
			'owner_id'            => $owner_id ? intval( $owner_id ) : null,
			'source'              => sanitize_text_field( $request->get_param( 'source' ) ),
		);

		// Remove empty values
		$data = array_filter(
			$data,
			function ( $value ) {
				return $value !== null && $value !== '';
			}
		);

		$deal = Deal_Manager::instance()->create_deal( $data );

		if ( ! $deal ) {
			return new WP_Error( 'creation_failed', 'Failed to create deal', array( 'status' => 500 ) );
		}

		$sync_custom_fields = $deal->sync_custom_fields( $request->get_param( 'custom_fields' ) );
		if ( is_wp_error( $sync_custom_fields ) ) {
			return $sync_custom_fields;
		}

		$deal->load( array( 'contact', 'pipeline', 'stage', 'owner', 'custom_fields' ) );
		$response_data = $this->prepare_item_for_response( $deal, $request );

		return new WP_REST_Response( $response_data, 201 );
	}



	/**
	 * Update one deal
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {

		$deal_id = $request->get_param( 'id' );
		$data    = array();

		// Validate owner_id if being updated
		$owner_id = $request->get_param( 'owner_id' );
		if ( $owner_id !== null && $owner_id !== '' ) {
			$validation_error = $this->validate_owner_id( $owner_id );
			if ( is_wp_error( $validation_error ) ) {
				return $validation_error;
			}
		}

		$fields = array( 'title', 'contact_id', 'pipeline_id', 'stage_id', 'value', 'currency', 'expected_close_date', 'probability', 'owner_id', 'source' );

		foreach ( $fields as $field ) {
			$value = $request->get_param( $field );
			if ( $value !== null ) {
				if ( $field === 'title' || $field === 'currency' || $field === 'source' ) {
					$data[ $field ] = sanitize_text_field( $value );
				} elseif ( $field === 'expected_close_date' ) {
					$data[ $field ] = sanitize_text_field( $value );
				} elseif ( in_array( $field, array( 'contact_id', 'pipeline_id', 'stage_id', 'owner_id' ) ) ) {
					$data[ $field ] = intval( $value );
				} elseif ( $field === 'value' || $field === 'probability' ) {
					$data[ $field ] = floatval( $value );
				}
			}
		}

		$deal = Deal_Manager::instance()->update_deal( $deal_id, $data );

		if ( ! $deal ) {
			return new WP_Error( 'update_failed', 'Failed to update deal', array( 'status' => 500 ) );
		}

		$sync_custom_fields = $deal->sync_custom_fields( $request->get_param( 'custom_fields' ) );
		if ( is_wp_error( $sync_custom_fields ) ) {
			return $sync_custom_fields;
		}

		$deal->load( array( 'contact', 'pipeline', 'stage', 'owner', 'custom_fields' ) );
		$response_data = $this->prepare_item_for_response( $deal, $request );

		return new WP_REST_Response( $response_data, 200 );
	}

	/**
	 * Delete one deal
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$deal_id = $request->get_param( 'id' );

		$deleted = Deal_Manager::instance()->delete_deal( $deal_id );

		if ( ! $deleted ) {
			return new WP_Error( 'delete_failed', 'Failed to delete deal', array( 'status' => 500 ) );
		}

		return new WP_REST_Response( array( 'deleted' => true ), 200 );
	}

	/**
	 * Move deal to stage
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function move_to_stage( $request ) {
		$deal_id            = $request->get_param( 'id' );
		$stage_id           = intval( $request->get_param( 'stage_id' ) );
		$update_probability = $request->get_param( 'update_probability' ) ? true : false;
		$user_id            = get_current_user_id();

		// Load the deal first to check current stage
		$deal = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner' ) )->find( $deal_id );

		if ( ! $deal ) {
			return new WP_Error( 'deal_not_found', 'Deal not found', array( 'status' => 404 ) );
		}

		// Check if the deal is already in the target stage
		if ( $deal->stage_id == $stage_id ) {
			$data            = $this->prepare_item_for_response( $deal, $request );
			$data['message'] = 'Deal is already in this stage';
			return new WP_REST_Response( $data, 200 );
		}

		$moved = Deal_Manager::instance()->move_deal_to_stage( $deal_id, $stage_id, $user_id, $update_probability );

		if ( ! $moved ) {
			return new WP_Error( 'move_failed', 'Failed to move deal to stage', array( 'status' => 500 ) );
		}

		// Reload the deal to get updated stage information
		$deal = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner' ) )->find( $deal_id );
		$data = $this->prepare_item_for_response( $deal, $request );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Move deal to pipeline
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function move_to_pipeline( $request ) {
		$deal_id     = $request->get_param( 'id' );
		$pipeline_id = intval( $request->get_param( 'pipeline_id' ) );
		$stage_id    = $request->get_param( 'stage_id' ) ? intval( $request->get_param( 'stage_id' ) ) : null;
		$user_id     = get_current_user_id();

		$moved = Deal_Manager::instance()->move_deal_to_pipeline( $deal_id, $pipeline_id, $stage_id, $user_id );

		if ( ! $moved ) {
			return new WP_Error( 'move_failed', 'Failed to move deal to pipeline', array( 'status' => 500 ) );
		}

		$deal = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner' ) )->find( $deal_id );
		$data = $this->prepare_item_for_response( $deal, $request );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Mark deal as won
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function mark_as_won( $request ) {
		$deal_id = $request->get_param( 'id' );
		$user_id = get_current_user_id();

		$updated = Deal_Manager::instance()->mark_deal_as_won( $deal_id, $user_id );

		if ( ! $updated ) {
			return new WP_Error( 'update_failed', 'Failed to mark deal as won', array( 'status' => 500 ) );
		}

		$deal = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner' ) )->find( $deal_id );
		$data = $this->prepare_item_for_response( $deal, $request );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Mark deal as lost
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function mark_as_lost( $request ) {
		$deal_id = $request->get_param( 'id' );
		$reason  = sanitize_textarea_field( $request->get_param( 'reason' ) );
		$user_id = get_current_user_id();

		$updated = Deal_Manager::instance()->mark_deal_as_lost( $deal_id, $reason, $user_id );

		if ( ! $updated ) {
			return new WP_Error( 'update_failed', 'Failed to mark deal as lost', array( 'status' => 500 ) );
		}

		$deal = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner' ) )->find( $deal_id );
		$data = $this->prepare_item_for_response( $deal, $request );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Reopen deal
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function reopen_deal( $request ) {
		$deal_id = $request->get_param( 'id' );
		$user_id = get_current_user_id();

		$updated = Deal_Manager::instance()->reopen_deal( $deal_id, $user_id );

		if ( ! $updated ) {
			return new WP_Error( 'update_failed', 'Failed to reopen deal', array( 'status' => 500 ) );
		}

		$deal = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner' ) )->find( $deal_id );
		$data = $this->prepare_item_for_response( $deal, $request );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Get deal activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_activities( $request ) {
		$deal_id = $request->get_param( 'id' );
		$filters = array(
			'activity_type' => $request->get_param( 'activity_type' ),
			'user_id'       => $request->get_param( 'user_id' ),
			'date_from'     => $request->get_param( 'date_from' ),
			'date_to'       => $request->get_param( 'date_to' ),
			'sort_by'       => $request->get_param( 'sort_by' ),
			'sort_order'    => $request->get_param( 'sort_order' ),
		);

		$per_page = $request->get_param( 'per_page' ) ?: 20;
		$page     = $request->get_param( 'page' ) ?: 1;

		// Remove null values
		$filters = array_filter(
			$filters,
			function ( $value ) {
				return $value !== null && $value !== '';
			}
		);

		$activities = \QuillCRM\Managers\Activity_Manager::instance()->get_deal_activities( $deal_id, $filters, $per_page, $page );

		if ( $activities === null ) {
			return new WP_Error( 'deal_not_found', 'Deal not found', array( 'status' => 404 ) );
		}

		$data = array();
		foreach ( $activities->items() as $activity ) {
			$data[] = $this->prepare_activity_for_response( $activity );
		}

		$response = new WP_REST_Response( $data, 200 );

		// Add pagination headers
		$response->header( 'X-Total-Count', $activities->total() );
		$response->header( 'X-Total-Pages', $activities->lastPage() );
		$response->header( 'X-Current-Page', $activities->currentPage() );

		return $response;
	}

	/**
	 * Get overdue deals
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_overdue_deals( $request ) {
		$owner_id = $request->get_param( 'owner_id' );

		$deals = Deal_Manager::instance()->get_overdue_deals( $owner_id );

		$data = array();
		foreach ( $deals as $deal ) {
			$data[] = $this->prepare_item_for_response( $deal, $request );
		}

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Get deal statistics
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_statistics( $request ) {
		$user_id = $request->get_param( 'user_id' );
		$filters = array(
			'date_from' => $request->get_param( 'date_from' ),
			'date_to'   => $request->get_param( 'date_to' ),
		);

		// Remove null values
		$filters = array_filter(
			$filters,
			function ( $value ) {
				return $value !== null && $value !== '';
			}
		);

		$statistics = Deal_Manager::instance()->get_deal_statistics( $user_id, $filters );

		return new WP_REST_Response( $statistics, 200 );
	}

	/**
	 * Bulk update deals
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function bulk_update( $request ) {
		$deal_ids = $request->get_param( 'deal_ids' );
		$data     = $request->get_param( 'data' );

		if ( ! is_array( $deal_ids ) || empty( $deal_ids ) ) {
			return new WP_Error( 'invalid_data', 'Deal IDs array is required', array( 'status' => 400 ) );
		}

		if ( ! is_array( $data ) || empty( $data ) ) {
			return new WP_Error( 'invalid_data', 'Update data is required', array( 'status' => 400 ) );
		}

		// Validate owner_id if being bulk updated
		if ( isset( $data['owner_id'] ) && $data['owner_id'] !== null && $data['owner_id'] !== '' ) {
			$validation_error = $this->validate_owner_id( $data['owner_id'] );
			if ( is_wp_error( $validation_error ) ) {
				return $validation_error;
			}
		}

		$user_id       = get_current_user_id();
		$updated_count = Deal_Manager::instance()->bulk_update_deals( $deal_ids, $data, $user_id );

		return new WP_REST_Response( array( 'updated_count' => $updated_count ), 200 );
	}

	/**
	 * Prepare the item for the REST response
	 *
	 * @param Deal            $deal Deal object.
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	public function prepare_item_for_response( $deal, $request ) {
		$data = array(
			'id'                  => $deal->id,
			'title'               => $deal->title,
			'contact_id'          => $deal->contact_id,
			'pipeline_id'         => $deal->pipeline_id,
			'stage_id'            => $deal->stage_id,
			'value'               => $deal->value,
			'currency'            => $deal->currency,
			'expected_close_date' => $deal->expected_close_date,
			'probability'         => $deal->probability,
			'status'              => $deal->status,
			'owner_id'            => $deal->owner_id,
			'source'              => $deal->source,
			'lost_reason'         => $deal->lost_reason,
			'won_time'            => $deal->won_time,
			'lost_time'           => $deal->lost_time,
			'is_overdue'          => $deal->is_overdue,
			'days_until_close'    => $deal->days_until_close,
			'weighted_value'      => $deal->weighted_value,
			'created_at'          => $deal->created_at,
			'updated_at'          => $deal->updated_at,
		);

		// Include relationships if loaded
		if ( $deal->relationLoaded( 'contact' ) && $deal->contact ) {
			$data['contact'] = array(
				'id'         => $deal->contact->id,
				'first_name' => $deal->contact->first_name,
				'last_name'  => $deal->contact->last_name,
				'email'      => $deal->contact->email,
			);
		}

		if ( $deal->relationLoaded( 'pipeline' ) && $deal->pipeline ) {
			$data['pipeline'] = array(
				'id'   => $deal->pipeline->id,
				'name' => $deal->pipeline->name,
			);
		}

		if ( $deal->relationLoaded( 'stage' ) && $deal->stage ) {
			$data['stage'] = array(
				'id'              => $deal->stage->id,
				'name'            => $deal->stage->name,
				'color'           => $deal->stage->color,
				'win_probability' => $deal->stage->win_probability,
			);
		}

		if ( $deal->relationLoaded( 'owner' ) && $deal->owner ) {
			$data['owner'] = array(
				'id'           => $deal->owner->ID,
				'display_name' => $deal->owner->display_name,
				'email'        => $deal->owner->user_email,
			);
		}

		if ( $deal->relationLoaded( 'activities' ) ) {
			$data['activities'] = array();
			foreach ( $deal->activities as $activity ) {
				$data['activities'][] = $this->prepare_activity_for_response( $activity );
			}
		}

		if ( $deal->relationLoaded( 'custom_fields' ) ) {
			$data['custom_fields'] = array();
			foreach ( $deal->custom_fields as $custom_field ) {
				$data['custom_fields'][] = $custom_field->toArray();
			}
		}

		return $data;
	}

	/**
	 * Prepare activity for response
	 *
	 * @param mixed $activity Activity object.
	 *
	 * @return array
	 */
	protected function prepare_activity_for_response( $activity ) {
		$data = array(
			'id'                => $activity->id,
			'deal_id'           => $activity->deal_id,
			'activity_type'     => $activity->activity_type,
			'data'              => $activity->data,
			'user_id'           => $activity->user_id,
			'formatted_message' => $activity->formatted_message,
			'created_at'        => $activity->created_at,
		);

		if ( $activity->relationLoaded( 'user' ) && $activity->user ) {
			$data['user'] = array(
				'id'           => $activity->user->ID,
				'display_name' => $activity->user->display_name,
			);
		}

		if ( $activity->relationLoaded( 'comments' ) ) {
			$data['comments'] = $activity->comments->toArray();
		}

		return $data;
	}

	/**
	 * Check if user can access deals
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if user can access single deal
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if user can create deals
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if user can update deals
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if user can delete deals
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Validate owner_id parameter
	 *
	 * @param int $owner_id Owner ID to validate.
	 *
	 * @return true|WP_Error True if valid, WP_Error if invalid.
	 */
	private function validate_owner_id( $owner_id ) {
		// Convert to integer
		$owner_id = intval( $owner_id );

		// Check for positive integer
		if ( $owner_id <= 0 ) {
			return new WP_Error(
				'invalid_owner_id',
				'Owner ID must be a positive number.',
				array( 'status' => 400 )
			);
		}

		// Check if user exists in WordPress
		$user = get_user_by( 'id', $owner_id );
		if ( ! $user ) {
			return new WP_Error(
				'user_not_found',
				'The specified owner does not exist.',
				array( 'status' => 400 )
			);
		}

		// Optional: Check if user has appropriate capabilities
		if ( ! user_can( $user, 'read' ) ) {
			return new WP_Error(
				'inactive_user',
				'The specified owner account is inactive.',
				array( 'status' => 400 )
			);
		}

		return true;
	}
}
