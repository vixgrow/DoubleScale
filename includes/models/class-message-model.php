<?php
/**
 * Message Model
 * Stores actual message content (subject/body) for all channels
 * Provides audit trail and searchable message history
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;

/**
 * Message_Model class
 *
 * Stores the actual content of sent messages (email subject/body, SMS body, WhatsApp body)
 * Related to Tracking_Model via tracking_id for delivery/engagement metrics
 */
class Message_Model extends Model
{
	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_messages';

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
		'tracking_id',  // Foreign key to tracking table
		'subject',      // Email subject (null for SMS/WhatsApp)
		'body',         // Message body (all channels)
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
	 * Tracking relationship
	 * Each message belongs to one tracking record
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function tracking()
	{
		return $this->belongsTo(Tracking_Model::class, 'tracking_id');
	}

	/**
	 * Get message by tracking ID
	 *
	 * @param int $tracking_id Tracking ID
	 *
	 * @since 1.0.0
	 *
	 * @return Message_Model|null
	 */
	public static function get_by_tracking_id($tracking_id)
	{
		return self::where('tracking_id', $tracking_id)->first();
	}

	/**
	 * Search message content (subject + body)
	 *
	 * @param string $search_term Search term
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public static function search_content($search_term)
	{
		return self::where('subject', 'like', '%' . $search_term . '%')
			->orWhere('body', 'like', '%' . $search_term . '%')
			->get();
	}

	/**
	 * Get full message content as array
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_content()
	{
		return array(
			'subject' => $this->subject,
			'body'    => $this->body,
		);
	}
}
