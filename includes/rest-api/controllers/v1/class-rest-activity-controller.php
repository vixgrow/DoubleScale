<?php
/**
 * REST API: Activity controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage REST_API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Deal_Activity;
use QuillCRM\Models\Activity_Comment;
use QuillCRM\Managers\Activity_Manager;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Activity REST Controller class
 */
class REST_Activity_Controller extends REST_Controller
{

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
	public function register_routes()
	{
		// Activity endpoints
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
			)
		);

		// Add note to deal
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/notes',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'add_note' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
			)
		);

		// Log email activity
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/emails',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'log_email' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
			)
		);

		// Log call activity
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/calls',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'log_call' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
			)
		);

		// Schedule meeting activity
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/meetings',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'schedule_meeting' ),
				'permission_callback' => array( $this, 'create_item_permissions_check' ),
			)
		);

		// Activity comments
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

		// Activity statistics
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/statistics',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_statistics' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
			)
		);

		// Bulk delete activities
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
	 * Get one activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$activity_id = $request->get_param( 'id' );
		$with_comments = $request->get_param( 'with_comments' );

		if ( $with_comments ) {
			$activity = Deal_Activity::with( array( 'user', 'comments.user', 'deal' ) )->find( $activity_id );
		} else {
			$activity = Deal_Activity::with( array( 'user', 'deal' ) )->find( $activity_id );
		}

		if ( ! $activity ) {
			return new WP_Error( 'activity_not_found', 'Activity not found', array( 'status' => 404 ) );
		}

		$data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Add note to deal
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function add_note( $request ) {
		$deal_id = intval( $request->get_param( 'deal_id' ) );
		$note = sanitize_textarea_field( $request->get_param( 'note' ) );
		$user_id = get_current_user_id();

		if ( empty( $deal_id ) ) {
			return new WP_Error( 'missing_deal_id', 'Deal ID is required', array( 'status' => 400 ) );
		}

		if ( empty( $note ) ) {
			return new WP_Error( 'missing_note', 'Note content is required', array( 'status' => 400 ) );
		}

		$activity = Activity_Manager::instance()->add_note( $deal_id, $note, $user_id );

		if ( ! $activity ) {
			return new WP_Error( 'creation_failed', 'Failed to add note', array( 'status' => 500 ) );
		}

		$activity->load( array( 'user', 'deal' ) );
		$data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $data, 201 );
	}

	/**
	 * Log email activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function log_email( $request ) {
		$deal_id = intval( $request->get_param( 'deal_id' ) );
		$email_data = $request->get_param( 'email_data' );
		$user_id = get_current_user_id();

		if ( empty( $deal_id ) ) {
			return new WP_Error( 'missing_deal_id', 'Deal ID is required', array( 'status' => 400 ) );
		}

		if ( empty( $email_data ) || ! is_array( $email_data ) ) {
			return new WP_Error( 'missing_email_data', 'Email data is required', array( 'status' => 400 ) );
		}

		$activity = Activity_Manager::instance()->log_email( $deal_id, $email_data, $user_id );

		if ( ! $activity ) {
			return new WP_Error( 'creation_failed', 'Failed to log email', array( 'status' => 500 ) );
		}

		$activity->load( array( 'user', 'deal' ) );
		$data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $data, 201 );
	}

	/**
	 * Log call activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function log_call( $request ) {
		$deal_id = intval( $request->get_param( 'deal_id' ) );
		$call_data = $request->get_param( 'call_data' );
		$user_id = get_current_user_id();

		if ( empty( $deal_id ) ) {
			return new WP_Error( 'missing_deal_id', 'Deal ID is required', array( 'status' => 400 ) );
		}

		if ( empty( $call_data ) || ! is_array( $call_data ) ) {
			return new WP_Error( 'missing_call_data', 'Call data is required', array( 'status' => 400 ) );
		}

		$activity = Activity_Manager::instance()->log_call( $deal_id, $call_data, $user_id );

		if ( ! $activity ) {
			return new WP_Error( 'creation_failed', 'Failed to log call', array( 'status' => 500 ) );
		}

		$activity->load( array( 'user', 'deal' ) );
		$data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $data, 201 );
	}

	/**
	 * Schedule meeting activity
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function schedule_meeting( $request ) {
		$deal_id = intval( $request->get_param( 'deal_id' ) );
		$meeting_data = $request->get_param( 'meeting_data' );
		$user_id = get_current_user_id();

		if ( empty( $deal_id ) ) {
			return new WP_Error( 'missing_deal_id', 'Deal ID is required', array( 'status' => 400 ) );
		}

		if ( empty( $meeting_data ) || ! is_array( $meeting_data ) ) {
			return new WP_Error( 'missing_meeting_data', 'Meeting data is required', array( 'status' => 400 ) );
		}

		$activity = Activity_Manager::instance()->schedule_meeting( $deal_id, $meeting_data, $user_id );

		if ( ! $activity ) {
			return new WP_Error( 'creation_failed', 'Failed to schedule meeting', array( 'status' => 500 ) );
		}

		$activity->load( array( 'user', 'deal' ) );
		$data = $this->prepare_item_for_response( $activity, $request );

		return new WP_REST_Response( $data, 201 );
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
		
		$activity = Deal_Activity::with( 'comments.user' )->find( $activity_id );

		if ( ! $activity ) {
			return new WP_Error( 'activity_not_found', 'Activity not found', array( 'status' => 404 ) );
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
		$content = sanitize_textarea_field( $request->get_param( 'content' ) );
		$user_id = get_current_user_id();

		if ( empty( $activity_id ) ) {
			return new WP_Error( 'missing_activity_id', 'Activity ID is required', array( 'status' => 400 ) );
		}

		if ( empty( $content ) ) {
			return new WP_Error( 'missing_content', 'Comment content is required', array( 'status' => 400 ) );
		}

		$comment = Activity_Manager::instance()->add_comment( $activity_id, $content, $user_id );

		if ( ! $comment ) {
			return new WP_Error( 'creation_failed', 'Failed to add comment', array( 'status' => 500 ) );
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
		$content = sanitize_textarea_field( $request->get_param( 'content' ) );
		$user_id = get_current_user_id();

		if ( empty( $comment_id ) ) {
			return new WP_Error( 'missing_comment_id', 'Comment ID is required', array( 'status' => 400 ) );
		}

		if ( empty( $content ) ) {
			return new WP_Error( 'missing_content', 'Comment content is required', array( 'status' => 400 ) );
		}

		$comment = Activity_Manager::instance()->update_comment( $comment_id, $content, $user_id );

		if ( ! $comment ) {
			return new WP_Error( 'update_failed', 'Failed to update comment or access denied', array( 'status' => 500 ) );
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
		$user_id = get_current_user_id();

		if ( empty( $comment_id ) ) {
			return new WP_Error( 'missing_comment_id', 'Comment ID is required', array( 'status' => 400 ) );
		}

		$deleted = Activity_Manager::instance()->delete_comment( $comment_id, $user_id );

		if ( ! $deleted ) {
			return new WP_Error( 'delete_failed', 'Failed to delete comment or access denied', array( 'status' => 500 ) );
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
			'deal_id'   => $request->get_param( 'deal_id' ),
			'user_id'   => $request->get_param( 'user_id' ),
			'date_from' => $request->get_param( 'date_from' ),
			'date_to'   => $request->get_param( 'date_to' ),
		);

		// Remove null values
		$filters = array_filter( $filters, function( $value ) {
			return $value !== null && $value !== '';
		} );

		$statistics = Activity_Manager::instance()->get_activity_statistics( $filters );

		return new WP_REST_Response( $statistics, 200 );
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
		$user_id = get_current_user_id();

		if ( ! is_array( $activity_ids ) || empty( $activity_ids ) ) {
			return new WP_Error( 'invalid_data', 'Activity IDs array is required', array( 'status' => 400 ) );
		}

		$deleted_count = Activity_Manager::instance()->bulk_delete_activities( $activity_ids, $user_id );

		return new WP_REST_Response( array( 'deleted_count' => $deleted_count ), 200 );
	}

	/**
	 * Prepare the item for the REST response
	 *
	 * @param Deal_Activity $activity Activity object.
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	public function prepare_item_for_response( $activity, $request ) {
		$data = array(
			'id'               => $activity->id,
			'deal_id'          => $activity->deal_id,
			'activity_type'    => $activity->activity_type,
			'data'             => $activity->data,
			'user_id'          => $activity->user_id,
			'formatted_message' => $activity->formatted_message,
			'created_at'       => $activity->created_at,
		);

		// Include relationships if loaded
		if ( $activity->relationLoaded( 'user' ) && $activity->user ) {
			$data['user'] = array(
				'id'           => $activity->user->ID,
				'display_name' => $activity->user->display_name,
				'email'        => $activity->user->user_email,
			);
		}

		if ( $activity->relationLoaded( 'deal' ) && $activity->deal ) {
			$data['deal'] = array(
				'id'    => $activity->deal->id,
				'title' => $activity->deal->title,
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
	 * @param Activity_Comment $comment Comment object.
	 *
	 * @return array
	 */
	protected function prepare_comment_for_response( $comment ) {
		$data = array(
			'id'                 => $comment->id,
			'activity_id'        => $comment->activity_id,
			'user_id'            => $comment->user_id,
			'content'            => $comment->content,
			'formatted_content'  => $comment->formatted_content,
			'time_ago'           => $comment->time_ago,
			'created_at'         => $comment->created_at,
			'updated_at'         => $comment->updated_at,
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
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if user can create activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if user can update activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if user can delete activities
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}