<?php
/**
 * Class Campaign_Model
 * This class is responsible for handling the campaign model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Models\Template_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Contact_Filters\Process as Contact_Filters_Process;
use QuillCRM\Managers\Campaign_Status_Manager;
use QuillCRM\Services\Campaign_Template_Factory;
use QuillCRM\Services\Template_Field_Mapper;

/**
 * Campaign_Model class
 */
class Campaign_Model extends Model {


	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_campaigns';

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
		'name',
		'description',
		'status',
		'type',
		'settings',
		'parent_id',
		'count',
		'execute_at',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'settings' => 'array',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'name' => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'name.required' => 'Campaign name is required',
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
	 * Get all campaign messages
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function messages() {
		return $this->hasMany( Tracking_Model::class, 'source_id', 'id' )
			->where( 'source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN );
	}

	/**
	 * Get the campaign emails
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function emails() {
		return $this->messages()->emails();
	}

	/**
	 * Get the campaign SMS
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function sms() {
		 return $this->messages()->sms();
	}

	/**
	 * Get the campaign WhatsApp messages
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function whatsapp() {
		return $this->messages()->whatsapp();
	}

	/**
	 * Get setting
	 *
	 * @param string $key key.
	 * @param mixed  $default default value.
	 *
	 * @return mixed
	 */
	public function get_setting( $key, $default = null ) {
		return isset( $this->settings[ $key ] ) ? $this->settings[ $key ] : $default;
	}

	/**
	 * Get campaign type (email, sms, or whatsapp)
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_type() {
		return $this->type ?? 'email';
	}

	/**
	 * Check if campaign is SMS type
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_sms_campaign() {
		 return $this->get_type() === 'sms';
	}

	/**
	 * Check if campaign is email type
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_email_campaign() {
		return $this->get_type() === 'email';
	}

	/**
	 * Check if campaign is WhatsApp type
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_whatsapp_campaign() {
		return $this->get_type() === 'whatsapp';
	}



	/**
	 * Get the templates
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_templates() {
		$template_ids = $this->get_setting( 'template_ids', array() );

		if ( empty( $template_ids ) ) {
			return array();
		}

		$templates     = array();
		$campaign_type = $this->get_type();

		foreach ( $template_ids as $template_id ) {
			$template = Template_Model::find( $template_id );
			if ( $template ) {
				// Use centralized field mapper for consistent formatting
				$template_data = Template_Field_Mapper::template_to_array( $template, $campaign_type );
				$templates[]   = $template_data;
			}
		}

		return $templates;
	}

	/**
	 * Process template data and create/update Template_Model records
	 *
	 * @param array $templates_data Array of template data
	 * @return array Array of template IDs
	 */
	private function process_templates( $templates_data ) {
		$campaign_type    = $this->get_type();
		$template_factory = Campaign_Template_Factory::instance();

		return $template_factory->process_templates_data( $templates_data, $campaign_type );
	}

	/**
	 * Attach templates to campaign settings for API responses
	 * Converts template_ids back to full template objects
	 *
	 * @param Campaign_Model $campaign Campaign model
	 * @return void
	 */
	public function attach_templates( $campaign ) {
		// Get templates and add them to settings for frontend
		$templates = $campaign->get_templates();

		if ( ! empty( $templates ) ) {
			$settings              = $campaign->settings;
			$settings['templates'] = $templates;
			$campaign->settings    = $settings;
		}
	}

	/**
	 * Get template IDs
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_template_ids() {
		return $this->get_setting( 'template_ids', array() );
	}

	/**
	 * Get template count
	 *
	 * @since 1.0.0
	 *
	 * @return int
	 */
	public function get_template_count() {
		return count( $this->get_template_ids() );
	}

	/**
	 * Check if campaign has multiple templates (A/B testing)
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function has_multiple_templates() {
		return $this->get_template_count() > 1;
	}

	/**
	 * Attach counts
	 *
	 * @param Campaign_Model $campaign campaign model.
	 *
	 * @return void
	 */
	public function attach_counts($campaign)
	{
		// Calculate contacts count with type-specific filtering
		$campaign->contacts_count = $this->get_contacts_count($campaign);

		// Get analytics stats from centralized service
		$analytics = \QuillCRM\Services\Campaign_Analytics::instance();
		$stats = $analytics->get_campaign_stats($campaign->type, $campaign->id);

		// Get optimized template counts (single query instead of N queries)
		$campaign->templates_count = $this->get_template_counts_optimized($campaign);

		// Assign stats based on campaign type
		$this->assign_campaign_stats($campaign, $stats);
	}

	/**
	 * Get contacts count for campaign with type-specific filtering
	 *
	 * @param Campaign_Model $campaign campaign model.
	 *
	 * @return int Contact count
	 */
	private function get_contacts_count($campaign)
	{
		$filters = $campaign->get_setting('filters', array());
		$query = Contact_Model::where('status', 'subscribed');

		// Apply type-specific filtering
		if ($campaign->is_email_campaign()) {
			$query->whereNotNull('email')->where('email', '!=', '');
		} elseif ($campaign->is_sms_campaign() || $campaign->is_whatsapp_campaign()) {
			$query->whereNotNull('phone')->where('phone', '!=', '');
		}

		// Apply custom filters if provided
		if (!empty($filters)) {
			$contact_filters = new Contact_Filters_Process($query, $filters);
			$query = $contact_filters->filter();
		}

		return $query->count();
	}

	/**
	 * Get template counts using optimized single query with GROUP BY
	 * Fixes N+1 query problem - previously ran one COUNT query per template
	 *
	 * @param Campaign_Model $campaign campaign model.
	 *
	 * @return array Template counts indexed by template_id
	 */
	private function get_template_counts_optimized($campaign)
	{
		// Map campaign type to tracking mode
		$mode_map = array(
			'email' => Tracking_Model::MODE_EMAIL,
			'sms' => Tracking_Model::MODE_SMS,
			'whatsapp' => Tracking_Model::MODE_WHATSAPP,
		);

		$mode = $mode_map[$campaign->type] ?? null;
		if ($mode === null) {
			return array();
		}

		// Single query with GROUP BY instead of N separate queries
		$counts = $campaign->messages()
			->where('mode', $mode)
			->selectRaw('template_id, COUNT(*) as count')
			->groupBy('template_id')
			->get()
			->pluck('count', 'template_id')
			->toArray();

		// Ensure all template IDs have a count (even if 0)
		$template_counts = array();
		foreach ($campaign->get_template_ids() as $template_id) {
			$template_counts[$template_id] = isset($counts[$template_id]) ? (int) $counts[$template_id] : 0;
		}

		return $template_counts;
	}

	/**
	 * Assign campaign statistics based on type
	 * Eliminates duplicate code across email/sms/whatsapp branches
	 *
	 * @param Campaign_Model $campaign campaign model.
	 * @param array          $stats Statistics from analytics service.
	 *
	 * @return void
	 */
	private function assign_campaign_stats($campaign, $stats)
	{
		// Common stats for all campaign types
		$campaign->sent_count = $stats['sent'] ?? 0;
		$campaign->failed_count = $stats['failed'] ?? 0;
		$campaign->clicked_count = $stats['clicked'] ?? 0;

		// Type-specific stats
		if ($campaign->is_email_campaign()) {
			$campaign->opened_count = $stats['opened'] ?? 0;
			$campaign->open_rate = $stats['open_rate'] ?? 0;
			$campaign->click_rate = $stats['click_rate'] ?? 0;
		} elseif ($campaign->is_sms_campaign()) {
			$campaign->pending_count = $stats['pending'] ?? 0;
			$campaign->delivered_count = $stats['delivered'] ?? 0;
			$campaign->delivery_rate = $stats['delivery_rate'] ?? 0;
			$campaign->click_rate = $stats['click_rate'] ?? 0;
		} elseif ($campaign->is_whatsapp_campaign()) {
			$campaign->pending_count = $stats['pending'] ?? 0;
			$campaign->delivered_count = $stats['delivered'] ?? 0;
			$campaign->read_count = $stats['read'] ?? 0;
			$campaign->delivery_rate = $stats['delivery_rate'] ?? 0;
			$campaign->read_rate = $stats['read_rate'] ?? 0;
			$campaign->click_rate = $stats['click_rate'] ?? 0;
		}
	}

	/**
	 * Get status manager
	 *
	 * @return Campaign_Status_Manager
	 */
	protected function get_status_manager() {
		return Campaign_Status_Manager::instance();
	}


	/**
	 * Get status label
	 *
	 * @return string
	 */
	public function get_status_label() {
		$labels = $this->get_status_manager()->get_status_labels();
		return $labels[ $this->status ] ?? $this->status;
	}

	/**
	 * Validate status before setting
	 *
	 * @param string $value
	 */
	public function setStatusAttribute( $value ) {
		$manager = $this->get_status_manager();

		if ( ! $manager->is_valid_status( $value ) ) {
			throw new \InvalidArgumentException( "Invalid campaign status: {$value}" );
		}

		$this->attributes['status'] = $value;
	}

	/**
	 * Delete the contact notes boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		 parent::boot();

		// Save templates when saving the campaign
		static::saving(
			function ( $campaign ) {
				// Retrieve the settings attribute
				$settings = $campaign->settings;

				// If templates exist in settings, create/update Template_Model records
				if ( isset( $settings['templates'] ) && is_array( $settings['templates'] ) ) {
					$template_ids = $campaign->process_templates( $settings['templates'] );

					// Store only template IDs in settings and remove full template objects
					$settings['template_ids'] = $template_ids;
					unset( $settings['templates'] );
				}

				// Set the modified settings back to the model
				$campaign->settings = $settings;

				// Remove the contacts count, sent count, opened count and clicked count
				unset( $campaign->templates_count );
				unset( $campaign->contacts_count );
				unset( $campaign->sent_count );
				unset( $campaign->failed_count );
				unset( $campaign->opened_count );
				unset( $campaign->clicked_count );

				// Remove email-specific calculated properties
				unset( $campaign->open_rate );
				unset( $campaign->click_rate );

				// Remove SMS-specific calculated properties
				unset( $campaign->pending_count );
				unset( $campaign->delivered_count );
				unset( $campaign->delivery_rate );

				// Remove WhatsApp-specific calculated properties
				unset( $campaign->read_count );
				unset( $campaign->read_rate );
			}
		);

		// Delete the campaign templates when deleting the campaign
		static::deleting(
			function ( $campaign ) {
				// Get template IDs and delete associated templates
				$template_ids = $campaign->get_template_ids();

				foreach ( $template_ids as $template_id ) {
					$template = Template_Model::find( $template_id );
					if ( $template ) {
						$template->delete();
					}
				}
			}
		);

		static::retrieved(
			function ( $campaign ) {
				$campaign->attach_counts( $campaign );
				$campaign->attach_templates( $campaign );
			}
		);

		static::saved(
			function ( $campaign ) {
				$campaign->attach_counts( $campaign );
				$campaign->attach_templates( $campaign );
			}
		);
	}
}
