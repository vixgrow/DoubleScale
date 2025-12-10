<?php

/**
 * Class Activity_Manager
 * Unified manager for handling all activity operations (contacts and deals)
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use QuillCRM\Models\Activity_Model;
use QuillCRM\Models\Activity_Comment_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\User_Roles\Permissions;

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
		// Add any initialization hooks here.
	}

	/**
	 * Add note activity
	 *
	 * @since 1.0.0
	 *
	 * @param array    $data Note data (contact_id, deal_id, title, content).
	 * @param int|null $user_id User ID.
	 *
	 * @return Activity_Model|null
	 */
	public function add_note( $data, $user_id = null ) {
		$contact_id  = $data['contact_id'] ?? null;
		$entity_id   = $data['entity_id'] ?? null;
		$entity_type = $data['entity_type'] ?? null;
		$title       = $data['title'] ?? '';
		$content     = $data['content'] ?? '';

		// Must have at least one entity.
		if ( ! $contact_id && ! $entity_id && ! $entity_type ) {
			return null;
		}

		if ( empty( $content ) && empty( $title ) ) {
			return null;
		}

		if ( $entity_type === 'deal' ) {
			if ( ! $this->can_access_deal( $entity_id ) ) {
				return null;
			}
			// Get contact_id from deal if not provided.
			if ( $entity_id && ! $contact_id ) {
				$contact_id = $this->get_contact_id_from_deal( $entity_id );
			}
		}

		$activity = Activity_Model::create(
			array(
				'contact_id'    => $contact_id,
				'activity_type' => 'note',
				'data'          => array(
					'title'   => sanitize_text_field( $title ),
					'content' => wp_kses_post( $content ),
				),
				'user_id'       => $user_id ?: get_current_user_id(),
			)
		);

		// Create activity association with entity if provided
		if ( $activity && $entity_type && $entity_id && class_exists( '\QuillCRM\Models\Activity_Association_Model' ) ) {
			\QuillCRM\Models\Activity_Association_Model::create(
				array(
					'activity_id' => $activity->id,
					'entity_type' => $entity_type,
					'entity_id'   => $entity_id,
				)
			);
		}

		do_action( 'quillcrm_note_added', $activity, $data );

		return $activity;
	}

	/**
	 * Log email activity
	 *
	 * @since 1.0.0
	 *
	 * @param array    $data Email data.
	 * @param int|null $user_id User ID.
	 *
	 * @return Activity_Model|null
	 */
	public function log_email( $data, $user_id = null ) {
		$contact_id  = $data['contact_id'] ?? null;
		$entity_id   = $data['entity_id'] ?? null;
		$entity_type = $data['entity_type'] ?? null;

		// Must have at least one entity.
		if ( ! $contact_id && ! $entity_id && ! $entity_type ) {
			return null;
		}

		if ( $entity_type === 'deal' ) {
			if ( ! $this->can_access_deal( $entity_id ) ) {
				return null;
			}
			// Get contact_id from deal if not provided.
			if ( ! $contact_id ) {
				$contact_id = $this->get_contact_id_from_deal( $entity_id );
				$deal_data  = $this->get_deal_with_contact( $entity_id );
				$contact_id = $deal_data['contact_id'] ?? null;

				if ( $deal_data['contact'] ?? null ) {
					$data['contact_email'] = $data['contact_email'] ?? $deal_data['contact']['email'];
					$data['contact_name']  = $data['contact_name'] ?? $deal_data['contact']['name'];
				}
			}
		}

		$activity = Activity_Model::create(
			array(
				'contact_id'    => $contact_id,
				'activity_type' => 'email_sent',
				'data'          => array(
					'subject'       => sanitize_text_field( $data['subject'] ?? '' ),
					'sent_at'       => $data['sent_at'] ?? current_time( 'mysql' ),
					'contact_email' => sanitize_email( $data['contact_email'] ?? '' ),
					'contact_name'  => sanitize_text_field( $data['contact_name'] ?? '' ),
				),
				'user_id'       => $user_id ?: get_current_user_id(),
			)
		);

		// Create activity association with entity if provided
		if ( $activity && $entity_type && $entity_id && class_exists( '\QuillCRM\Models\Activity_Association_Model' ) ) {
			\QuillCRM\Models\Activity_Association_Model::create(
				array(
					'activity_id' => $activity->id,
					'entity_type' => $entity_type,
					'entity_id'   => $entity_id,
				)
			);
		}

		do_action( 'quillcrm_email_logged', $activity, $data );

		return $activity;
	}

	/**
	 * Log call activity
	 *
	 * @since 1.0.0
	 *
	 * @param array    $data Call data.
	 * @param int|null $user_id User ID.
	 *
	 * @return Activity_Model|null
	 */
	public function log_call( $data, $user_id = null ) {
		$contact_id  = $data['contact_id'] ?? null;
		$entity_id   = $data['entity_id'] ?? null;
		$entity_type = $data['entity_type'] ?? null;

		// Must have at least one entity.
		if ( ! $contact_id && ! $entity_id && ! $entity_type ) {
			return null;
		}

		// Check deal permissions if deal_id is provided.
		if ( $entity_type === 'deal' ) {
			if ( ! $this->can_access_deal( $entity_id ) ) {
				return null;
			}
			// Get contact_id from deal if not provided.
			if ( ! $contact_id ) {
				$contact_id = $this->get_contact_id_from_deal( $entity_id );
			}
		}

		$activity = Activity_Model::create(
			array(
				'contact_id'    => $contact_id,
				'activity_type' => 'call_logged',
				'data'          => array(
					'duration'     => isset( $data['duration'] ) ? intval( $data['duration'] ) : null,
					'outcome'      => sanitize_text_field( $data['outcome'] ?? '' ),
					'notes'        => wp_kses_post( $data['notes'] ?? '' ),
					'called_at'    => $data['called_at'] ?? current_time( 'mysql' ),
					'phone_number' => sanitize_text_field( $data['phone_number'] ?? '' ),
				),
				'user_id'       => $user_id ?: get_current_user_id(),
			)
		);

		// Create activity association with entity if provided
		if ( $activity && $entity_type && $entity_id && class_exists( '\QuillCRM\Models\Activity_Association_Model' ) ) {
			\QuillCRM\Models\Activity_Association_Model::create(
				array(
					'activity_id' => $activity->id,
					'entity_type' => $entity_type,
					'entity_id'   => $entity_id,
				)
			);
		}

		do_action( 'quillcrm_call_logged', $activity, $data );

		return $activity;
	}

	/**
	 * Schedule meeting activity
	 *
	 * @since 1.0.0
	 *
	 * @param array    $data Meeting data.
	 * @param int|null $user_id User ID.
	 *
	 * @return Activity_Model|null
	 */
	public function schedule_meeting( $data, $user_id = null ) {
		$contact_id  = $data['contact_id'] ?? null;
		$entity_id   = $data['entity_id'] ?? null;
		$entity_type = $data['entity_type'] ?? null;

		// Must have at least one entity.
		if ( ! $contact_id && ! $entity_id && ! $entity_type ) {
			return null;
		}

		if ( $entity_type === 'deal' ) {
			// Check deal permissions if deal_id is provided.
			if ( $entity_id && ! $this->can_access_deal( $entity_id ) ) {
				return null;
			}

			// Get contact info from deal if not provided.
			if ( $entity_id && ! $contact_id ) {
				$deal_data  = $this->get_deal_with_contact( $entity_id );
				$contact_id = $deal_data['contact_id'] ?? null;

				if ( $deal_data['contact'] ?? null ) {
					$data['primary_attendee_id']    = $data['primary_attendee_id'] ?? $deal_data['contact']['id'];
					$data['primary_attendee_name']  = $data['primary_attendee_name'] ?? $deal_data['contact']['name'];
					$data['primary_attendee_email'] = $data['primary_attendee_email'] ?? $deal_data['contact']['email'];
				}
			}
		}

		$activity = Activity_Model::create(
			array(
				'contact_id'    => $contact_id,
				'activity_type' => 'meeting_scheduled',
				'data'          => array(
					'title'                  => sanitize_text_field( $data['title'] ?? '' ),
					'scheduled_at'           => sanitize_text_field( $data['scheduled_at'] ?? '' ),
					'duration'               => isset( $data['duration'] ) ? intval( $data['duration'] ) : 60,
					'location'               => sanitize_text_field( $data['location'] ?? '' ),
					'description'            => wp_kses_post( $data['description'] ?? '' ),
					'primary_attendee_id'    => $data['primary_attendee_id'] ?? null,
					'primary_attendee_name'  => sanitize_text_field( $data['primary_attendee_name'] ?? '' ),
					'primary_attendee_email' => sanitize_email( $data['primary_attendee_email'] ?? '' ),
				),
				'user_id'       => $user_id ?: get_current_user_id(),
			)
		);

		// Create activity association with entity if provided
		if ( $activity && $entity_type && $entity_id && class_exists( '\QuillCRM\Models\Activity_Association_Model' ) ) {
			\QuillCRM\Models\Activity_Association_Model::create(
				array(
					'activity_id' => $activity->id,
					'entity_type' => $entity_type,
					'entity_id'   => $entity_id,
				)
			);
		}

		do_action( 'quillcrm_meeting_scheduled', $activity, $data );

		return $activity;
	}

	/**
	 * Get activities with pagination
	 *
	 * @since 1.0.0
	 *
	 * @param array $filters Filter criteria (contact_id, deal_id, activity_type, user_id, date_from, date_to).
	 * @param int   $per_page Results per page.
	 * @param int   $page Page number.
	 *
	 * @return \Illuminate\Pagination\LengthAwarePaginator|null
	 */
	public function get_activities( $filters = array(), $per_page = 20, $page = 1 ) {
		$query = Activity_Model::with( array( 'user', 'comments.user', 'associations' ) );

		// Filter by contact.
		if ( ! empty( $filters['contact_id'] ) ) {
			$query->where( 'contact_id', $filters['contact_id'] );
		}

		// Filter by deal using activity_associations table.
		if ( ! empty( $filters['entity_id'] ) && ! empty( $filters['entity_type'] ) && $filters['entity_type'] === 'deal' ) {
			// Check deal permissions.
			if ( ! $this->can_access_deal( $filters['entity_id'] ) ) {
				return null;
			}

			// Use whereHas to filter activities that have a deal association
			if ( class_exists( '\QuillCRM\Models\Activity_Association_Model' ) ) {
				$query->whereHas(
					'associations',
					function ( $q ) use ( $filters ) {
						$q->where( 'entity_type', $filters['entity_type'] )
							->where( 'entity_id', $filters['entity_id'] );
					}
				);
			}
		}

		// Filter by activity type.
		if ( ! empty( $filters['activity_type'] ) ) {
			if ( is_array( $filters['activity_type'] ) ) {
				$query->whereIn( 'activity_type', $filters['activity_type'] );
			} else {
				$query->where( 'activity_type', $filters['activity_type'] );
			}
		}

		// Filter by user.
		if ( ! empty( $filters['user_id'] ) ) {
			$query->where( 'user_id', $filters['user_id'] );
		}

		// Filter by date range.
		if ( ! empty( $filters['date_from'] ) ) {
			$query->whereDate( 'created_at', '>=', $filters['date_from'] );
		}
		if ( ! empty( $filters['date_to'] ) ) {
			$query->whereDate( 'created_at', '<=', $filters['date_to'] );
		}

		// Sort options.
		$sort_by    = $filters['sort_by'] ?? 'created_at';
		$sort_order = $filters['sort_order'] ?? 'desc';
		$query->orderBy( $sort_by, $sort_order );

		return $query->paginate( $per_page, array( '*' ), 'page', $page );
	}

	/**
	 * Get single activity
	 *
	 * @since 1.0.0
	 *
	 * @param int  $activity_id Activity ID.
	 * @param bool $with_comments Include comments.
	 *
	 * @return Activity_Model|null
	 */
	public function get_activity( $activity_id, $with_comments = false ) {
		$relations = array( 'user', 'associations' );
		if ( $with_comments ) {
			$relations[] = 'comments.user';
		}

		$activity = Activity_Model::with( $relations )->find( $activity_id );

		if ( ! $activity ) {
			return null;
		}

		// Check deal permissions if activity is associated with a deal.
		if ( $activity->deal_id && ! $this->can_access_deal( $activity->deal_id ) ) {
			return null;
		}

		return $activity;
	}

	/**
	 * Update activity (only for user-created activities)
	 *
	 * @since 1.0.0
	 *
	 * @param int      $activity_id Activity ID.
	 * @param array    $data Activity data to update.
	 * @param int|null $user_id User performing the action.
	 *
	 * @return Activity_Model|null
	 */
	public function update_activity( $activity_id, $data, $user_id = null ) {
		$activity = Activity_Model::with( array( 'associations' ) )->find( $activity_id );

		if ( ! $activity ) {
			return null;
		}

		// Check if activity is system-generated (immutable).
		if ( $activity->is_system_activity() ) {
			return null;
		}

		// Check deal permissions if activity is associated with a deal.
		if ( $activity->deal_id && ! $this->can_access_deal( $activity->deal_id ) ) {
			return null;
		}

		// Only allow the creator or admin to edit.
		if ( $user_id && $activity->user_id !== $user_id && ! current_user_can( 'manage_options' ) ) {
			return null;
		}

		// Update activity data based on type.
		switch ( $activity->activity_type ) {
			case 'note':
				$current_data = $activity->data ?? array();
				if ( isset( $data['title'] ) ) {
					$current_data['title'] = sanitize_text_field( $data['title'] );
				}
				if ( isset( $data['content'] ) ) {
					$current_data['content'] = wp_kses_post( $data['content'] );
				}
				$activity->data = $current_data;
				break;

			case 'email_sent':
				if ( isset( $data['email_data'] ) && is_array( $data['email_data'] ) ) {
					$activity->data = array(
						'subject'       => sanitize_text_field( $data['email_data']['subject'] ?? $activity->data['subject'] ?? '' ),
						'sent_at'       => $data['email_data']['sent_at'] ?? $activity->data['sent_at'] ?? current_time( 'mysql' ),
						'contact_email' => $activity->data['contact_email'] ?? '',
						'contact_name'  => $activity->data['contact_name'] ?? '',
					);
				}
				break;

			case 'call_logged':
				if ( isset( $data['call_data'] ) && is_array( $data['call_data'] ) ) {
					$activity->data = array(
						'duration'     => isset( $data['call_data']['duration'] ) ? intval( $data['call_data']['duration'] ) : ( $activity->data['duration'] ?? null ),
						'outcome'      => sanitize_text_field( $data['call_data']['outcome'] ?? $activity->data['outcome'] ?? '' ),
						'notes'        => wp_kses_post( $data['call_data']['notes'] ?? $activity->data['notes'] ?? '' ),
						'called_at'    => $data['call_data']['called_at'] ?? $activity->data['called_at'] ?? current_time( 'mysql' ),
						'phone_number' => sanitize_text_field( $data['call_data']['phone_number'] ?? $activity->data['phone_number'] ?? '' ),
					);
				}
				break;

			case 'meeting_scheduled':
				if ( isset( $data['meeting_data'] ) && is_array( $data['meeting_data'] ) ) {
					$activity->data = array(
						'title'                  => sanitize_text_field( $data['meeting_data']['title'] ?? $activity->data['title'] ?? '' ),
						'scheduled_at'           => sanitize_text_field( $data['meeting_data']['scheduled_at'] ?? $activity->data['scheduled_at'] ?? '' ),
						'duration'               => isset( $data['meeting_data']['duration'] ) ? intval( $data['meeting_data']['duration'] ) : ( $activity->data['duration'] ?? 60 ),
						'location'               => sanitize_text_field( $data['meeting_data']['location'] ?? $activity->data['location'] ?? '' ),
						'description'            => wp_kses_post( $data['meeting_data']['description'] ?? $activity->data['description'] ?? '' ),
						'primary_attendee_id'    => $activity->data['primary_attendee_id'] ?? null,
						'primary_attendee_name'  => $activity->data['primary_attendee_name'] ?? '',
						'primary_attendee_email' => $activity->data['primary_attendee_email'] ?? '',
					);
				}
				break;
		}

		$activity->save();

		do_action( 'quillcrm_activity_updated', $activity );

		return $activity;
	}

	/**
	 * Delete activity (only for user-created activities)
	 *
	 * @since 1.0.0
	 *
	 * @param int      $activity_id Activity ID.
	 * @param int|null $user_id User performing the action.
	 *
	 * @return bool
	 */
	public function delete_activity( $activity_id, $user_id = null ) {
		$activity = Activity_Model::find( $activity_id );

		if ( ! $activity ) {
			return false;
		}

		// Check if activity is system-generated (immutable).
		if ( $activity->is_system_activity() ) {
			return false;
		}

		// Check deal permissions if activity is associated with a deal.
		if ( $activity->deal_id && ! $this->can_access_deal( $activity->deal_id ) ) {
			return false;
		}

		// Only allow the creator or admin to delete.
		if ( $user_id && $activity->user_id !== $user_id && ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		do_action( 'quillcrm_activity_before_delete', $activity );

		$deleted = $activity->delete();

		if ( $deleted ) {
			do_action( 'quillcrm_activity_deleted', $activity_id );
		}

		return $deleted;
	}

	/**
	 * Bulk delete activities
	 *
	 * @since 1.0.0
	 *
	 * @param array    $activity_ids Array of activity IDs.
	 * @param int|null $user_id User performing the action.
	 *
	 * @return int Number of deleted activities.
	 */
	public function bulk_delete_activities( $activity_ids, $user_id = null ) {
		if ( empty( $activity_ids ) ) {
			return 0;
		}

		$deleted_count = 0;

		foreach ( $activity_ids as $activity_id ) {
			if ( $this->delete_activity( $activity_id, $user_id ) ) {
				++$deleted_count;
			}
		}

		do_action( 'quillcrm_activities_bulk_deleted', $activity_ids, $deleted_count );

		return $deleted_count;
	}

	/**
	 * Add comment to activity
	 *
	 * @since 1.0.0
	 *
	 * @param int      $activity_id Activity ID.
	 * @param string   $content Comment content.
	 * @param int|null $user_id User ID.
	 *
	 * @return Activity_Comment_Model|null
	 */
	public function add_comment( $activity_id, $content, $user_id = null ) {
		$activity = Activity_Model::find( $activity_id );

		if ( ! $activity ) {
			return null;
		}

		// Check deal permissions if activity is associated with a deal.
		if ( $activity->deal_id && ! $this->can_access_deal( $activity->deal_id ) ) {
			return null;
		}

		if ( empty( $content ) ) {
			return null;
		}

		$comment = Activity_Comment_Model::create(
			array(
				'activity_id' => $activity_id,
				'content'     => wp_kses_post( $content ),
				'user_id'     => $user_id ?: get_current_user_id(),
			)
		);

		do_action( 'quillcrm_activity_comment_added', $comment, $activity );

		return $comment;
	}

	/**
	 * Update comment
	 *
	 * @since 1.0.0
	 *
	 * @param int      $comment_id Comment ID.
	 * @param string   $content New content.
	 * @param int|null $user_id User performing the action.
	 *
	 * @return Activity_Comment_Model|null
	 */
	public function update_comment( $comment_id, $content, $user_id = null ) {
		$comment = Activity_Comment_Model::find( $comment_id );

		if ( ! $comment ) {
			return null;
		}

		// Check if user can edit this comment.
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
	 * @param int      $comment_id Comment ID.
	 * @param int|null $user_id User performing the action.
	 *
	 * @return bool
	 */
	public function delete_comment( $comment_id, $user_id = null ) {
		$comment = Activity_Comment_Model::find( $comment_id );

		if ( ! $comment ) {
			return false;
		}

		// Check if user can delete this comment.
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
	 * Get activity statistics
	 *
	 * @since 1.0.0
	 *
	 * @param array $filters Filter criteria.
	 *
	 * @return array
	 */
	public function get_activity_statistics( $filters = array() ) {
		$query = Activity_Model::query();

		// Filter by contact.
		if ( ! empty( $filters['contact_id'] ) ) {
			$query->where( 'contact_id', $filters['contact_id'] );
		}

		// Filter by deal using activity_associations table.
		if ( ! empty( $filters['entity_id'] ) && ! empty( $filters['entity_type'] ) && $filters['entity_type'] === 'deal' ) {
			if ( class_exists( '\QuillCRM\Models\Activity_Association_Model' ) ) {
				$query->whereHas(
					'associations',
					function ( $q ) use ( $filters ) {
						$q->where( 'entity_type', $filters['entity_type'] )
							->where( 'entity_id', $filters['entity_id'] );
					}
				);
			}
		}

		// Filter by user.
		if ( ! empty( $filters['user_id'] ) ) {
			$query->where( 'user_id', $filters['user_id'] );
		}

		// Filter by date range.
		if ( ! empty( $filters['date_from'] ) ) {
			$query->whereDate( 'created_at', '>=', $filters['date_from'] );
		}
		if ( ! empty( $filters['date_to'] ) ) {
			$query->whereDate( 'created_at', '<=', $filters['date_to'] );
		}

		$activities = $query->get();

		$stats = array(
			'total_activities' => $activities->count(),
			'notes'            => $activities->where( 'activity_type', 'note' )->count(),
			'emails'           => $activities->where( 'activity_type', 'email_sent' )->count(),
			'calls'            => $activities->where( 'activity_type', 'call_logged' )->count(),
			'meetings'         => $activities->where( 'activity_type', 'meeting_scheduled' )->count(),
			'stage_changes'    => $activities->where( 'activity_type', 'stage_changed' )->count(),
			'value_changes'    => $activities->where( 'activity_type', 'value_changed' )->count(),
			'status_changes'   => $activities->where( 'activity_type', 'status_changed' )->count(),
		);

		// Add activity breakdown by type.
		$stats['by_type'] = array();
		foreach ( $activities->groupBy( 'activity_type' ) as $type => $type_activities ) {
			$stats['by_type'][ $type ] = $type_activities->count();
		}

		return $stats;
	}

	/**
	 * Check if current user can access a deal
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID.
	 *
	 * @return bool
	 */
	private function can_access_deal( $deal_id ) {
		// If Pro plugin is not active, no deal access.
		if ( ! class_exists( '\QuillCRM_Pro\Models\Deal_Model' ) ) {
			return false;
		}

		$deal = \QuillCRM_Pro\Models\Deal_Model::find( $deal_id );

		if ( ! $deal ) {
			return false;
		}

		// Sales reps can only access their own deals.
		if ( Permissions::is_sales_rep() ) {
			return $deal->owner_id === get_current_user_id();
		}

		return true;
	}

	/**
	 * Get contact_id from deal
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID.
	 *
	 * @return int|null
	 */
	private function get_contact_id_from_deal( $deal_id ) {
		if ( ! class_exists( '\QuillCRM_Pro\Models\Deal_Model' ) ) {
			return null;
		}

		$deal = \QuillCRM_Pro\Models\Deal_Model::find( $deal_id );
		return $deal ? $deal->contact_id : null;
	}

	/**
	 * Get deal with contact information
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID.
	 *
	 * @return array
	 */
	private function get_deal_with_contact( $deal_id ) {
		if ( ! class_exists( '\QuillCRM_Pro\Models\Deal_Model' ) ) {
			return array();
		}

		$deal = \QuillCRM_Pro\Models\Deal_Model::with( 'contact' )->find( $deal_id );

		if ( ! $deal ) {
			return array();
		}

		$result = array(
			'contact_id' => $deal->contact_id,
		);

		if ( $deal->contact ) {
			$result['contact'] = array(
				'id'    => $deal->contact->id,
				'email' => $deal->contact->email,
				'name'  => trim( $deal->contact->first_name . ' ' . $deal->contact->last_name ),
			);
		}

		return $result;
	}
}
