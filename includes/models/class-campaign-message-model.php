<?php
/**
 * Campaign Message Model
 * Unified model for all campaign message types (Email, SMS, WhatsApp)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Template_Model;

/**
 * Campaign_Message_Model class
 */
class Campaign_Message_Model extends Model
{

	/**
	 * Message modes
	 */
	const MODE_EMAIL = 1;
	const MODE_SMS = 2;
	const MODE_WHATSAPP = 3;

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_campaign_messages';

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
		'campaign_id',
		'contact_id',
		'template_id',
		'hash_key',
		'mode',
		'recipient',
		'opened',
		'clicked',
		'status',
		'sent_at',
		'opened_at',
		'clicked_at',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'opened' => 'boolean',
		'clicked' => 'boolean',
		'mode' => 'integer',
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
	 * Campaign relationship
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function campaign()
	{
		return $this->belongsTo(Campaign_Model::class, 'campaign_id');
	}

	/**
	 * Contact relationship
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact()
	{
		return $this->belongsTo(Contact_Model::class, 'contact_id');
	}

	/**
	 * Template relationship
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function template()
	{
		return $this->belongsTo(Template_Model::class, 'template_id');
	}

	/**
	 * Get by hash key
	 *
	 * @param string $hash_key Hash key.
	 *
	 * @since 1.0.0
	 *
	 * @return object
	 */
	public static function get_by_hash_key($hash_key)
	{
		return self::where('hash_key', $hash_key)->firstOrFail();
	}

	/**
	 * Scope: Email messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeEmails($query)
	{
		return $query->where('mode', self::MODE_EMAIL);
	}

	/**
	 * Scope: SMS messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeSms($query)
	{
		return $query->where('mode', self::MODE_SMS);
	}

	/**
	 * Scope: WhatsApp messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeWhatsapp($query)
	{
		return $query->where('mode', self::MODE_WHATSAPP);
	}

	/**
	 * Check if message is email
	 *
	 * @return bool
	 */
	public function is_email()
	{
		return $this->mode === self::MODE_EMAIL;
	}

	/**
	 * Check if message is SMS
	 *
	 * @return bool
	 */
	public function is_sms()
	{
		return $this->mode === self::MODE_SMS;
	}

	/**
	 * Check if message is WhatsApp
	 *
	 * @return bool
	 */
	public function is_whatsapp()
	{
		return $this->mode === self::MODE_WHATSAPP;
	}

	/**
	 * Check if message was opened (email only)
	 *
	 * @return bool
	 */
	public function is_opened()
	{
		return $this->is_email() && $this->opened == 1;
	}

	/**
	 * Check if message was clicked
	 *
	 * @return bool
	 */
	public function is_clicked()
	{
		return $this->clicked == 1;
	}

	/**
	 * Check if message failed
	 *
	 * @return bool
	 */
	public function is_failed()
	{
		return $this->status === 'failed';
	}

	/**
	 * Check if message was sent
	 *
	 * @return bool
	 */
	public function is_sent()
	{
		return $this->status === 'sent';
	}

	/**
	 * Get mode label
	 *
	 * @return string
	 */
	public function get_mode_label()
	{
		switch ($this->mode) {
			case self::MODE_EMAIL:
				return __('Email', 'quillcrm');
			case self::MODE_SMS:
				return __('SMS', 'quillcrm');
			case self::MODE_WHATSAPP:
				return __('WhatsApp', 'quillcrm');
			default:
				return __('Unknown', 'quillcrm');
		}
	}

	/**
	 * Get campaign message statistics
	 *
	 * @param int $campaign_id Campaign ID
	 * @param int $mode Message mode (optional)
	 *
	 * @return array
	 */
	public static function get_campaign_stats($campaign_id, $mode = null)
	{
		$analytics = \QuillCRM\Services\Campaign_Analytics::instance();
		$mode_map = [
			self::MODE_EMAIL => 'email',
			self::MODE_SMS => 'sms',
			self::MODE_WHATSAPP => 'whatsapp'
		];
		
		if ($mode && isset($mode_map[$mode])) {
			return $analytics->get_campaign_stats($mode_map[$mode], $campaign_id);
		}
		
		// Return combined stats for all modes
		$stats = [];
		foreach ($mode_map as $mode_num => $mode_str) {
			$stats[$mode_str] = $analytics->get_campaign_stats($mode_str, $campaign_id);
		}
		
		return $stats;
	}

	/**
	 * Boot method for model events
	 */
	public static function boot()
	{
		parent::boot();

		// Update campaign message counts when message status changes
		static::saved(
			function ($message) {
				// Trigger campaign count recalculation based on mode
				$mode_actions = [
					self::MODE_EMAIL => 'quillcrm_campaign_email_status_changed',
					self::MODE_SMS => 'quillcrm_campaign_sms_status_changed',
					self::MODE_WHATSAPP => 'quillcrm_campaign_whatsapp_status_changed'
				];
				
				if (isset($mode_actions[$message->mode])) {
					do_action($mode_actions[$message->mode], $message);
				}
			}
		);
	}
}
