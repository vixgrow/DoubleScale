<?php
/**
 * Class Deal_Activity_Model
 * This class is responsible for handling the deal activity model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\User_Model;
use QuillCRM\Models\Pipeline_Stage_Model;

/**
 * Deal_Activity_Model class
 */
class Deal_Activity_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_deal_activities';

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
		'deal_id',
		'activity_type',
		'data',
		'user_id',
		'created_at',
	);

	/**
	 * Timestamps
	 *
	 * @var bool
	 *
	 * @since 1.0.0
	 */
	public $timestamps = false;

	/**
	 * Cast attributes
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $casts = array(
		'data' => 'array',
	);

	/**
	 * Rules
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $rules = array(
		'deal_id' => 'required|integer',
		'activity_type' => 'required|in:created,stage_changed,value_changed,status_changed,note_added,email_sent,call_logged,meeting_scheduled',
		'user_id' => 'nullable|integer',
	);

	/**
	 * Messages
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $messages = array(
		'deal_id.required' => 'Deal ID is required.',
		'activity_type.required' => 'Activity type is required.',
		'activity_type.in' => 'Invalid activity type.',
	);

	/**
	 * Get the deal this activity belongs to
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function deal() {
		return $this->belongsTo( Deal_Model::class, 'deal_id', 'id' );
	}

	/**
	 * Get the user who performed this activity
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id', 'ID' );
	}

	/**
	 * Get the comments for this activity
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function comments() {
		return $this->hasMany( Activity_Comment_Model::class, 'activity_id', 'id' )->orderBy( 'created_at', 'asc' );
	}

	/**
	 * Get formatted activity message
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function getFormattedMessageAttribute() {
		$user_name = $this->user ? $this->user->display_name : 'Unknown User';
		
		switch ( $this->activity_type ) {
			case 'created':
				return sprintf( '%s created this deal', $user_name );
			
			case 'stage_changed':
				$old_stage = Pipeline_Stage_Model::find( $this->data['old_stage_id'] ?? 0 );
				$new_stage = Pipeline_Stage_Model::find( $this->data['new_stage_id'] ?? 0 );
				return sprintf( 
					'%s moved deal from "%s" to "%s"', 
					$user_name,
					$old_stage ? $old_stage->name : 'Unknown Stage',
					$new_stage ? $new_stage->name : 'Unknown Stage'
				);
			
			case 'value_changed':
				return sprintf( 
					'%s changed deal value from %s to %s', 
					$user_name,
					$this->data['old_value'] ?? 0,
					$this->data['new_value'] ?? 0
				);
			
			case 'status_changed':
				$status = $this->data['status'] ?? 'unknown';
				if ( $status === 'won' ) {
					return sprintf( '%s marked deal as won', $user_name );
				} elseif ( $status === 'lost' ) {
					$reason = ! empty( $this->data['reason'] ) ? ' - ' . $this->data['reason'] : '';
					return sprintf( '%s marked deal as lost%s', $user_name, $reason );
				}
				return sprintf( '%s changed deal status to %s', $user_name, $status );
			
			case 'note_added':
				return sprintf( '%s added a note', $user_name );
			
			case 'email_sent':
				$subject = $this->data['subject'] ?? '';
				$contact_email = $this->data['contact_email'] ?? '';
				$contact_name = $this->data['contact_name'] ?? '';

				$message = sprintf( '%s sent an email', $user_name );

				if ( ! empty( $subject ) ) {
					$message .= sprintf( ' with subject "%s"', $subject );
				}

				if ( ! empty( $contact_email ) ) {
					$recipient = ! empty( $contact_name ) ? $contact_name : $contact_email;
					$message .= sprintf( ' to %s', $recipient );
				}

				return $message;
			
			case 'call_logged':
				$outcome = $this->data['outcome'] ?? '';
				$duration = $this->data['duration'] ?? null;
				$phone_number = $this->data['phone_number'] ?? '';
				$notes = $this->data['notes'] ?? '';
				
				$message = sprintf( '%s logged a call', $user_name );
				
				if ( ! empty( $phone_number ) ) {
					$message .= sprintf( ' to %s', $phone_number );
				}
				
				if ( ! empty( $outcome ) ) {
					$message .= sprintf( ' with outcome: %s', $outcome );
				}
				
				if ( $duration ) {
					$message .= sprintf( ' (Duration: %d minutes)', $duration );
				}
				
				return $message;
			
			case 'meeting_scheduled':
				$title = $this->data['title'] ?? '';
				$scheduled_at = $this->data['scheduled_at'] ?? '';
				$attendee_name = $this->data['primary_attendee_name'] ?? '';

				$message = sprintf( '%s scheduled a meeting', $user_name );

				if ( ! empty( $title ) ) {
					$message .= sprintf( ' "%s"', $title );
				}

				if ( ! empty( $attendee_name ) ) {
					$message .= sprintf( ' with %s', $attendee_name );
				}

				if ( ! empty( $scheduled_at ) ) {
					$formatted_date = date( 'M j, Y \a\t g:i A', strtotime( $scheduled_at ) );
					$message .= sprintf( ' for %s', $formatted_date );
				}

				return $message;
			
			default:
				return sprintf( '%s performed an action', $user_name );
		}
	}

	/**
	 * Add a note activity
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID
	 * @param string $note Note content
	 * @param int|null $user_id User ID
	 *
	 * @return Deal_Activity
	 */
	public static function addNote( $deal_id, $note, $user_id = null ) {
		return self::create( array(
			'deal_id' => $deal_id,
			'activity_type' => 'note_added',
			'data' => array( 'content' => $note ),
			'user_id' => $user_id ?: get_current_user_id(),
		) );
	}

	/**
	 * Log email activity
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID
	 * @param array $email_data Email data
	 * @param int|null $user_id User ID
	 *
	 * @return Deal_Activity
	 */
	public static function logEmail( $deal_id, $email_data, $user_id = null ) {
		return self::create( array(
			'deal_id' => $deal_id,
			'activity_type' => 'email_sent',
			'data' => $email_data,
			'user_id' => $user_id ?: get_current_user_id(),
		) );
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
	 * @return Deal_Activity
	 */
	public static function logCall( $deal_id, $call_data, $user_id = null ) {
		return self::create( array(
			'deal_id' => $deal_id,
			'activity_type' => 'call_logged',
			'data' => $call_data,
			'user_id' => $user_id ?: get_current_user_id(),
		) );
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
	 * @return Deal_Activity
	 */
	public static function scheduleMeeting( $deal_id, $meeting_data, $user_id = null ) {
		return self::create( array(
			'deal_id' => $deal_id,
			'activity_type' => 'meeting_scheduled',
			'data' => $meeting_data,
			'user_id' => $user_id ?: get_current_user_id(),
		) );
	}

	/**
	 * Check if activity type is editable
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_editable() {
		$editable_types = array( 'note_added', 'email_sent', 'call_logged', 'meeting_scheduled' );
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
	 * Boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		static::creating(
			function( $activity ) {
				if ( ! $activity->created_at ) {
					$activity->created_at = current_time( 'mysql' );
				}
			}
		);

		static::deleting(
			function( $activity ) {
				// Delete all comments
				$activity->comments()->delete();
			}
		);
	}
}