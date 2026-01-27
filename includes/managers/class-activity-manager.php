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
use QuillCRM\Constants\Activity_Types;

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
		add_action( 'wp_login', array( $this, 'on_user_login' ), 10, 2 );
		add_action( 'wp_logout', array( $this, 'on_user_logout' ), 10, 1 );
	}

	public function on_user_login( $user_login, $user ) {
		Activity_Model::log_login(
			array(
				'user_id'    => $user->ID,
				'user_email' => $user->user_email,
			)
		);
	}

	public function on_user_logout( $user_id ) {
		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			return;
		}
		Activity_Model::log_logout(
			array(
				'user_id'    => $user_id,
				'user_email' => $user->user_email,
			)
		);
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

		// Must have contact_id OR both entity_id and entity_type.
		$has_entity_association = $entity_id && $entity_type;
		if ( ! $contact_id && ! $has_entity_association ) {
			return null;
		}

		if ( empty( $content ) && empty( $title ) ) {
			return null;
		}

		if ( $entity_type === \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL ) {
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

		// Must have contact_id OR both entity_id and entity_type.
		$has_entity_association = $entity_id && $entity_type;
		if ( ! $contact_id && ! $has_entity_association ) {
			return null;
		}

		if ( $entity_type === \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL ) {
			if ( ! $this->can_access_deal( $entity_id ) ) {
				return null;
			}
			// Get contact_id and contact info from deal if not provided.
			if ( ! $contact_id ) {
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
					'body'          => wp_kses_post( $data['body'] ?? '' ),
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

		// Must have contact_id OR both entity_id and entity_type.
		$has_entity_association = $entity_id && $entity_type;
		if ( ! $contact_id && ! $has_entity_association ) {
			return null;
		}

		// Check deal permissions if deal_id is provided.
		if ( $entity_type === \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL ) {
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

		// Must have contact_id OR both entity_id and entity_type.
		$has_entity_association = $entity_id && $entity_type;
		if ( ! $contact_id && ! $has_entity_association ) {
			return null;
		}

		if ( $entity_type === \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL ) {
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
		if ( ! empty( $filters['entity_id'] ) && ! empty( $filters['entity_type'] ) && $filters['entity_type'] === \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL ) {
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

		// Exclude activities that have deal associations when no entity type is provided.
		if ( empty( $filters['entity_type'] ) ) {
			if ( class_exists( '\QuillCRM\Models\Activity_Association_Model' ) ) {
				$query->whereDoesntHave(
					'associations',
					function ( $q ) {
						$q->where( 'entity_type', \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL );
					}
				);
			}
		}

		// Filter by activity type.
		if ( ! empty( $filters['activity_type'] ) ) {
			$activity_types = $filters['activity_type'];
			// Handle comma-separated string.
			if ( is_string( $activity_types ) && strpos( $activity_types, ',' ) !== false ) {
				$activity_types = array_map( 'trim', explode( ',', $activity_types ) );
			}
			if ( is_array( $activity_types ) ) {
				$query->whereIn( 'activity_type', $activity_types );
			} else {
				$query->where( 'activity_type', $activity_types );
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
						'body'          => wp_kses_post( $data['email_data']['body'] ?? $activity->data['body'] ?? '' ),
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
		if ( ! empty( $filters['entity_id'] ) && ! empty( $filters['entity_type'] ) && $filters['entity_type'] === \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL ) {
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

	/**
	 * Get unified timeline combining activities and tasks
	 *
	 * Uses raw SQL UNION query for optimal performance when combining
	 * data from multiple tables. Always includes all activities, and includes
	 * tasks automatically when Pro is active.
	 *
	 * Supported filters:
	 * - contact_id: Filter by contact
	 * - entity_id + entity_type: Filter by associated entity (deal, campaign)
	 * - user_id: Filter by creator (activities) or assignee (tasks)
	 * - date_from, date_to: Date range filter
	 * - sort_by, sort_order: Sorting options
	 *
	 * @since 1.x.0
	 *
	 * @param array $filters  Filter criteria.
	 * @param int   $per_page Results per page.
	 * @param int   $page     Page number.
	 *
	 * @return array Array with 'data' and 'meta' keys.
	 */
	public function get_unified_timeline(
		array $filters,
		int $per_page = 20,
		int $page = 1
	): array {
		// Sanitize pagination parameters to prevent division by zero and invalid values.
		$per_page = max( 1, $per_page );
		$page     = max( 1, $page );

		$pro_active = class_exists( '\QuillCRM_Pro\Models\Task_Model' );
		global $wpdb;

		// Permission check for deal access.
		if ( ! empty( $filters['entity_type'] ) &&
			$filters['entity_type'] == \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL ) {
			if ( ! $this->can_access_deal( $filters['entity_id'] ) ) {
				return array(
					'data' => array(),
					'meta' => array(
					'total'        => 0,
					'per_page'     => $per_page,
					'current_page' => $page,
					'total_pages'  => 0,
					'pro_active'   => $pro_active,
					'error'        => 'access_denied',
					),
				);
			}
		}

		$select_queries = array();
		$count_queries  = array();

		// Build activities query.
		$activities_sql = $this->build_activities_union_sql( $filters, $wpdb );
		if ( $activities_sql ) {
			$select_queries[] = $activities_sql['select'];
			$count_queries[]  = $activities_sql['count'];
		}

		// Include tasks when Pro is active.
		// Note: activity_type filtering is handled by get_activities(), not here.
		// This method always returns all activities + tasks (when Pro active).
		if ( $pro_active ) {
			$tasks_sql = $this->build_tasks_union_sql( $filters, $wpdb );
			if ( $tasks_sql ) {
				$select_queries[] = $tasks_sql['select'];
				$count_queries[]  = $tasks_sql['count'];
			}
		}

		// If no queries, return empty.
		if ( empty( $select_queries ) ) {
			return array(
				'data' => array(),
				'meta' => array(
				'total'        => 0,
				'per_page'     => $per_page,
				'current_page' => $page,
				'total_pages'  => 0,
				'pro_active'   => $pro_active,
				),
			);
		}

		// Get total count.
		$total = 0;
		foreach ( $count_queries as $count_sql ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
			$count_result = $wpdb->get_var( $count_sql );
			$total       += intval( $count_result );
		}

		// Build final UNION query with sorting and pagination.
		$offset     = ( $page - 1 ) * $per_page;
		$sort_by    = $this->sanitize_sort_field( $filters['sort_by'] ?? 'created_at' );
		$sort_order = strtoupper( $filters['sort_order'] ?? 'DESC' ) === 'ASC' ? 'ASC' : 'DESC';

		$union_sql = '(' . implode( ') UNION ALL (', $select_queries ) . ')';

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$final_sql = $wpdb->prepare(
			"SELECT * FROM ({$union_sql}) AS combined
			ORDER BY {$sort_by} {$sort_order}
			LIMIT %d OFFSET %d",
			$per_page,
			$offset
		);

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$results = $wpdb->get_results( $final_sql );

		// Batch load users.
		$user_ids = array_unique( array_filter( wp_list_pluck( $results, 'user_id' ) ) );
		$users    = $this->batch_load_users( $user_ids );

		// Transform results.
		$data = array();
		foreach ( $results as $row ) {
			$user = $users[ $row->user_id ] ?? null;

			if ( $row->item_type === 'activity' ) {
				$data[] = $this->transform_activity_row( $row, $user );
			} else {
				$data[] = $this->transform_task_row( $row, $user );
			}
		}

		return array(
			'data' => $data,
			'meta' => array(
			'total'        => $total,
			'per_page'     => $per_page,
			'current_page' => $page,
			'total_pages'  => (int) ceil( $total / $per_page ),
			'pro_active'   => $pro_active,
			),
		);
	}

	/**
	 * Build activities SQL for UNION query
	 *
	 * @since 1.x.0
	 *
	 * @param array $filters Filters.
	 * @param wpdb  $wpdb    WordPress database object.
	 *
	 * @return array|null SQL queries.
	 */
	private function build_activities_union_sql( array $filters, $wpdb ): ?array {
		$activities_table   = $wpdb->prefix . 'quillcrm_activities';
		$associations_table = $wpdb->prefix . 'quillcrm_activity_associations';
		$comments_table     = $wpdb->prefix . 'quillcrm_activity_comments';

		$where_clauses = array( '1=1' );
		$join_clauses  = array();

		// Contact filter.
		if ( ! empty( $filters['contact_id'] ) ) {
			$where_clauses[] = $wpdb->prepare( 'a.contact_id = %d', $filters['contact_id'] );
		}

		// Deal/Entity filter (via associations).
		if ( ! empty( $filters['entity_type'] ) && ! empty( $filters['entity_id'] ) ) {
			$join_clauses[]  = "INNER JOIN {$associations_table} aa ON a.id = aa.activity_id";
			$where_clauses[] = $wpdb->prepare(
				'aa.entity_type = %d AND aa.entity_id = %d',
				$filters['entity_type'],
				$filters['entity_id']
			);
		}

		// Exclude activities with deal associations when no entity_type is provided.
		if ( empty( $filters['entity_type'] ) ) {
			$deal_type       = \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL;
			$where_clauses[] = "NOT EXISTS (
				SELECT 1 FROM {$associations_table} excl
				WHERE excl.activity_id = a.id AND excl.entity_type = {$deal_type}
			)";
		}

		// User filter.
		if ( ! empty( $filters['user_id'] ) ) {
			$where_clauses[] = $wpdb->prepare( 'a.user_id = %d', $filters['user_id'] );
		}

		// Date filters - use scheduled/called date from JSON data if available, fallback to created_at.
		// This ensures meetings/calls are filtered by their scheduled time, not creation time.
		// - Meetings use: scheduled_at
		// - Calls use: called_at
		// - Other activities: created_at
		if ( ! empty( $filters['date_from'] ) ) {
			$where_clauses[] = $wpdb->prepare(
				'DATE(COALESCE(
					JSON_UNQUOTE(JSON_EXTRACT(a.data, "$.scheduled_at")),
					JSON_UNQUOTE(JSON_EXTRACT(a.data, "$.called_at")),
					a.created_at
				)) >= %s',
				$filters['date_from']
			);
		}
		if ( ! empty( $filters['date_to'] ) ) {
			$where_clauses[] = $wpdb->prepare(
				'DATE(COALESCE(
					JSON_UNQUOTE(JSON_EXTRACT(a.data, "$.scheduled_at")),
					JSON_UNQUOTE(JSON_EXTRACT(a.data, "$.called_at")),
					a.created_at
				)) <= %s',
				$filters['date_to']
			);
		}

		// LEFT JOIN to get deal_id from associations (entity_type = 2 for deals).
		$deal_entity_type = 2; // Activity_Association_Model::ENTITY_TYPE_DEAL.
		$join_clauses[]   = "LEFT JOIN {$associations_table} deal_assoc ON a.id = deal_assoc.activity_id AND deal_assoc.entity_type = {$deal_entity_type}";

		$where_sql  = implode( ' AND ', $where_clauses );
		$joins_sql  = implode( ' ', $join_clauses );

		// Select query - normalized columns for UNION.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$select_sql = "SELECT
			a.id,
			'activity' as item_type,
			a.activity_type,
			NULL as task_type,
			a.contact_id,
			deal_assoc.entity_id as deal_id,
			a.data,
			a.user_id,
			a.created_at,
			a.updated_at,
			a.created_at as sort_timestamp,
			NULL as title,
			NULL as description,
			NULL as status,
			CASE
			WHEN a.activity_type IN ('meeting_scheduled', 'call_logged') THEN
				CASE
					WHEN DATE(COALESCE(
						JSON_UNQUOTE(JSON_EXTRACT(a.data, '$.scheduled_at')),
						JSON_UNQUOTE(JSON_EXTRACT(a.data, '$.called_at'))
					)) < CURDATE() THEN 'completed'
					WHEN DATE(COALESCE(
						JSON_UNQUOTE(JSON_EXTRACT(a.data, '$.scheduled_at')),
						JSON_UNQUOTE(JSON_EXTRACT(a.data, '$.called_at'))
					)) = CURDATE() THEN 'due_today'
					ELSE 'upcoming'
				END
			ELSE NULL
		END as display_status,
			NULL as priority,
			NULL as due_date,
			NULL as due_time,
			NULL as is_overdue,
			(SELECT COUNT(*) FROM {$comments_table} c WHERE c.activity_id = a.id) as comments_count
		FROM {$activities_table} a
		{$joins_sql}
		WHERE {$where_sql}";

		// Count query - only need the filter joins, not the deal_id lookup join.
		$filter_joins = array();
		if ( ! empty( $filters['entity_type'] ) && ! empty( $filters['entity_id'] ) ) {
			$filter_joins[] = "INNER JOIN {$associations_table} aa ON a.id = aa.activity_id";
		}
		$filter_joins_sql = implode( ' ', $filter_joins );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$count_sql = "SELECT COUNT(*) FROM {$activities_table} a {$filter_joins_sql} WHERE {$where_sql}";

		return array(
			'select' => $select_sql,
			'count'  => $count_sql,
		);
	}

	/**
	 * Build tasks SQL for UNION query
	 *
	 * @since 1.x.0
	 *
	 * @param array $filters Filters.
	 * @param wpdb  $wpdb    WordPress database object.
	 *
	 * @return array|null SQL queries.
	 */
	private function build_tasks_union_sql( array $filters, $wpdb ): ?array {
		$tasks_table = $wpdb->prefix . 'quillcrm_tasks';

		$where_clauses = array( '1=1' );

		// Contact filter.
		if ( ! empty( $filters['contact_id'] ) ) {
			$where_clauses[] = $wpdb->prepare(
				't.entity_type = %d AND t.entity_id = %d',
				\QuillCRM_Pro\Constants\Task_Entity_Type::CONTACT,
				$filters['contact_id']
			);
		}

		// Deal filter.
		if ( ! empty( $filters['entity_type'] ) &&
			$filters['entity_type'] == \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL &&
			! empty( $filters['entity_id'] ) ) {
			$where_clauses[] = $wpdb->prepare(
				't.entity_type = %d AND t.entity_id = %d',
				\QuillCRM_Pro\Constants\Task_Entity_Type::DEAL,
				$filters['entity_id']
			);
		}

		// User filter (assigned_to for tasks).
		if ( ! empty( $filters['user_id'] ) ) {
			$where_clauses[] = $wpdb->prepare( 't.assigned_to = %d', $filters['user_id'] );
		}

		// Date filters - use due_date for tasks (more relevant for "upcoming" filtering).
		// Tasks without due_date are excluded from date filtering.
		if ( ! empty( $filters['date_from'] ) ) {
			$where_clauses[] = $wpdb->prepare( 't.due_date IS NOT NULL AND DATE(t.due_date) >= %s', $filters['date_from'] );
		}
		if ( ! empty( $filters['date_to'] ) ) {
			$where_clauses[] = $wpdb->prepare( 't.due_date IS NOT NULL AND DATE(t.due_date) <= %s', $filters['date_to'] );
		}

		$where_sql = implode( ' AND ', $where_clauses );

		// Get entity type constants.
		$contact_entity_type = \QuillCRM_Pro\Constants\Task_Entity_Type::CONTACT;
		$deal_entity_type    = \QuillCRM_Pro\Constants\Task_Entity_Type::DEAL;

		// Select query - normalized columns for UNION.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$select_sql = "SELECT
			t.id,
			'task' as item_type,
			NULL as activity_type,
			t.task_type,
			CASE
				WHEN t.entity_type = {$contact_entity_type} THEN t.entity_id
				ELSE NULL
			END as contact_id,
			CASE
				WHEN t.entity_type = {$deal_entity_type} THEN t.entity_id
				ELSE NULL
			END as deal_id,
			NULL as data,
			t.assigned_to as user_id,
			t.created_at,
			t.updated_at,
			t.created_at as sort_timestamp,
			t.title,
			t.description,
			t.status,
			CASE
				WHEN t.status = 'completed' THEN 'completed'
				WHEN t.due_date < CURDATE() THEN 'overdue'
				WHEN t.due_date = CURDATE() THEN 'due_today'
				ELSE 'upcoming'
			END as display_status,
			t.priority,
			t.due_date,
			t.due_time,
			CASE WHEN t.status = 'pending' AND t.due_date < CURDATE() THEN 1 ELSE 0 END as is_overdue,
			0 as comments_count
		FROM {$tasks_table} t
		WHERE {$where_sql}";

		// Count query.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$count_sql = "SELECT COUNT(*) FROM {$tasks_table} t WHERE {$where_sql}";

		return array(
			'select' => $select_sql,
			'count'  => $count_sql,
		);
	}

	/**
	 * Batch load users by IDs
	 *
	 * @since 1.x.0
	 *
	 * @param array $user_ids User IDs.
	 *
	 * @return array Users array.
	 */
	private function batch_load_users( array $user_ids ): array {
		if ( empty( $user_ids ) ) {
			return array();
		}

		global $wpdb;

		$placeholders = implode( ',', array_fill( 0, count( $user_ids ), '%d' ) );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT ID, display_name, user_email FROM {$wpdb->users} WHERE ID IN ({$placeholders})",
				...$user_ids
			)
		);

		$users = array();
		foreach ( $results as $user ) {
			$users[ $user->ID ] = array(
				'id'           => (int) $user->ID,
				'display_name' => $user->display_name,
				'email'        => $user->user_email,
			);
		}

		return $users;
	}

	/**
	 * Transform activity row from SQL result
	 *
	 * @since 1.x.0
	 *
	 * @param object     $row  Activity row.
	 * @param array|null $user User data.
	 *
	 * @return array Transformed activity.
	 */
	private function transform_activity_row( $row, ?array $user ): array {
		$data = ! empty( $row->data ) ? json_decode( $row->data, true ) : array();

		$editable_types = Activity_Types::get_editable_types();
		$system_types   = Activity_Types::get_system_types();

		return array(
			'id'                => (int) $row->id,
			'item_type'         => 'activity',
			'activity_type'     => $row->activity_type,
			'contact_id'        => $row->contact_id ? (int) $row->contact_id : null,
			'deal_id'           => ! empty( $row->deal_id ) ? (int) $row->deal_id : null,
			'data'              => $data,
			'user_id'           => $row->user_id ? (int) $row->user_id : null,
			'user'              => $user,
			'formatted_message' => $this->format_activity_message( $row->activity_type, $user, $data ),
			'is_editable'       => in_array( $row->activity_type, $editable_types, true ),
			'is_system'         => in_array( $row->activity_type, $system_types, true ),
			'display_status'    => $row->display_status ?? null,
			'comments_count'    => (int) $row->comments_count,
			'created_at'        => $row->created_at,
			'updated_at'        => $row->updated_at,
		);
	}

	/**
	 * Transform task row from SQL result
	 *
	 * @since 1.x.0
	 *
	 * @param object     $row  Task row.
	 * @param array|null $user User data.
	 *
	 * @return array Transformed task.
	 */
	private function transform_task_row( $row, ?array $user ): array {
		return array(
			'id'             => (int) $row->id,
			'item_type'      => 'task',
			'task_type'      => $row->task_type,
			'contact_id'     => $row->contact_id ? (int) $row->contact_id : null,
			'deal_id'        => ! empty( $row->deal_id ) ? (int) $row->deal_id : null,
			'title'          => $row->title,
			'description'    => $row->description,
			'user_id'        => $row->user_id ? (int) $row->user_id : null,
			'user'           => $user,
			'status'         => $row->status,
			'display_status' => $row->display_status,
			'priority'       => $row->priority,
			'due_date'       => $row->due_date,
			'due_time'       => $row->due_time,
			'is_overdue'     => (bool) $row->is_overdue,
			'created_at'     => $row->created_at,
			'updated_at'     => $row->updated_at,
		);
	}

	/**
	 * Format activity message
	 *
	 * @since 1.x.0
	 *
	 * @param string     $type Activity type.
	 * @param array|null $user User data.
	 * @param array      $data Activity data.
	 *
	 * @return string Formatted message.
	 */
	private function format_activity_message( string $type, ?array $user, array $data ): string {
		$user_name = $user ? $user['display_name'] : null;
		return Activity_Types::get_activity_message( $type, $user_name );
	}

	/**
	 * Sanitize sort field
	 *
	 * @since 1.x.0
	 *
	 * @param string $field Sort field.
	 *
	 * @return string Sanitized field.
	 */
	private function sanitize_sort_field( string $field ): string {
		$allowed = array( 'created_at', 'sort_timestamp', 'due_date' );

		if ( $field === 'due_date' ) {
			return 'COALESCE(due_date, sort_timestamp)';
		}

		return in_array( $field, $allowed, true ) ? $field : 'sort_timestamp';
	}
}
