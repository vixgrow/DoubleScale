<?php

/**
 * REST API: Activity controller
 * Unified controller for all activity types (notes, emails, calls, meetings)
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage REST_API
 */

namespace QuillCRM\Rest_Api\Controllers\V1;

use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Activity_Model;
use QuillCRM\Models\Activity_Comment_Model;
use QuillCRM\Managers\Activity_Manager;
use QuillCRM\User_Roles\Permissions;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Activity REST Controller class
 */
class REST_Activity_Controller extends REST_Controller {



	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'activities';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		 // Get all activities.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		// Single activity CRUD.
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
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Add note.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/notes',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'add_note' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
			)
		);

		// Log email activity.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/emails',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'log_email' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
			)
		);

		// Log call activity.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/calls',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'log_call' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
			)
		);

		// Schedule meeting activity.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/meetings',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'schedule_meeting' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
			)
		);

		// Activity comments.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<activity_id>[\d]+)/comments',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_comments' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'add_comment' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		// Comment CRUD.
		register_rest_route(
			$this->namespace,
			'/comments/(?P<comment_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_comment' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_comment' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Activity statistics.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/statistics',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_statistics' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
			)
		);

		// Bulk delete activities.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/bulk-delete',
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'bulk_delete' ),
				'permission_callback' => array( $this, 'delete_item_permissions_check' ),
			)
		);
	}

	/**
	 * Get all activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$filters = array(
			'contact_id'    => $request->get_param( 'contact_id' ),
			'entity_id'     => $request->get_param( 'entity_id' ),
			'entity_type'   => $request->get_param( 'entity_type' ),
			'activity_type' => $request->get_param( 'activity_type' ),
			'user_id'       => $request->get_param( 'user_id' ),
			'date_from'     => $request->get_param( 'date_from' ),
			'date_to'       => $request->get_param( 'date_to' ),
			'sort_by'       => $request->get_param( 'sort_by' ),
			'sort_order'    => $request->get_param( 'sort_order' ),
		);

		// Remove null values.
		$filters = array_filter(
			$filters,
			function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);

		$per_page = intval( $request->get_param( 'per_page' ) ) ?: 20;
		$page     = intval( $request->get_param( 'page' ) ) ?: 1;

		$activities = Activity_Manager::instance()->get_activities( $filters, $per_page, $page );

		if ( null === $activities ) {
			return new WP_Error( 'access_denied', __( 'Access denied', 'quillcrm' ), array( 'status' => 403 ) );
		}

		$data = array();
		foreach ( $activities->items() as $activity ) {
			$data[] = $this->prepare_item_for_response( $activity, $request );
		}

		$response = new WP_REST_Response( $data, 200 );

		// Add pagination headers.
		$response->header( 'X-Total-Count', $activities->total() );
		$response->header( 'X-Total-Pages', $activities->lastPage() );
		$response->header( 'X-Current-Page', $activities->currentPage() );

		return $response;
	}

	/**
	 * Get one activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$activity_id   = $request->get_param( 'id' );
		$with_comments = $request->get_param( 'with_comments' );

		$activity = Activity_Manager::instance()->get_activity( $activity_id, $with_comments );

		if ( ! $activity ) {
			return new WP_Error( 'activity_not_found', __( 'Activity not found', 'quillcrm' ), array( 'status' => 404 ) );
		}

		$data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Add note
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function add_note( $request ) {
		$data = array(
			'contact_id'  => $request->get_param( 'contact_id' ),
			'entity_id'   => $request->get_param( 'entity_id' ),
			'entity_type' => $request->get_param( 'entity_type' ),
			'title'       => sanitize_text_field( $request->get_param( 'title' ) ?? '' ),
			'content'     => wp_kses_post( $request->get_param( 'content' ) ?? '' ),
		);

		if ( empty( $data['contact_id'] ) && empty( $data['entity_id'] ) ) {
			return new WP_Error( 'missing_entity', __( 'Contact ID or Entity ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		if ( empty( $data['content'] ) && empty( $data['title'] ) ) {
			return new WP_Error( 'missing_content', __( 'Note content or title is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		$activity = Activity_Manager::instance()->add_note( $data );

		if ( ! $activity ) {
			return new WP_Error( 'creation_failed', __( 'Failed to add note', 'quillcrm' ), array( 'status' => 500 ) );
		}

		$activity->load( array( 'user' ) );
		$response_data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $response_data, 201 );
	}

	/**
	 * Log email activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function log_email( $request ) {
		$email_data = $request->get_param( 'email_data' ) ?? array();

		$data = array(
			'contact_id'    => $request->get_param( 'contact_id' ),
			'entity_id'     => $request->get_param( 'entity_id' ),
			'entity_type'   => $request->get_param( 'entity_type' ),
			'subject'       => $email_data['subject'] ?? '',
			'body'          => $email_data['body'] ?? '',
			'sent_at'       => $email_data['sent_at'] ?? current_time( 'mysql' ),
			'contact_email' => $email_data['contact_email'] ?? '',
			'contact_name'  => $email_data['contact_name'] ?? '',
		);

		if ( empty( $data['contact_id'] ) && empty( $data['entity_id'] ) ) {
			return new WP_Error( 'missing_entity', __( 'Contact ID or Entity ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		$activity = Activity_Manager::instance()->log_email( $data );

		if ( ! $activity ) {
			return new WP_Error( 'creation_failed', __( 'Failed to log email', 'quillcrm' ), array( 'status' => 500 ) );
		}

		$activity->load( array( 'user' ) );
		$response_data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $response_data, 201 );
	}

	/**
	 * Log call activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function log_call( $request ) {
		$call_data = $request->get_param( 'call_data' ) ?? array();

		$data = array(
			'contact_id'   => $request->get_param( 'contact_id' ),
			'entity_id'    => $request->get_param( 'entity_id' ),
			'entity_type'  => $request->get_param( 'entity_type' ),
			'duration'     => $call_data['duration'] ?? null,
			'outcome'      => $call_data['outcome'] ?? '',
			'notes'        => $call_data['notes'] ?? '',
			'called_at'    => $call_data['called_at'] ?? current_time( 'mysql' ),
			'phone_number' => $call_data['phone_number'] ?? '',
		);

		if ( empty( $data['contact_id'] ) && empty( $data['entity_id'] ) ) {
			return new WP_Error( 'missing_entity', __( 'Contact ID or Entity ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		$activity = Activity_Manager::instance()->log_call( $data );

		if ( ! $activity ) {
			return new WP_Error( 'creation_failed', __( 'Failed to log call', 'quillcrm' ), array( 'status' => 500 ) );
		}

		$activity->load( array( 'user' ) );
		$response_data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $response_data, 201 );
	}

	/**
	 * Schedule meeting activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function schedule_meeting( $request ) {
		$meeting_data = $request->get_param( 'meeting_data' ) ?? array();

		$data = array(
			'contact_id'             => $request->get_param( 'contact_id' ),
			'entity_id'              => $request->get_param( 'entity_id' ),
			'entity_type'            => $request->get_param( 'entity_type' ),
			'title'                  => $meeting_data['title'] ?? '',
			'scheduled_at'           => $meeting_data['scheduled_at'] ?? '',
			'duration'               => $meeting_data['duration'] ?? 60,
			'location'               => $meeting_data['location'] ?? '',
			'description'            => $meeting_data['description'] ?? '',
			'primary_attendee_id'    => $meeting_data['primary_attendee_id'] ?? null,
			'primary_attendee_name'  => $meeting_data['primary_attendee_name'] ?? '',
			'primary_attendee_email' => $meeting_data['primary_attendee_email'] ?? '',
		);

		if ( empty( $data['contact_id'] ) && empty( $data['entity_id'] ) ) {
			return new WP_Error( 'missing_entity', __( 'Contact ID or Entity ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		$activity = Activity_Manager::instance()->schedule_meeting( $data );

		if ( ! $activity ) {
			return new WP_Error( 'creation_failed', __( 'Failed to schedule meeting', 'quillcrm' ), array( 'status' => 500 ) );
		}

		$activity->load( array( 'user' ) );
		$response_data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $response_data, 201 );
	}

	/**
	 * Update activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$activity_id = intval( $request->get_param( 'id' ) );
		$user_id     = get_current_user_id();

		if ( empty( $activity_id ) ) {
			return new WP_Error( 'missing_activity_id', __( 'Activity ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		// Get the activity to check its type.
		$activity = Activity_Model::find( $activity_id );

		if ( ! $activity ) {
			return new WP_Error( 'activity_not_found', __( 'Activity not found', 'quillcrm' ), array( 'status' => 404 ) );
		}

		// Check if activity is editable.
		if ( ! $activity->is_editable() ) {
			return new WP_Error(
				'activity_not_editable',
				__( 'This activity type cannot be edited. Only user-created activities (notes, calls, emails, meetings) can be modified.', 'quillcrm' ),
				array( 'status' => 403 )
			);
		}

		// Prepare data based on activity type.
		$data = array();
		switch ( $activity->activity_type ) {
			case 'note':
				$title   = $request->get_param( 'title' );
				$content = $request->get_param( 'content' );
				if ( null !== $title ) {
					$data['title'] = $title;
				}
				if ( null !== $content ) {
					$data['content'] = $content;
				}
				break;

			case 'email_sent':
				$email_data = $request->get_param( 'email_data' );
				if ( ! empty( $email_data ) && is_array( $email_data ) ) {
					$data['email_data'] = $email_data;
				}
				break;

			case 'call_logged':
				$call_data = $request->get_param( 'call_data' );
				if ( ! empty( $call_data ) && is_array( $call_data ) ) {
					$data['call_data'] = $call_data;
				}
				break;

			case 'meeting_scheduled':
				$meeting_data = $request->get_param( 'meeting_data' );
				if ( ! empty( $meeting_data ) && is_array( $meeting_data ) ) {
					$data['meeting_data'] = $meeting_data;
				}
				break;
		}

		$updated_activity = Activity_Manager::instance()->update_activity( $activity_id, $data, $user_id );

		if ( ! $updated_activity ) {
			return new WP_Error( 'update_failed', __( 'Failed to update activity or access denied', 'quillcrm' ), array( 'status' => 500 ) );
		}

		$updated_activity->load( array( 'user' ) );
		$response_data = $this->prepare_item_for_response( $updated_activity, $request );

		return new WP_REST_Response( $response_data, 200 );
	}

	/**
	 * Delete activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$activity_id = intval( $request->get_param( 'id' ) );
		$user_id     = get_current_user_id();

		if ( empty( $activity_id ) ) {
			return new WP_Error( 'missing_activity_id', __( 'Activity ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		// Get the activity to check its type.
		$activity = Activity_Model::find( $activity_id );

		if ( ! $activity ) {
			return new WP_Error( 'activity_not_found', __( 'Activity not found', 'quillcrm' ), array( 'status' => 404 ) );
		}

		// Check if activity is editable.
		if ( ! $activity->is_editable() ) {
			return new WP_Error(
				'activity_not_deletable',
				__( 'This activity type cannot be deleted. Only user-created activities (notes, calls, emails, meetings) can be removed.', 'quillcrm' ),
				array( 'status' => 403 )
			);
		}

		$deleted = Activity_Manager::instance()->delete_activity( $activity_id, $user_id );

		if ( ! $deleted ) {
			return new WP_Error( 'delete_failed', __( 'Failed to delete activity or access denied', 'quillcrm' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response( array( 'deleted' => true ), 200 );
	}

	/**
	 * Bulk delete activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function bulk_delete( $request ) {
		$activity_ids = $request->get_param( 'activity_ids' );
		$user_id      = get_current_user_id();

		if ( ! is_array( $activity_ids ) || empty( $activity_ids ) ) {
			return new WP_Error( 'invalid_data', __( 'Activity IDs array is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		$deleted_count = Activity_Manager::instance()->bulk_delete_activities( $activity_ids, $user_id );

		return new WP_REST_Response( array( 'deleted_count' => $deleted_count ), 200 );
	}

	/**
	 * Get activity comments
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_comments( $request ) {
		$activity_id = $request->get_param( 'activity_id' );

		$activity = Activity_Model::with( 'comments.user' )->find( $activity_id );

		if ( ! $activity ) {
			return new WP_Error( 'activity_not_found', __( 'Activity not found', 'quillcrm' ), array( 'status' => 404 ) );
		}

		$data = array();
		foreach ( $activity->comments as $comment ) {
			$data[] = $this->prepare_comment_for_response( $comment );
		}

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Add comment to activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function add_comment( $request ) {
		$activity_id = intval( $request->get_param( 'activity_id' ) );
		$content     = sanitize_textarea_field( $request->get_param( 'content' ) );
		$user_id     = get_current_user_id();

		if ( empty( $activity_id ) ) {
			return new WP_Error( 'missing_activity_id', __( 'Activity ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		if ( empty( $content ) ) {
			return new WP_Error( 'missing_content', __( 'Comment content is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		$comment = Activity_Manager::instance()->add_comment( $activity_id, $content, $user_id );

		if ( ! $comment ) {
			return new WP_Error( 'creation_failed', __( 'Failed to add comment', 'quillcrm' ), array( 'status' => 500 ) );
		}

		$comment->load( 'user' );
		$data = $this->prepare_comment_for_response( $comment );

		return new WP_REST_Response( $data, 201 );
	}

	/**
	 * Update comment
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_comment( $request ) {
		$comment_id = intval( $request->get_param( 'comment_id' ) );
		$content    = sanitize_textarea_field( $request->get_param( 'content' ) );
		$user_id    = get_current_user_id();

		if ( empty( $comment_id ) ) {
			return new WP_Error( 'missing_comment_id', __( 'Comment ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		if ( empty( $content ) ) {
			return new WP_Error( 'missing_content', __( 'Comment content is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		$comment = Activity_Manager::instance()->update_comment( $comment_id, $content, $user_id );

		if ( ! $comment ) {
			return new WP_Error( 'update_failed', __( 'Failed to update comment or access denied', 'quillcrm' ), array( 'status' => 500 ) );
		}

		$comment->load( 'user' );
		$data = $this->prepare_comment_for_response( $comment );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Delete comment
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_comment( $request ) {
		$comment_id = intval( $request->get_param( 'comment_id' ) );
		$user_id    = get_current_user_id();

		if ( empty( $comment_id ) ) {
			return new WP_Error( 'missing_comment_id', __( 'Comment ID is required', 'quillcrm' ), array( 'status' => 400 ) );
		}

		$deleted = Activity_Manager::instance()->delete_comment( $comment_id, $user_id );

		if ( ! $deleted ) {
			return new WP_Error( 'delete_failed', __( 'Failed to delete comment or access denied', 'quillcrm' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response( array( 'deleted' => true ), 200 );
	}

	/**
	 * Get activity statistics
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_statistics( $request ) {
		$filters = array(
			'contact_id'  => $request->get_param( 'contact_id' ),
			'entity_id'   => $request->get_param( 'entity_id' ),
			'entity_type' => $request->get_param( 'entity_type' ),
			'user_id'     => $request->get_param( 'user_id' ),
			'date_from'   => $request->get_param( 'date_from' ),
			'date_to'     => $request->get_param( 'date_to' ),
		);

		// Remove null values.
		$filters = array_filter(
			$filters,
			function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);

		$statistics = Activity_Manager::instance()->get_activity_statistics( $filters );

		return new WP_REST_Response( $statistics, 200 );
	}

	/**
	 * Prepare the item for the REST response
	 *
	 * @param Activity_Model  $activity Activity object.
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	public function prepare_item_for_response( $activity, $request ) {
		$data = array(
			'id'                => $activity->id,
			'contact_id'        => $activity->contact_id,
			'deal_id'           => $activity->deal_id, // Backward compatibility
			'activity_type'     => $activity->activity_type,
			'data'              => $activity->data,
			'user_id'           => $activity->user_id,
			'formatted_message' => $activity->formatted_message,
			'is_editable'       => $activity->is_editable(),
			'is_system'         => $activity->is_system_activity(),
			'created_at'        => $activity->created_at,
			'updated_at'        => $activity->updated_at,
		);

		// Include entity associations if loaded.
		if ( $activity->relationLoaded( 'associations' ) && $activity->associations ) {
			$data['associations'] = array();
			foreach ( $activity->associations as $association ) {
				$data['associations'][] = array(
					'entity_type' => $association->entity_type,
					'entity_id'   => $association->entity_id,
				);
			}
		}

		// Include relationships if loaded.
		if ( $activity->relationLoaded( 'user' ) && $activity->user ) {
			$data['user'] = array(
				'id'           => $activity->user->ID,
				'display_name' => $activity->user->display_name,
				'email'        => $activity->user->user_email,
			);
		}

		if ( $activity->relationLoaded( 'contact' ) && $activity->contact ) {
			$data['contact'] = array(
				'id'         => $activity->contact->id,
				'email'      => $activity->contact->email,
				'first_name' => $activity->contact->first_name,
				'last_name'  => $activity->contact->last_name,
			);
		}

		if ( $activity->relationLoaded( 'comments' ) ) {
			$data['comments'] = array();
			foreach ( $activity->comments as $comment ) {
				$data['comments'][] = $this->prepare_comment_for_response( $comment );
			}
		}

		return $data;
	}

	/**
	 * Prepare comment for response
	 *
	 * @param Activity_Comment_Model $comment Comment object.
	 *
	 * @return array
	 */
	protected function prepare_comment_for_response( $comment ) {
		$data = array(
			'id'                => $comment->id,
			'activity_id'       => $comment->activity_id,
			'user_id'           => $comment->user_id,
			'content'           => $comment->content,
			'formatted_content' => $comment->formatted_content,
			'time_ago'          => $comment->time_ago,
			'created_at'        => $comment->created_at,
			'updated_at'        => $comment->updated_at,
		);

		if ( $comment->relationLoaded( 'user' ) && $comment->user ) {
			$data['user'] = array(
				'id'           => $comment->user->ID,
				'display_name' => $comment->user->display_name,
				'email'        => $comment->user->user_email,
			);
		}

		return $data;
	}

	/**
	 * Check if user can access activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function get_items_permissions_check( $request ) {
		return Permissions::has_sales_rep_access();
	}

	/**
	 * Check if user can access single activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function get_item_permissions_check( $request ) {
		return Permissions::has_sales_rep_access();
	}

	/**
	 * Check if user can create activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function create_item_permissions_check( $request ) {
		return Permissions::has_sales_rep_access();
	}

	/**
	 * Check if user can update activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function update_item_permissions_check( $request ) {
		return Permissions::has_sales_rep_access();
	}

	/**
	 * Check if user can delete activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function delete_item_permissions_check( $request ) {
		return Permissions::has_sales_rep_access();
	}
}
