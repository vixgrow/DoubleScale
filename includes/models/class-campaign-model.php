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
use QuillCRM\Models\Campaign_Message_Model;
use QuillCRM\Models\Template_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Contact_Filters\Process as Contact_Filters_Process;
use QuillCRM\Managers\Campaign_Status_Manager;

/**
 * Campaign_Model class
 */
class Campaign_Model extends Model
{

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
	public function messages()
	{
		return $this->hasMany(Campaign_Message_Model::class, 'campaign_id', 'id');
	}

	/**
	 * Get the campaign emails
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function emails()
	{
		return $this->messages()->emails();
	}

	/**
	 * Get the campaign SMS
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function sms()
	{
		return $this->messages()->sms();
	}

	/**
	 * Get the campaign WhatsApp messages
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function whatsapp()
	{
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
	public function get_setting($key, $default = null)
	{
		return isset($this->settings[$key]) ? $this->settings[$key] : $default;
	}

	/**
	 * Get campaign type (email, sms, or whatsapp)
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_type()
	{
		return $this->type ?? 'email';
	}

	/**
	 * Check if campaign is SMS type
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_sms_campaign()
	{
		return $this->get_type() === 'sms';
	}

	/**
	 * Check if campaign is email type
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_email_campaign()
	{
		return $this->get_type() === 'email';
	}

	/**
	 * Check if campaign is WhatsApp type
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_whatsapp_campaign()
	{
		return $this->get_type() === 'whatsapp';
	}



	/**
	 * Get the templates
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_templates()
	{
		$template_ids = $this->get_setting('template_ids', array());
		
		if (empty($template_ids)) {
			return array();
		}
		
		$templates = array();
		$campaign_type = $this->get_type();
		
		foreach ($template_ids as $template_id) {
			$template = Template_Model::find($template_id);
			if ($template) {
				$template_data = array(
					'template_id' => $template->id,
					'name' => $template->name,
					'body' => $template->body,
					'type' => $template->type,
				);
				
				if ($campaign_type === 'email') {
					// Email-specific template data
					$template_data = array_merge($template_data, array(
						'subject' => $template->subject,
						'from_name' => $template->get_setting('from_name'),
						'from_email' => $template->get_setting('from_email'),
						'reply_to' => $template->get_setting('reply_to'),
						'preview_text' => $template->get_setting('preview_text'),
						'enable_utm' => $template->get_setting('enable_utm'),
						'utm_source' => $template->get_setting('utm_source'),
						'utm_medium' => $template->get_setting('utm_medium'),
						'utm_campaign' => $template->get_setting('utm_campaign'),
						'utm_term' => $template->get_setting('utm_term'),
						'utm_content' => $template->get_setting('utm_content'),
					));
				} elseif ($campaign_type === 'sms') {
					// SMS-specific template data
					$template_data = array_merge($template_data, array(
						'message' => $template->body,
						'add_unsubscribe' => $template->get_setting('add_unsubscribe', true),
					));
				} elseif ($campaign_type === 'whatsapp') {
					// WhatsApp-specific template data
					$template_data = array_merge($template_data, array(
						'message' => $template->body,
						'message_type' => $template->get_setting('message_type', 'text'),
						'media_url' => $template->get_setting('media_url'),
						'add_unsubscribe' => $template->get_setting('add_unsubscribe', true),
					));
				}
				
				$templates[] = $template_data;
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
	private function process_templates($templates_data)
	{
		$template_ids = array();
		$campaign_type = $this->get_type();
		
		foreach ($templates_data as $template_data) {
			$template_id = $template_data['template_id'] ?? null;
			$hidden = $template_data['hidden'] ?? 1;
			
			if ($campaign_type === 'email') {
				// Email template processing
				$from_name = $template_data['from_name'] ?? null;
				$from_email = $template_data['from_email'] ?? null;
				$reply_to = $template_data['reply_to'] ?? null;
				$subject = $template_data['subject'] ?? null;
				$preview_text = $template_data['preview_text'] ?? null;
				$body = $template_data['body'] ?? 'This is a test email';
				$enable_utm = $template_data['enable_utm'] ?? false;
				$utm_source = $template_data['utm_source'] ?? null;
				$utm_medium = $template_data['utm_medium'] ?? null;
				$utm_campaign = $template_data['utm_campaign'] ?? null;
				$utm_term = $template_data['utm_term'] ?? null;
				$utm_content = $template_data['utm_content'] ?? null;
				
				$template = Template_Model::createOrUpdate(
					$template_id,
					array(
						'name' => $subject ?: __('Email Campaign Template', 'quillcrm'),
						'type' => $campaign_type,
						'subject' => $subject ?? '',
						'body' => $body ?? '',
						'settings' => array(
							'from_name' => $from_name,
							'from_email' => $from_email,
							'reply_to' => $reply_to,
							'preview_text' => $preview_text,
							'enable_utm' => $enable_utm,
							'utm_source' => $utm_source,
							'utm_medium' => $utm_medium,
							'utm_campaign' => $utm_campaign,
							'utm_term' => $utm_term,
							'utm_content' => $utm_content,
						),
						'hidden' => $hidden,
					)
				);
			} elseif ($campaign_type === 'sms') {
				// SMS template processing
				$message = $template_data['message'] ?? 'Hello from QuillCRM!';
				$name = $template_data['name'] ?? null;
				$add_unsubscribe = $template_data['add_unsubscribe'] ?? true;
				
				$template = Template_Model::createOrUpdate(
					$template_id,
					array(
						'name' => $name ?: __('SMS Campaign Template', 'quillcrm'),
						'type' => $campaign_type,
						'subject' => '', // SMS doesn't use subject
						'body' => $message,
						'settings' => array(
							'add_unsubscribe' => $add_unsubscribe,
						),
						'hidden' => $hidden,
					)
				);
			} elseif ($campaign_type === 'whatsapp') {
				$message = $template_data['message'] ?? 'Hello from QuillCRM!';
				$name = $template_data['name'] ?? null;
				$message_type = $template_data['message_type'] ?? 'text';
				$media_url = $template_data['media_url'] ?? null;
				$add_unsubscribe = $template_data['add_unsubscribe'] ?? true;

				$template = Template_Model::createOrUpdate(
					$template_id,
					array(
						'name' => $name ?: __('WhatsApp Campaign Template', 'quillcrm'),
						'type' => $campaign_type,
						'subject' => '', // WhatsApp doesn't use subject
						'body' => $message,
						'settings' => array(
							'message_type' => $message_type,
							'media_url' => $media_url,
							'add_unsubscribe' => $add_unsubscribe,
						),
						'hidden' => $hidden,
					)
				);
			}
			
			$template_ids[] = $template->id;
		}
		
		return $template_ids;
	}

	/**
	 * Get template IDs
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_template_ids()
	{
		return $this->get_setting('template_ids', array());
	}

	/**
	 * Get template count
	 *
	 * @since 1.0.0
	 *
	 * @return int
	 */
	public function get_template_count()
	{
		return count($this->get_template_ids());
	}

	/**
	 * Check if campaign has multiple templates (A/B testing)
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function has_multiple_templates()
	{
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
		$filters = $campaign->get_setting('filters', array());
		$campaign_recipients = Contact_Model::where('status', 'subscribed');

		// For SMS and WhatsApp campaigns, only include contacts with phone numbers
		if ($campaign->is_sms_campaign() || $campaign->is_whatsapp_campaign()) {
			$campaign_recipients = $campaign_recipients->whereNotNull('phone')->where('phone', '!=', '');
		}

		if (!empty($filters)) {
			$contact_filters = new Contact_Filters_Process($campaign_recipients, $filters);
			$campaign_recipients = $contact_filters->filter();
		}

		$campaign->contacts_count = $campaign_recipients->count();

		if ($campaign->is_email_campaign()) {
			// Email campaign counts using centralized analytics
			$analytics = \QuillCRM\Services\Campaign_Analytics::instance();
			$stats = $analytics->get_campaign_stats('email', $campaign->id);
			
			// Template counts (email-specific)
			$templates_count = array();
			foreach ($campaign->get_template_ids() as $template_id) {
				$templates_count[$template_id] = $campaign->messages()->emails()->where('template_id', $template_id)->count();
			}

			$campaign->templates_count = $templates_count;
			$campaign->sent_count = $stats['sent'];
			$campaign->failed_count = $stats['failed'];
			$campaign->opened_count = $stats['opened'];
			$campaign->clicked_count = $stats['clicked'];
		} elseif ($campaign->is_sms_campaign()) {
			// SMS campaign counts using centralized analytics
			$analytics = \QuillCRM\Services\Campaign_Analytics::instance();
			$stats = $analytics->get_campaign_stats('sms', $campaign->id);
			
			// Template counts (SMS-specific - now supports A/B testing)
			$templates_count = array();
			foreach ($campaign->get_template_ids() as $template_id) {
				$templates_count[$template_id] = $campaign->messages()->sms()->where('template_id', $template_id)->count();
			}

			$campaign->templates_count = $templates_count;
			$campaign->sent_count = $stats['sent'];
			$campaign->failed_count = $stats['failed'];
			$campaign->pending_count = $stats['pending'];
			$campaign->delivered_count = $stats['delivered'];
			$campaign->clicked_count = $stats['clicked'];
			$campaign->delivery_rate = $stats['delivery_rate'];
			$campaign->click_rate = $stats['click_rate'];
		} elseif ($campaign->is_whatsapp_campaign()) {
			// WhatsApp campaign counts using centralized analytics
			$analytics = \QuillCRM\Services\Campaign_Analytics::instance();
			$stats = $analytics->get_campaign_stats('whatsapp', $campaign->id);
			
			// Template counts (WhatsApp-specific - now supports A/B testing)
			$templates_count = array();
			foreach ($campaign->get_template_ids() as $template_id) {
				$templates_count[$template_id] = $campaign->messages()->whatsapp()->where('template_id', $template_id)->count();
			}

			$campaign->templates_count = $templates_count;
			$campaign->sent_count = $stats['sent'];
			$campaign->failed_count = $stats['failed'];
			$campaign->pending_count = $stats['pending'];
			$campaign->delivered_count = $stats['delivered'];
			$campaign->read_count = $stats['read'];
			$campaign->clicked_count = $stats['clicked'];
			$campaign->delivery_rate = $stats['delivery_rate'];
			$campaign->read_rate = $stats['read_rate'];
			$campaign->click_rate = $stats['click_rate'];
		}
	}

	/**
	 * Get status manager
	 * 
	 * @return Campaign_Status_Manager
	 */
	protected function get_status_manager()
	{
		return Campaign_Status_Manager::instance();
	}


	/**
	 * Get status label
	 *
	 * @return string
	 */
	public function get_status_label()
	{
		$labels = $this->get_status_manager()->get_status_labels();
		return $labels[$this->status] ?? $this->status;
	}

	/**
	 * Validate status before setting
	 *
	 * @param string $value
	 */
	public function setStatusAttribute($value)
	{
		$manager = $this->get_status_manager();

		if (!$manager->is_valid_status($value)) {
			throw new \InvalidArgumentException("Invalid campaign status: {$value}");
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
	public static function boot()
	{
		parent::boot();

		// Save templates when saving the campaign
		static::saving(
			function ($campaign) {
				// Retrieve the settings attribute
				$settings = $campaign->settings;

				// If templates exist in settings, create/update Template_Model records
				if (isset($settings['templates']) && is_array($settings['templates'])) {
					$template_ids = $campaign->process_templates($settings['templates']);

					// Store only template IDs in settings and remove full template objects
					$settings['template_ids'] = $template_ids;
					unset($settings['templates']);
				}

				// Set the modified settings back to the model
				$campaign->settings = $settings;

				// Remove the contacts count, sent count, opened count and clicked count
				unset($campaign->templates_count);
				unset($campaign->contacts_count);
				unset($campaign->sent_count);
				unset($campaign->failed_count);
				unset($campaign->opened_count);
				unset($campaign->clicked_count);
				
				// Remove SMS-specific calculated properties
				unset($campaign->pending_count);
				unset($campaign->delivered_count);
				unset($campaign->delivery_rate);
				unset($campaign->click_rate);
				
				// Remove WhatsApp-specific calculated properties
				unset($campaign->read_count);
				unset($campaign->read_rate);
			}
		);

		// Delete the campaign templates when deleting the campaign
		static::deleting(
			function ($campaign) {
				// Get template IDs and delete associated templates
				$template_ids = $campaign->get_template_ids();

				foreach ($template_ids as $template_id) {
					$template = Template_Model::find($template_id);
					if ($template) {
						$template->delete();
					}
				}
			}
		);

		static::retrieved(
			function ($campaign) {
				$campaign->attach_counts($campaign);
			}
		);

		static::saved(
			function ($campaign) {
				$campaign->attach_counts($campaign);
			}
		);
	}
}
