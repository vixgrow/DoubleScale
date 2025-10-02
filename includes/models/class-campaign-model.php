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
	 * Get the campaign email sequences
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function sequences_mail() {
		return $this->hasMany( Campaign_Model::class, 'parent_id' )->where( 'type', 'sequence_mail' );
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
	public function attach_counts( $campaign ) {
		$filters             = $campaign->get_setting( 'filters', array() );
		$campaign_recipients = Contact_Model::where( 'status', 'subscribed' );

		// For SMS and WhatsApp campaigns, only include contacts with phone numbers
		if ( $campaign->is_sms_campaign() || $campaign->is_whatsapp_campaign() ) {
			$campaign_recipients = $campaign_recipients->whereNotNull( 'phone' )->where( 'phone', '!=', '' );
		}

		if ( ! empty( $filters ) ) {
			$contact_filters     = new Contact_Filters_Process( $campaign_recipients, $filters );
			$campaign_recipients = $contact_filters->filter();
		}

		$campaign->contacts_count = $campaign_recipients->count();

		if ( $campaign->is_email_campaign() ) {
			// Email campaign counts using centralized analytics
			$analytics = \QuillCRM\Services\Campaign_Analytics::instance();
			$stats     = $analytics->get_campaign_stats( 'email', $campaign->id );

			// Template counts (email-specific)
			$templates_count = array();
			foreach ( $campaign->get_template_ids() as $template_id ) {
				$templates_count[ $template_id ] = $campaign->messages()->emails()->where( 'template_id', $template_id )->count();
			}

			$campaign->templates_count = $templates_count;
			$campaign->sent_count      = $stats['sent'];
			$campaign->failed_count    = $stats['failed'];
			$campaign->opened_count    = $stats['opened'];
			$campaign->clicked_count   = $stats['clicked'];
		} elseif ( $campaign->is_sms_campaign() ) {
			// SMS campaign counts using centralized analytics
			$analytics = \QuillCRM\Services\Campaign_Analytics::instance();
			$stats     = $analytics->get_campaign_stats( 'sms', $campaign->id );

			// Template counts (SMS-specific - now supports A/B testing)
			$templates_count = array();
			foreach ( $campaign->get_template_ids() as $template_id ) {
				$templates_count[ $template_id ] = $campaign->messages()->sms()->where( 'template_id', $template_id )->count();
			}

			$campaign->templates_count = $templates_count;
			$campaign->sent_count      = $stats['sent'];
			$campaign->failed_count    = $stats['failed'];
			$campaign->pending_count   = $stats['pending'];
			$campaign->delivered_count = $stats['delivered']; // Now properly provided by analytics
			$campaign->clicked_count   = $stats['clicked'];
			$campaign->delivery_rate   = $stats['delivery_rate']; // Now properly calculated by analytics
			$campaign->click_rate      = $stats['click_rate'];
		} elseif ( $campaign->is_whatsapp_campaign() ) {
			// WhatsApp campaign counts using centralized analytics
			$analytics = \QuillCRM\Services\Campaign_Analytics::instance();
			$stats     = $analytics->get_campaign_stats( 'whatsapp', $campaign->id );

			// Template counts (WhatsApp-specific - now supports A/B testing)
			$templates_count = array();
			foreach ( $campaign->get_template_ids() as $template_id ) {
				$templates_count[ $template_id ] = $campaign->messages()->whatsapp()->where( 'template_id', $template_id )->count();
			}

			$campaign->templates_count = $templates_count;
			$campaign->sent_count      = $stats['sent'];
			$campaign->failed_count    = $stats['failed'];
			$campaign->pending_count   = $stats['pending'];
			$campaign->delivered_count = $stats['delivered']; // Now properly provided by analytics
			$campaign->read_count      = $stats['read']; // Now properly provided by analytics
			$campaign->clicked_count   = $stats['clicked'];
			$campaign->delivery_rate   = $stats['delivery_rate']; // Now properly calculated by analytics
			$campaign->read_rate       = $stats['read_rate']; // Now properly calculated by analytics
			$campaign->click_rate      = $stats['click_rate'];
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

				// Remove SMS-specific calculated properties
				unset( $campaign->pending_count );
				unset( $campaign->delivered_count );
				unset( $campaign->delivery_rate );
				unset( $campaign->click_rate );

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
				$campaign->sequences_mail()->delete();
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
