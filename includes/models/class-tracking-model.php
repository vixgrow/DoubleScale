<?php
/**
 * Tracking Model
 * Tracks message delivery, opens, clicks across all channels and sources
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Template_Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Constants\Message_Source_Types;

/**
 * Tracking_Model class
 */
class Tracking_Model extends Model
{

	/**
	 * Communication channel modes for tracking
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
	protected $table = 'quillcrm_tracking';

	/**
	 * Primary key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $primary_key = 'id';

	/**
	 * Fillable columns for tracking records
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $fillable = array(
		'contact_id',     // Who received the message
		'template_id',    // Template used
		'hash_key',       // Unique tracking hash
		'mode',           // Email/SMS/WhatsApp
		'source_type',    // Campaign/Automation/Manual
		'source_id',      // ID of the source (campaign_id, automation_id, etc.)
		'recipient',      // Email address or phone number
		'opened',         // Open tracking (emails only)
		'clicked',        // Click tracking
		'status',         // sent/pending/failed
		'sent_at',        // When sent
		'opened_at',      // When opened (emails only)
		'clicked_at',     // When clicked
		'created_at',     // Record created
		'updated_at',     // Record updated
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
		'source_type' => 'integer',
		'source_id' => 'integer',
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
	 * Campaign relationship (only when source_type = 1)
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function campaign()
	{
		return $this->belongsTo(Campaign_Model::class, 'source_id');
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
	 * Scope: Campaign messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFromCampaign($query)
	{
		return $query->where('source_type', Message_Source_Types::CAMPAIGN);
	}

	/**
	 * Scope: Automation messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFromAutomation($query)
	{
		return $query->where('source_type', Message_Source_Types::AUTOMATION);
	}


	/**
	 * Scope: Messages by source type
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param int $source_type
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeBySourceType($query, $source_type)
	{
		return $query->where('source_type', $source_type);
	}

	/**
	 * Scope: Messages by source
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param int $source_type
	 * @param int $source_id
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeBySource($query, $source_type, $source_id)
	{
		return $query->where('source_type', $source_type)->where('source_id', $source_id);
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
	 * Get source type label
	 *
	 * @return string
	 */
	public function get_source_type_label()
	{
		return Message_Source_Types::get_type_label($this->source_type);
	}

	/**
	 * Check if message is from campaign
	 *
	 * @return bool
	 */
	public function is_from_campaign()
	{
		return $this->source_type === Message_Source_Types::CAMPAIGN;
	}

	/**
	 * Check if message is from automation
	 *
	 * @return bool
	 */
	public function is_from_automation()
	{
		return $this->source_type === Message_Source_Types::AUTOMATION;
	}

	/**
	 * Get automation relationship (only when source_type = 2)
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function automation()
	{
		return $this->belongsTo(Automation_Model::class, 'source_id');
	}


	/**
	 * Get campaign safely (only when source_type = CAMPAIGN)
	 *
	 * @return Campaign_Model|null
	 */
	public function get_campaign()
	{
		if ($this->source_type === Message_Source_Types::CAMPAIGN) {
			return Campaign_Model::find($this->source_id);
		}
		return null;
	}

	/**
	 * Get automation safely (only when source_type = AUTOMATION)
	 *
	 * @return Automation_Model|null
	 */
	public function get_automation()
	{
		if ($this->source_type === Message_Source_Types::AUTOMATION) {
			return Automation_Model::find($this->source_id);
		}
		return null;
	}

	/**
	 * Set source information
	 *
	 * @param int $source_type Source type constant
	 * @param int $source_id Source ID (campaign_id, automation_id, etc.)
	 * @return void
	 */
	public function set_source($source_type, $source_id = 0)
	{
		$this->source_type = $source_type;
		$this->source_id = $source_id;
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
	 * @param int $campaign_id Campaign ID (maps to source_id with source_type=CAMPAIGN)
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
