<?php
/**
 * Class Activity_Comment_Model
 * This class is responsible for handling the activity comment model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;

/**
 * Activity_Comment_Model class
 */
class Activity_Comment_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_activity_comments';

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
		'activity_id',
		'user_id',
		'content',
		'created_at',
		'updated_at',
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
		'activity_id' => 'required|integer',
		'content'     => 'required|string',
		'user_id'     => 'nullable|integer',
	);

	/**
	 * Validation messages
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	public $messages = array(
		'activity_id.required' => 'Activity ID is required.',
		'content.required'     => 'Comment content is required.',
	);

	/**
	 * Get the activity this comment belongs to
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function activity() {
		return $this->belongsTo( Activity_Model::class, 'activity_id', 'id' );
	}

	/**
	 * Get the user who made this comment
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'user_id', 'ID' );
	}

	/**
	 * Get formatted content (with basic HTML support)
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function getFormattedContentAttribute() {
		return wp_kses_post( wpautop( $this->content ) );
	}

	/**
	 * Get time ago string
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function getTimeAgoAttribute() {
		return human_time_diff( $this->created_at->timestamp, current_time( 'timestamp' ) ) . ' ' . __( 'ago', 'quillcrm' );
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
			function ( $comment ) {
				if ( ! $comment->user_id ) {
					$comment->user_id = get_current_user_id();
				}
			}
		);
	}
}

