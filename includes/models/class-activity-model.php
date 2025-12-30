<?php

/**
 * Activity Model
 * Unified model for all activity types (messages, notes, calls, meetings, system events)
 * Works for both contacts and deals
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;

/**
 * Activity_Model class
 */
class Activity_Model extends Model {






	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_activities';

	/**
	 * Primary key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $primary_key = 'id';

	/**
	 * Fillable columns
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $fillable = array(
		'contact_id',
		'activity_type',
		'data',
		'user_id',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'data' => 'array',
	);

	/**
	 * Attributes to append to model's array/JSON form
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $appends = array(
		'deal_id',
	);

	/**
	 * Timestamps
	 *
	 * @var bool
	 *
	 * @since 1.0.0
	 */
	public $timestamps = true;

	/**
	 * Validation rules
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	public $rules = array(
		'contact_id'    => 'nullable|integer',
		'activity_type' => 'required|in:note,created,stage_changed,value_changed,status_changed,email_sent,email_received,call_logged,meeting_scheduled,sms_sent,sms_received,whatsapp_sent,whatsapp_received',
		'user_id'       => 'nullable|integer',
	);

	/**
	 * Validation messages
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	public $messages = array(
		'activity_type.required' => 'Activity type is required.',
		'activity_type.in'       => 'Invalid activity type.',
	);

	/**
	 * Contact relationship
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		 return $this->belongsTo( Contact_Model::class, 'contact_id' );
	}

	/**
	 * User relationship
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id', 'ID' );
	}

	/**
	 * Tracking relationship (for messages that need tracking)
	 *
	 * For individual messages, tracking.source_id points to this activity.
	 * Note: source_type must be INDIVIDUAL (3) for this relationship.
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasOne
	 */
	public function tracking() {
		return $this->hasOne( Communication_Tracking_Model::class, 'source_id' )
			->where( 'source_type', \QuillCRM\Constants\Message_Source_Types::INDIVIDUAL );
	}

	/**



	/**
	 * Comments relationship
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function comments() {
		return $this->hasMany( Activity_Comment_Model::class, 'activity_id', 'id' )->orderBy( 'created_at', 'asc' );
	}

	/**
	 * Activity associations relationship (many associations per activity)
	 * Links this activity to deals, companies, or projects
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function associations() {
		return $this->hasMany( Activity_Association_Model::class, 'activity_id', 'id' );
	}

	/**
	 * Get activity associations of a specific type
	 *
	 * @since 1.0.0
	 *
	 * @param string $type Entity type (deal, company, project).
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function associationsByType( $type ) {
		return $this->associations()->where( 'entity_type', $type );
	}

	/**
	 * Get deal associations for this activity
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function dealAssociations() {
		return $this->associationsByType( Activity_Association_Model::ENTITY_TYPE_DEAL );
	}

	/**
	 * Get campaign associations for this activity
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function campaignAssociations() {
		return $this->associationsByType( Activity_Association_Model::ENTITY_TYPE_CAMPAIGN );
	}

	/**
	 * Get deal_id accessor for backward compatibility
	 * Returns the first associated deal's ID or null
	 *
	 * @since 1.0.0
	 *
	 * @return int|null
	 */
	public function getDealIdAttribute() {
		if ( ! $this->relationLoaded( 'associations' ) ) {
			// Load associations if not already loaded
			$this->load( 'associations' );
		}

		$deal_association = $this->associations->where( 'entity_type', Activity_Association_Model::ENTITY_TYPE_DEAL )->first();
		return $deal_association ? $deal_association->entity_id : null;
	}

	/**
	 * Scope: Filter by contact
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 * @param int                                   $contact_id Contact ID.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeForContact( $query, $contact_id ) {
		return $query->where( 'contact_id', $contact_id );
	}

	/**
	 * Scope: Filter by deal using activity_associations table
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 * @param int                                   $deal_id Deal ID.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeForDeal( $query, $deal_id ) {
		return $query->whereHas(
			'associations',
			function ( $q ) use ( $deal_id ) {
				$q->where( 'entity_type', Activity_Association_Model::ENTITY_TYPE_DEAL )
					->where( 'entity_id', $deal_id );
			}
		)->orderBy( 'created_at', 'desc' );
	}

	/**
	 * Scope: Filter by activity type
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 * @param string|array                          $type Activity type(s).
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeByType( $query, $type ) {
		if ( is_array( $type ) ) {
			return $query->whereIn( 'activity_type', $type );
		}
		return $query->where( 'activity_type', $type );
	}

	/**
	 * Scope: Only messages (email, SMS, WhatsApp)
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeMessages( $query ) {
		return $query->whereIn( 'activity_type', array( 'email_sent', 'sms_sent', 'whatsapp_sent' ) );
	}

	/**
	 * Scope: Only activities with tracking
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeTracked( $query ) {
		return $query->has( 'tracking' );
	}

	/**
	 * Scope: Only notes
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeNotes( $query ) {
		return $query->where( 'activity_type', 'note' );
	}

	/**
	 * Scope: User-created activities (editable)
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeUserCreated( $query ) {
		return $query->whereIn( 'activity_type', array( 'note', 'email_sent', 'call_logged', 'meeting_scheduled' ) );
	}

	/**
	 * Scope: System-generated activities (immutable)
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeSystemGenerated( $query ) {
		return $query->whereIn( 'activity_type', array( 'created', 'stage_changed', 'value_changed', 'status_changed' ) );
	}

	/**
	 * Get formatted activity message
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function getFormattedMessageAttribute() {
		$user_name = $this->user ? $this->user->display_name : __( 'Unknown User', 'quillcrm' );

		switch ( $this->activity_type ) {
			case 'created':
				return sprintf(
					/* translators: %s: user name */
					__( '%s created this deal', 'quillcrm' ),
					$user_name
				);

			case 'stage_changed':
				$old_stage_name = __( 'Unknown Stage', 'quillcrm' );
				$new_stage_name = __( 'Unknown Stage', 'quillcrm' );

				if ( class_exists( '\QuillCRM_Pro\Models\Pipeline_Stage_Model' ) ) {
					$old_stage = \QuillCRM_Pro\Models\Pipeline_Stage_Model::find( $this->data['old_stage_id'] ?? 0 );
					$new_stage = \QuillCRM_Pro\Models\Pipeline_Stage_Model::find( $this->data['new_stage_id'] ?? 0 );

					$old_stage_name = $old_stage ? $old_stage->name : $old_stage_name;
					$new_stage_name = $new_stage ? $new_stage->name : $new_stage_name;
				}

				return sprintf(
					/* translators: 1: user name, 2: old stage name, 3: new stage name */
					__( '%1$s moved deal from "%2$s" to "%3$s"', 'quillcrm' ),
					$user_name,
					$old_stage_name,
					$new_stage_name
				);

			case 'value_changed':
				return sprintf(
					/* translators: 1: user name, 2: old value, 3: new value */
					__( '%1$s changed deal value from %2$s to %3$s', 'quillcrm' ),
					$user_name,
					$this->data['old_value'] ?? 0,
					$this->data['new_value'] ?? 0
				);

			case 'status_changed':
				$status = $this->data['status'] ?? 'unknown';
				if ( 'won' === $status ) {
					return sprintf(
						/* translators: %s: user name */
						__( '%s marked deal as won', 'quillcrm' ),
						$user_name
					);
				} elseif ( 'lost' === $status ) {
					$reason = ! empty( $this->data['reason'] ) ? ' - ' . $this->data['reason'] : '';
					return sprintf(
						/* translators: 1: user name, 2: reason */
						__( '%1$s marked deal as lost%2$s', 'quillcrm' ),
						$user_name,
						$reason
					);
				}
				return sprintf(
					/* translators: 1: user name, 2: status */
					__( '%1$s changed deal status to %2$s', 'quillcrm' ),
					$user_name,
					$status
				);

			case 'note':
				return sprintf(
					/* translators: %s: user name */
					__( '%s added a note', 'quillcrm' ),
					$user_name
				);

			case 'email_sent':
				$subject       = $this->data['subject'] ?? '';
				$contact_email = $this->data['contact_email'] ?? '';
				$contact_name  = $this->data['contact_name'] ?? '';

				$message = sprintf(
					/* translators: %s: user name */
					__( '%s sent an email', 'quillcrm' ),
					$user_name
				);

				if ( ! empty( $subject ) ) {
					$message .= sprintf(
						/* translators: %s: email subject */
						__( ' with subject "%s"', 'quillcrm' ),
						$subject
					);
				}

				if ( ! empty( $contact_email ) ) {
					$recipient = ! empty( $contact_name ) ? $contact_name : $contact_email;
					$message  .= sprintf(
						/* translators: %s: recipient */
						__( ' to %s', 'quillcrm' ),
						$recipient
					);
				}

				return $message;

			case 'call_logged':
				$outcome      = $this->data['outcome'] ?? '';
				$duration     = $this->data['duration'] ?? null;
				$phone_number = $this->data['phone_number'] ?? '';

				$message = sprintf(
					/* translators: %s: user name */
					__( '%s logged a call', 'quillcrm' ),
					$user_name
				);

				if ( ! empty( $phone_number ) ) {
					$message .= sprintf(
						/* translators: %s: phone number */
						__( ' to %s', 'quillcrm' ),
						$phone_number
					);
				}

				if ( ! empty( $outcome ) ) {
					$message .= sprintf(
						/* translators: %s: call outcome */
						__( ' with outcome: %s', 'quillcrm' ),
						$outcome
					);
				}

				if ( $duration ) {
					$message .= sprintf(
						/* translators: %d: duration in minutes */
						__( ' (Duration: %d minutes)', 'quillcrm' ),
						$duration
					);
				}

				return $message;

			case 'meeting_scheduled':
				$title         = $this->data['title'] ?? '';
				$scheduled_at  = $this->data['scheduled_at'] ?? '';
				$attendee_name = $this->data['primary_attendee_name'] ?? '';

				$message = sprintf(
					/* translators: %s: user name */
					__( '%s scheduled a meeting', 'quillcrm' ),
					$user_name
				);

				if ( ! empty( $title ) ) {
					$message .= sprintf( ' "%s"', $title );
				}

				if ( ! empty( $attendee_name ) ) {
					$message .= sprintf(
						/* translators: %s: attendee name */
						__( ' with %s', 'quillcrm' ),
						$attendee_name
					);
				}

				if ( ! empty( $scheduled_at ) ) {
					$formatted_date = date_i18n( 'M j, Y \a\t g:i A', strtotime( $scheduled_at ) );
					$message       .= sprintf(
						/* translators: %s: scheduled date */
						__( ' for %s', 'quillcrm' ),
						$formatted_date
					);
				}

				return $message;

			case 'sms_sent':
				return sprintf(
					/* translators: %s: user name */
					__( '%s sent an SMS', 'quillcrm' ),
					$user_name
				);

			case 'whatsapp_sent':
				return sprintf(
					/* translators: %s: user name */
					__( '%s sent a WhatsApp message', 'quillcrm' ),
					$user_name
				);

			default:
				return sprintf(
					/* translators: %s: user name */
					__( '%s performed an action', 'quillcrm' ),
					$user_name
				);
		}
	}

	/**
	 * Get subject from data JSON
	 *
	 * @since 1.0.0
	 *
	 * @return string|null
	 */
	public function get_subject() {
		if ( ! is_array( $this->data ) ) {
			return null;
		}
		return $this->data['subject'] ?? null;
	}

	/**
	 * Get body from data JSON
	 *
	 * @since 1.0.0
	 *
	 * @return string|null
	 */
	public function get_body() {
		if ( ! is_array( $this->data ) ) {
			return null;
		}
		return $this->data['body'] ?? null;
	}

	/**
	 * Get content from data JSON (for notes)
	 *
	 * @since 1.0.0
	 *
	 * @return string|null
	 */
	public function get_content() {
		if ( ! is_array( $this->data ) ) {
			return null;
		}
		return $this->data['content'] ?? null;
	}

	/**
	 * Get note title from data JSON
	 *
	 * @since 1.0.0
	 *
	 * @return string|null
	 */
	public function get_title() {
		if ( ! is_array( $this->data ) ) {
			return null;
		}
		return $this->data['title'] ?? null;
	}

	/**
	 * Search activities by content
	 *
	 * @since 1.0.0
	 *
	 * @param string $search_term Search term.
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public static function search_content( $search_term ) {
		return self::whereRaw(
			'JSON_SEARCH(data, "one", ?) IS NOT NULL',
			array( "%{$search_term}%" )
		)->get();
	}

	/**
	 * Get by tracking ID
	 *
	 * @since 1.0.0
	 *
	 * @param int $tracking_id Tracking ID.
	 *
	 * @return Activity_Model|null
	 */
	public static function get_by_tracking_id( $tracking_id ) {
		return self::whereHas(
			'tracking',
			function ( $query ) use ( $tracking_id ) {
				$query->where( 'id', $tracking_id );
			}
		)->first();
	}

	/**
	 * Check if activity is a message type
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_message() {
		return in_array( $this->activity_type, array( 'email_sent', 'sms_sent', 'whatsapp_sent' ), true );
	}

	/**
	 * Check if activity has tracking
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function has_tracking() {
		return $this->tracking()->exists();
	}

	/**
	 * Check if activity is a note
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_note() {
		 return 'note' === $this->activity_type;
	}

	/**
	 * Check if activity type is editable (user-created)
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_editable() {
		 $editable_types = array( 'note', 'email_sent', 'call_logged', 'meeting_scheduled' );
		return in_array( $this->activity_type, $editable_types, true );
	}

	/**
	 * Check if activity type is system-generated (immutable)
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_system_activity() {
		$system_types = array( 'created', 'stage_changed', 'value_changed', 'status_changed' );
		return in_array( $this->activity_type, $system_types, true );
	}

	/**
	 * Transform activity to note format for API response
	 * Returns format expected by frontend: { id, title, type, note, created_at, updated_at }
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function to_note_format() {
		$data = $this->data ?? array();
		return array(
			'id'         => $this->id,
			'contact_id' => $this->contact_id,
			'deal_id'    => $this->deal_id,
			'title'      => $data['title'] ?? '',
			'type'       => $data['type'] ?? 'note',
			'note'       => $data['content'] ?? $data['note'] ?? '',
			'user_id'    => $this->user_id,
			'created_at' => $this->created_at,
			'updated_at' => $this->updated_at,
		);
	}

	/**
	 * Add a note activity
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Note data (contact_id, deal_id, title, content, user_id).
	 *
	 * @return Activity_Model
	 */
	public static function add_note( $data ) {
		return self::create(
			array(
				'contact_id'    => $data['contact_id'] ?? null,
				'deal_id'       => $data['deal_id'] ?? null,
				'activity_type' => 'note',
				'data'          => array(
					'title'   => $data['title'] ?? '',
					'content' => $data['content'] ?? '',
				),
				'user_id'       => $data['user_id'] ?? get_current_user_id(),
			)
		);
	}

	/**
	 * Log email activity
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Email data.
	 *
	 * @return Activity_Model
	 */
	public static function log_email( $data ) {
		return self::create(
			array(
				'contact_id'    => $data['contact_id'] ?? null,
				'deal_id'       => $data['deal_id'] ?? null,
				'activity_type' => 'email_sent',
				'data'          => array(
					'subject'       => $data['subject'] ?? '',
					'sent_at'       => $data['sent_at'] ?? current_time( 'mysql' ),
					'contact_email' => $data['contact_email'] ?? '',
					'contact_name'  => $data['contact_name'] ?? '',
				),
				'user_id'       => $data['user_id'] ?? get_current_user_id(),
			)
		);
	}

	/**
	 * Log call activity
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Call data.
	 *
	 * @return Activity_Model
	 */
	public static function log_call( $data ) {
		return self::create(
			array(
				'contact_id'    => $data['contact_id'] ?? null,
				'deal_id'       => $data['deal_id'] ?? null,
				'activity_type' => 'call_logged',
				'data'          => array(
					'duration'     => isset( $data['duration'] ) ? intval( $data['duration'] ) : null,
					'outcome'      => $data['outcome'] ?? '',
					'notes'        => $data['notes'] ?? '',
					'called_at'    => $data['called_at'] ?? current_time( 'mysql' ),
					'phone_number' => $data['phone_number'] ?? '',
				),
				'user_id'       => $data['user_id'] ?? get_current_user_id(),
			)
		);
	}

	/**
	 * Schedule meeting activity
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Meeting data.
	 *
	 * @return Activity_Model
	 */
	public static function schedule_meeting( $data ) {
		return self::create(
			array(
				'contact_id'    => $data['contact_id'] ?? null,
				'deal_id'       => $data['deal_id'] ?? null,
				'activity_type' => 'meeting_scheduled',
				'data'          => array(
					'title'                  => $data['title'] ?? '',
					'scheduled_at'           => $data['scheduled_at'] ?? '',
					'duration'               => isset( $data['duration'] ) ? intval( $data['duration'] ) : 60,
					'location'               => $data['location'] ?? '',
					'description'            => $data['description'] ?? '',
					'primary_attendee_id'    => $data['primary_attendee_id'] ?? null,
					'primary_attendee_name'  => $data['primary_attendee_name'] ?? '',
					'primary_attendee_email' => $data['primary_attendee_email'] ?? '',
				),
				'user_id'       => $data['user_id'] ?? get_current_user_id(),
			)
		);
	}


	/**
	 * Boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		 parent::boot();

		static::creating(
			function ( $activity ) {
				if ( ! $activity->created_at ) {
					$activity->created_at = current_time( 'mysql' );
				}
			}
		);

		static::deleting(
			function ( $activity ) {
				// Delete all comments
				$activity->comments()->delete();
				$activity->associations()->delete();
			}
		);
	}
}
