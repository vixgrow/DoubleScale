<?php
/**
 * Activity Model
 * Unified model for all activity types (messages, notes, calls, meetings, system events)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\Communication_Tracking_Model;

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
		'deal_id',
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
	 * Timestamps
	 *
	 * @var bool
	 *
	 * @since 1.0.0
	 */
	public $timestamps = true;

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
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasOne
	 */
	public function tracking() {
		return $this->hasOne( Communication_Tracking_Model::class, 'activity_id' );
	}

	/**
	 * Scope: Filter by contact
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param int                                   $contact_id
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeForContact( $query, $contact_id ) {
		return $query->where( 'contact_id', $contact_id );
	}

	/**
	 * Scope: Filter by deal
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param int                                   $deal_id
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeForDeal( $query, $deal_id ) {
		return $query->where( 'deal_id', $deal_id )
					 ->orderBy( 'created_at', 'desc' );
	}

	/**
	 * Scope: Filter by activity type
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param string|array                          $type
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
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeMessages( $query ) {
		return $query->whereIn( 'activity_type', array( 'email_sent', 'sms_sent', 'whatsapp_sent' ) );
	}

	/**
	 * Scope: Only activities with tracking
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeTracked( $query ) {
		return $query->has( 'tracking' );
	}

	/**
	 * Scope: Only notes
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeNotes( $query ) {
		return $query->where( 'activity_type', 'note' );
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
	 * Get content as array
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_content() {
		return array(
			'subject' => $this->get_subject(),
			'body'    => $this->get_body(),
		);
	}

	/**
	 * Search activities by content
	 *
	 * @since 1.0.0
	 *
	 * @param string $search_term Search term
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public static function search_content( $search_term ) {
		// Use JSON_SEARCH for better performance on JSON columns
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
	 * @param int $tracking_id Tracking ID
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
		return $this->activity_type === 'note';
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
	 * Get note content from data JSON
	 *
	 * @since 1.0.0
	 *
	 * @return string|null
	 */
	public function get_note() {
		if ( ! is_array( $this->data ) ) {
			return null;
		}
		return $this->data['note'] ?? null;
	}

	/**
	 * Get note type from data JSON
	 *
	 * @since 1.0.0
	 *
	 * @return string|null
	 */
	public function get_type() {
		if ( ! is_array( $this->data ) ) {
			return null;
		}
		return $this->data['type'] ?? null;
	}

	/**
	 * Transform activity to note format for API response
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function to_note_format() {
		return array(
			'id'         => $this->id,
			'contact_id' => $this->contact_id,
			'title'      => $this->get_title(),
			'type'       => $this->get_type(),
			'note'       => $this->get_note(),
			'created_at' => $this->created_at,
			'updated_at' => $this->updated_at,
		);
	}
}
