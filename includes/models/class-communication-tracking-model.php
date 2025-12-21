<?php
/**
 * Communication Tracking Model
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
use QuillCRM\Models\Activity_Model;
use QuillCRM\Constants\Message_Direction;
use QuillCRM\Models\Communication_Tracking_Meta_Model;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Campaign_Channel;

/**
 * Communication_Tracking_Model class
 */
class Communication_Tracking_Model extends Model {


	/**
	 * Communication channel modes for tracking
	 */
	const MODE_EMAIL    = 1;
	const MODE_SMS      = 2;
	const MODE_WHATSAPP = 3;

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_communication_tracking';

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
		'direction',      // outbound/inbound - message direction
		'source_type',    // Campaign/Automation/Individual
		'source_id',      // Polymorphic FK: campaign_id, automation_id, or activity_id (for individuals)
		'step_id',        // Automation step ID (NULL for campaigns/individual)
		'author_id',      // User who sent the message (for individual sends)
		'recipient',      // Email address or phone number
		'external_id',    // Twilio MessageSid, email provider ID, etc.
		'opened',         // Open tracking (emails only)
		'clicked',        // Click tracking
		'status',         // sent/pending/failed/delivered/read
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
		'opened'      => 'boolean',
		'clicked'     => 'boolean',
		'mode'        => 'integer',
		'direction'   => 'integer',
		'source_type' => 'integer',
		'source_id'   => 'integer',
		'step_id'     => 'integer',
		'status'      => 'integer',
	);

	/**
	 * Appends (virtual attributes for API responses)
	 *
	 * @var array
	 */
	protected $appends = array(
		'status_name',
		'status_slug',
		'status_class',
		'direction_slug',
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
	public function campaign() {
		return $this->belongsTo( Campaign_Model::class, 'source_id' );
	}

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
	 * Template relationship
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function template() {
		return $this->belongsTo( Template_Model::class, 'template_id' );
	}

	/**
	 * Activity relationship (for individual messages only, via source_id)
	 *
	 * For individual messages (source_type = 3), source_id points to the activity.
	 * This provides backwards compatibility and convenience.
	 *
	 * IMPORTANT: This relationship should ONLY be used when source_type = INDIVIDUAL (3).
	 * For campaigns/automations, source_id points to campaign/automation, not activity.
	 * The relationship itself doesn't enforce this constraint to avoid affecting main queries.
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function activity() {
		return $this->belongsTo( Activity_Model::class, 'source_id' );
	}

	/**
	 * Communication tracking meta relationship (for merge tag values)
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function communication_tracking_meta() {
		return $this->hasMany( Communication_Tracking_Meta_Model::class, 'communication_tracking_id' );
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
	public static function get_by_hash_key( $hash_key ) {
		return self::where( 'hash_key', $hash_key )->firstOrFail();
	}

	/**
	 * Scope: Email messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeEmails( $query ) {
		return $query->where( 'mode', self::MODE_EMAIL );
	}

	/**
	 * Scope: SMS messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeSms( $query ) {
		return $query->where( 'mode', self::MODE_SMS );
	}

	/**
	 * Scope: WhatsApp messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeWhatsapp( $query ) {
		return $query->where( 'mode', self::MODE_WHATSAPP );
	}

	/**
	 * Scope: Outbound messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeOutbound( $query ) {
		return $query->where( 'direction', Message_Direction::OUTBOUND );
	}

	/**
	 * Scope: Inbound messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeInbound( $query ) {
		return $query->where( 'direction', Message_Direction::INBOUND );
	}

	/**
	 * Scope: Campaign messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFromCampaign( $query ) {
		return $query->where( 'source_type', Message_Source_Types::CAMPAIGN );
	}

	/**
	 * Scope: Automation messages only
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeFromAutomation( $query ) {
		return $query->where( 'source_type', Message_Source_Types::AUTOMATION );
	}


	/**
	 * Scope: Messages by source type
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param int                                   $source_type
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeBySourceType( $query, $source_type ) {
		return $query->where( 'source_type', $source_type );
	}

	/**
	 * Scope: Messages by source
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param int                                   $source_type
	 * @param int                                   $source_id
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeBySource( $query, $source_type, $source_id ) {
		return $query->where( 'source_type', $source_type )->where( 'source_id', $source_id );
	}

	/**
	 * Scope: Messages by automation step
	 *
	 * @since 1.0.0
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param int                                   $step_id
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeByStep( $query, $step_id ) {
		return $query->where( 'step_id', $step_id );
	}

	/**
	 * Check if message is email
	 *
	 * @return bool
	 */
	public function is_email() {
		return $this->mode === self::MODE_EMAIL;
	}

	/**
	 * Check if message is SMS
	 *
	 * @return bool
	 */
	public function is_sms() {
		return $this->mode === self::MODE_SMS;
	}

	/**
	 * Check if message is WhatsApp
	 *
	 * @return bool
	 */
	public function is_whatsapp() {
		 return $this->mode === self::MODE_WHATSAPP;
	}

	/**
	 * Check if message was opened (email only)
	 *
	 * @return bool
	 */
	public function is_opened() {
		return $this->is_email() && $this->opened == 1;
	}

	/**
	 * Check if message was clicked
	 *
	 * @return bool
	 */
	public function is_clicked() {
		return $this->clicked == 1;
	}

	/**
	 * Get source type label
	 *
	 * @return string
	 */
	public function get_source_type_label() {
		return Message_Source_Types::get_type_label( $this->source_type );
	}

	/**
	 * Check if message is from campaign
	 *
	 * @return bool
	 */
	public function is_from_campaign() {
		return $this->source_type === Message_Source_Types::CAMPAIGN;
	}

	/**
	 * Check if message is from automation
	 *
	 * @return bool
	 */
	public function is_from_automation() {
		return $this->source_type === Message_Source_Types::AUTOMATION;
	}

	/**
	 * Get automation relationship (only when source_type = 2)
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function automation() {
		return $this->belongsTo( Automation_Model::class, 'source_id' );
	}

	/**
	 * Get automation step relationship (only when source_type = AUTOMATION)
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function step() {
		return $this->belongsTo( Automation_Step_Model::class, 'step_id' );
	}


	/**
	 * Get campaign safely (only when source_type = CAMPAIGN)
	 *
	 * @return Campaign_Model|null
	 */
	public function get_campaign() {
		if ( $this->source_type === Message_Source_Types::CAMPAIGN ) {
			return Campaign_Model::find( $this->source_id );
		}
		return null;
	}

	/**
	 * Get automation safely (only when source_type = AUTOMATION)
	 *
	 * @return Automation_Model|null
	 */
	public function get_automation() {
		if ( $this->source_type === Message_Source_Types::AUTOMATION ) {
			return Automation_Model::find( $this->source_id );
		}
		return null;
	}

	/**
	 * Get automation step safely (only when source_type = AUTOMATION)
	 *
	 * @since 1.0.0
	 *
	 * @return Automation_Step_Model|null
	 */
	public function get_step() {
		if ( $this->source_type === Message_Source_Types::AUTOMATION && $this->step_id ) {
			return Automation_Step_Model::find( $this->step_id );
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
	public function set_source( $source_type, $source_id = 0 ) {
		$this->source_type = $source_type;
		$this->source_id   = $source_id;
	}

	/**
	 * Check if message failed
	 *
	 * @return bool
	 */
	public function is_failed() {
		return $this->status === Tracking_Status::FAILED;
	}

	/**
	 * Check if message was sent
	 *
	 * @return bool
	 */
	public function is_sent() {
		 return $this->status === Tracking_Status::SENT;
	}

	/**
	 * Check if message is pending
	 *
	 * @return bool
	 */
	public function is_pending() {
		return $this->status === Tracking_Status::PENDING;
	}

	/**
	 * Check if message is delivered
	 *
	 * @return bool
	 */
	public function is_delivered() {
		return $this->status === Tracking_Status::DELIVERED;
	}


	/**
	 * Get status name (accessor for API)
	 *
	 * @return string
	 */
	public function getStatusNameAttribute() {
		return Tracking_Status::get_name( $this->status );
	}

	/**
	 * Get status slug (accessor for API)
	 *
	 * @return string
	 */
	public function getStatusSlugAttribute() {
		return Tracking_Status::get_slug( $this->status );
	}

	/**
	 * Get status CSS class (accessor for UI)
	 *
	 * @return string
	 */
	public function getStatusClassAttribute() {
		 return Tracking_Status::get_status_class( $this->status );
	}

	/**
	 * Get direction slug (accessor for API)
	 *
	 * @return string
	 */
	public function getDirectionSlugAttribute() {
		return Message_Direction::get_slug( $this->direction );
	}


	/**
	 * Get campaign message statistics
	 *
	 * @param int $campaign_id Campaign ID (maps to source_id with source_type=CAMPAIGN)
	 * @param int $mode Message mode (optional)
	 *
	 * @return array
	 */
	public static function get_campaign_stats( $campaign_id, $mode = null ) {
		$analytics = \QuillCRM\Services\Campaign_Analytics::instance();

		if ( $mode ) {
			$channel = Campaign_Channel::from_mode( $mode );
			if ( $channel ) {
				return $analytics->get_campaign_stats( $channel, $campaign_id );
			}
		}

		// Return combined stats for all modes
		$stats = array();
		foreach ( Campaign_Channel::get_all() as $channel ) {
			$stats[ $channel ] = $analytics->get_campaign_stats( $channel, $campaign_id );
		}

		return $stats;
	}

	/**
	 * Boot method for model events
	 */
	public static function boot() {
		 parent::boot();

		// Update campaign message counts when message status changes
		static::saved(
			function ( $message ) {
				// Trigger campaign count recalculation based on mode
				$mode_actions = array(
					self::MODE_EMAIL    => 'quillcrm_campaign_email_status_changed',
					self::MODE_SMS      => 'quillcrm_campaign_sms_status_changed',
					self::MODE_WHATSAPP => 'quillcrm_campaign_whatsapp_status_changed',
				);

				if ( isset( $mode_actions[ $message->mode ] ) ) {
					do_action( $mode_actions[ $message->mode ], $message );
				}
			}
		);
	}

	/**
	 * Get contact with tracking context set
	 * Returns the associated contact with this tracking record's context set for merge tags
	 *
	 * @return Contact_Model|null Contact with tracking context set
	 */
	public function get_contact_with_tracking_context() {
		if ( ! $this->contact ) {
			return null;
		}

		// Set tracking context on the contact
		return $this->contact->set_tracking_context( $this->id );
	}

	/**
	 * Render original content using stored merge tag values
	 * Convenience method to render any content with this tracking record's stored values
	 *
	 * @param string $content Content with merge tags to render
	 * @return string Rendered content with stored merge tag values
	 */
	public function render_original_content( $content ) {
		return Communication_Tracking_Meta_Model::render_with_stored_values( $this->id, $content );
	}

	/**
	 * Render the original template as it was sent
	 * Uses stored merge tag values to show historical accuracy
	 *
	 * @return string Rendered HTML of the original email
	 */
	public function render_original_template() {
		if ( ! $this->template_id ) {
			return '';
		}

		$renderer = new \QuillCRM\Emails\Email_Renderer();
		return $renderer->render_template_with_tracking( $this->template_id, $this->id, $this->contact );
	}
}
