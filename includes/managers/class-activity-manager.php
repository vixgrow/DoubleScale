<?php
/**
 * Class Activity_Manager
 * This class is responsible for handling deal activity management
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Models\Deal_Activity_Model;
use QuillCRM\Models\Activity_Comment_Model;

/**
 * Activity_Manager class
 */
final class Activity_Manager {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Activity_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Activity_Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Activity_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'quillcrm_loaded', array( $this, 'init' ) );
	}

	/**
	 * Initialize
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init() {
		// Add any initialization hooks here
	}

	/**
	 * Add note to deal
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID
	 * @param string $note Note content
	 * @param int|null $user_id User ID
	 *
	 * @return Deal_Activity|null
	 */
	public function add_note( $deal_id, $note, $user_id = null ) {
		$deal = Deal_Model::find( $deal_id );
		
		if ( ! $deal ) {
			return null;
		}

		if ( empty( $note ) ) {
			return null;
		}

		$activity = Deal_Activity_Model::create( array(
			'deal_id' => $deal_id,
			'activity_type' => 'note_added',
			'data' => array( 'note' => wp_kses_post( $note ) ),
			'user_id' => $user_id ?: get_current_user_id(),
		) );

		do_action( 'quillcrm_deal_note_added', $activity, $deal );

		return $activity;
	}

	/**
	 * Log email activity
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID
	 * @param array $email_data Email data (subject, recipient, etc.)
	 * @param int|null $user_id User ID
	 *
	 * @return Deal_Activity|null
	 */
	public function log_email( $deal_id, $email_data, $user_id = null ) {
		$deal = Deal_Model::find( $deal_id );
		
		if ( ! $deal ) {
			return null;
		}

		$sanitized_data = array(
			'subject' => sanitize_text_field( $email_data['subject'] ?? '' ),
			'sent_at' => $email_data['sent_at'] ?? current_time( 'mysql' ),
		);

		// Handle multiple contact references
		if ( isset( $email_data['contact_ids'] ) && is_array( $email_data['contact_ids'] ) ) {
			$contact_ids = array_map( 'intval', $email_data['contact_ids'] );
			$sanitized_data['contact_ids'] = $contact_ids;
		}

		$activity = Deal_Activity_Model::create( array(
			'deal_id' => $deal_id,
			'activity_type' => 'email_sent',
			'data' => $sanitized_data,
			'user_id' => $user_id ?: get_current_user_id(),
		) );

		do_action( 'quillcrm_deal_email_logged', $activity, $deal );

		return $activity;
	}

	/**
	 * Log call activity
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID
	 * @param array $call_data Call data
	 * @param int|null $user_id User ID
	 *
	 * @return Deal_Activity|null
	 */
	public function log_call( $deal_id, $call_data, $user_id = null ) {
		$deal = Deal_Model::find( $deal_id );
		
		if ( ! $deal ) {
			return null;
		}

		$sanitized_data = array(
			'duration' => isset( $call_data['duration'] ) ? intval( $call_data['duration'] ) : null,
			'outcome' => sanitize_text_field( $call_data['outcome'] ?? '' ),
			'notes' => wp_kses_post( $call_data['notes'] ?? '' ),
			'called_at' => $call_data['called_at'] ?? current_time( 'mysql' ),
		);

		if ( isset( $call_data['phone_number'] ) ) {
			$sanitized_data['phone_number'] = sanitize_text_field( $call_data['phone_number'] );
		}

		$activity = Deal_Activity_Model::create( array(
			'deal_id' => $deal_id,
			'activity_type' => 'call_logged',
			'data' => $sanitized_data,
			'user_id' => $user_id ?: get_current_user_id(),
		) );

		do_action( 'quillcrm_deal_call_logged', $activity, $deal );

		return $activity;
	}

	/**
	 * Schedule meeting activity
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID
	 * @param array $meeting_data Meeting data
	 * @param int|null $user_id User ID
	 *
	 * @return Deal_Activity|null
	 */
	public function schedule_meeting( $deal_id, $meeting_data, $user_id = null ) {
		$deal = Deal_Model::find( $deal_id );
		
		if ( ! $deal ) {
			return null;
		}

		$sanitized_data = array(
			'title' => sanitize_text_field( $meeting_data['title'] ?? '' ),
			'scheduled_at' => sanitize_text_field( $meeting_data['scheduled_at'] ?? '' ),
			'duration' => isset( $meeting_data['duration'] ) ? intval( $meeting_data['duration'] ) : 60,
			'location' => sanitize_text_field( $meeting_data['location'] ?? '' ),
			'description' => wp_kses_post( $meeting_data['description'] ?? '' ),
		);

		if ( isset( $meeting_data['attendees'] ) && is_array( $meeting_data['attendees'] ) ) {
			$sanitized_data['attendees'] = array_map( 'sanitize_email', $meeting_data['attendees'] );
		}

		$activity = Deal_Activity_Model::create( array(
			'deal_id' => $deal_id,
			'activity_type' => 'meeting_scheduled',
			'data' => $sanitized_data,
			'user_id' => $user_id ?: get_current_user_id(),
		) );

		do_action( 'quillcrm_deal_meeting_scheduled', $activity, $deal );

		return $activity;
	}

	/**
	 * Get activities for deal with pagination
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID
	 * @param array $filters Filter criteria
	 * @param int $per_page Results per page
	 * @param int $page Page number
	 *
	 * @return \Illuminate\Pagination\LengthAwarePaginator|null
	 */
	public function get_deal_activities( $deal_id, $filters = array(), $per_page = 20, $page = 1 ) {
		$deal = Deal_Model::find( $deal_id );
		
		if ( ! $deal ) {
			return null;
		}

		$query = Deal_Activity_Model::with( array( 'user', 'comments.user' ) )
			->where( 'deal_id', $deal_id );

		// Filter by activity type
		if ( ! empty( $filters['activity_type'] ) ) {
			if ( is_array( $filters['activity_type'] ) ) {
				$query->whereIn( 'activity_type', $filters['activity_type'] );
			} else {
				$query->where( 'activity_type', $filters['activity_type'] );
			}
		}

		// Filter by user
		if ( ! empty( $filters['user_id'] ) ) {
			$query->where( 'user_id', $filters['user_id'] );
		}

		// Filter by date range
		if ( ! empty( $filters['date_from'] ) ) {
			$query->whereDate( 'created_at', '>=', $filters['date_from'] );
		}
		if ( ! empty( $filters['date_to'] ) ) {
			$query->whereDate( 'created_at', '<=', $filters['date_to'] );
		}

		// Sort options
		$sort_by = $filters['sort_by'] ?? 'created_at';
		$sort_order = $filters['sort_order'] ?? 'desc';
		$query->orderBy( $sort_by, $sort_order );

		return $query->paginate( $per_page, array( '*' ), 'page', $page );
	}

	/**
	 * Add comment to activity
	 *
	 * @since 1.0.0
	 *
	 * @param int $activity_id Activity ID
	 * @param string $content Comment content
	 * @param int|null $user_id User ID
	 *
	 * @return Activity_Comment|null
	 */
	public function add_comment( $activity_id, $content, $user_id = null ) {
		$activity = Deal_Activity_Model::find( $activity_id );
		
		if ( ! $activity ) {
			return null;
		}

		if ( empty( $content ) ) {
			return null;
		}

		$comment = Activity_Comment_Model::create( array(
			'activity_id' => $activity_id,
			'content' => wp_kses_post( $content ),
			'user_id' => $user_id ?: get_current_user_id(),
		) );

		do_action( 'quillcrm_activity_comment_added', $comment, $activity );

		return $comment;
	}

	/**
	 * Update comment
	 *
	 * @since 1.0.0
	 *
	 * @param int $comment_id Comment ID
	 * @param string $content New content
	 * @param int|null $user_id User performing the action
	 *
	 * @return Activity_Comment|null
	 */
	public function update_comment( $comment_id, $content, $user_id = null ) {
		$comment = Activity_Comment_Model::find( $comment_id );
		
		if ( ! $comment ) {
			return null;
		}

		// Check if user can edit this comment
		if ( $user_id && $comment->user_id !== $user_id && ! current_user_can( 'manage_options' ) ) {
			return null;
		}

		$comment->content = wp_kses_post( $content );
		$comment->save();

		do_action( 'quillcrm_activity_comment_updated', $comment );

		return $comment;
	}

	/**
	 * Delete comment
	 *
	 * @since 1.0.0
	 *
	 * @param int $comment_id Comment ID
	 * @param int|null $user_id User performing the action
	 *
	 * @return bool
	 */
	public function delete_comment( $comment_id, $user_id = null ) {
		$comment = Activity_Comment_Model::find( $comment_id );
		
		if ( ! $comment ) {
			return false;
		}

		// Check if user can delete this comment
		if ( $user_id && $comment->user_id !== $user_id && ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		do_action( 'quillcrm_activity_comment_before_delete', $comment );

		$deleted = $comment->delete();

		if ( $deleted ) {
			do_action( 'quillcrm_activity_comment_deleted', $comment_id );
		}

		return $deleted;
	}

	/**
	 * Get activity statistics for deal or user
	 *
	 * @since 1.0.0
	 *
	 * @param array $filters Filter criteria
	 *
	 * @return array
	 */
	public function get_activity_statistics( $filters = array() ) {
		$query = Deal_Activity_Model::query();

		// Filter by deal
		if ( ! empty( $filters['deal_id'] ) ) {
			$query->where( 'deal_id', $filters['deal_id'] );
		}

		// Filter by user
		if ( ! empty( $filters['user_id'] ) ) {
			$query->where( 'user_id', $filters['user_id'] );
		}

		// Filter by date range
		if ( ! empty( $filters['date_from'] ) ) {
			$query->whereDate( 'created_at', '>=', $filters['date_from'] );
		}
		if ( ! empty( $filters['date_to'] ) ) {
			$query->whereDate( 'created_at', '<=', $filters['date_to'] );
		}

		$activities = $query->get();

		$stats = array(
			'total_activities' => $activities->count(),
			'notes' => $activities->where( 'activity_type', 'note_added' )->count(),
			'emails' => $activities->where( 'activity_type', 'email_sent' )->count(),
			'calls' => $activities->where( 'activity_type', 'call_logged' )->count(),
			'meetings' => $activities->where( 'activity_type', 'meeting_scheduled' )->count(),
			'stage_changes' => $activities->where( 'activity_type', 'stage_changed' )->count(),
			'value_changes' => $activities->where( 'activity_type', 'value_changed' )->count(),
			'status_changes' => $activities->where( 'activity_type', 'status_changed' )->count(),
		);

		// Add activity breakdown by type
		$stats['by_type'] = array();
		foreach ( $activities->groupBy( 'activity_type' ) as $type => $type_activities ) {
			$stats['by_type'][ $type ] = $type_activities->count();
		}

		return $stats;
	}

	/**
	 * Bulk delete activities
	 *
	 * @since 1.0.0
	 *
	 * @param array $activity_ids Array of activity IDs
	 * @param int|null $user_id User performing the action
	 *
	 * @return int Number of deleted activities
	 */
	public function bulk_delete_activities( $activity_ids, $user_id = null ) {
		if ( empty( $activity_ids ) ) {
			return 0;
		}

		$deleted_count = 0;
		
		foreach ( $activity_ids as $activity_id ) {
			$activity = Deal_Activity_Model::find( $activity_id );
			
			if ( $activity ) {
				// Check permissions if needed
				if ( $user_id && ! current_user_can( 'manage_options' ) ) {
					continue;
				}

				if ( $activity->delete() ) {
					$deleted_count++;
				}
			}
		}

		do_action( 'quillcrm_activities_bulk_deleted', $activity_ids, $deleted_count );

		return $deleted_count;
	}
}