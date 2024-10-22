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

use QuillCRM\Models\Model;
use QuillCRM\Models\Campaign_Email_Model;
use QuillCRM\Models\Template_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Contact_Filters\Process as Contact_Filters_Process;

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
	 * Get the campaign emails
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function emails() {
		return $this->hasMany( Campaign_Email_Model::class, 'campaign_id', 'id' );
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
	 * Get the templates
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_templates() {
		// Get the templates
		$templates = $this->get_setting( 'templates', array() );

		foreach ( $templates as $index => $template ) {
			$template_id  = $template['template_id'] ?? null;
			$from_name    = $template['from_name'] ?? null;
			$from_email   = $template['from_email'] ?? null;
			$reply_to     = $template['reply_to'] ?? null;
			$subject      = $template['subject'] ?? null;
			$preview_text = $template['preview_text'] ?? null;
			$body         = $template['body'] ?? 'This is a test email';
			$enable_utm   = $template['enable_utm'] ?? false;
			$utm_source   = $template['utm_source'] ?? null;
			$utm_medium   = $template['utm_medium'] ?? null;
			$utm_campaign = $template['utm_campaign'] ?? null;
			$utm_term     = $template['utm_term'] ?? null;
			$utm_content  = $template['utm_content'] ?? null;
			$hidden       = $template['hidden'] ?? 1;
			$template     = Template_Model::createOrUpdate(
				$template_id,
				array(
					'name'     => __( 'Campaign Template', 'quillcrm' ),
					'type'     => 'email',
					'subject'  => $subject ?? '',
					'body'     => $body ?? '',
					'settings' => array(
						'from_name'    => $from_name,
						'from_email'   => $from_email,
						'reply_to'     => $reply_to,
						'preview_text' => $preview_text,
						'enable_utm'   => $enable_utm,
						'utm_source'   => $utm_source,
						'utm_medium'   => $utm_medium,
						'utm_campaign' => $utm_campaign,
						'utm_term'     => $utm_term,
						'utm_content'  => $utm_content,
					),
					'hidden'   => $hidden,
				)
			);

			// Update the template id
			$templates[ $index ]['template_id'] = $template->id;
		}

		return $templates;
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
			function( $campaign ) {
				// Retrieve the settings attribute
				$settings = $campaign->settings;

				// Modify the templates key in the settings array
				$settings['templates'] = $campaign->get_templates();
				// Set the modified settings back to the model
				$campaign->settings = $settings;

				// Remove the contacts count, sent count, opened count and clicked count
				unset( $campaign->contacts_count );
				unset( $campaign->sent_count );
				unset( $campaign->opened_count );
				unset( $campaign->clicked_count );
			}
		);

		// Delete the campaign templates when deleting the campaign
		static::deleting(
			function( $campaign ) {
				// Get the templates
				$templates = $campaign->get_templates();

				// Delete the templates
				foreach ( $templates as $template ) {
					$template_id = $template['template_id'] ?? null;
					if ( $template_id ) {
						$template = Template_Model::find( $template_id );
						if ( $template ) {
							$template->delete();
						}
					}
				}
			}
		);

		static::retrieved(
			function ( $campaign ) {
				$filters             = $campaign->get_setting( 'filters', array() );
				$campaign_recipients = Contact_Model::where( 'status', 'subscribed' );
				if ( ! empty( $filters ) ) {
					$contact_filters     = new Contact_Filters_Process( $campaign_recipients, $filters );
					$campaign_recipients = $contact_filters->filter();
				}

				$campaign->contacts_count = $campaign_recipients->count();
				$campaign->sent_count     = $campaign->emails()->where( 'status', 'sent' )->count();
				$campaign->opened_count   = $campaign->emails()->where( 'clicked', 1 )->count();
				$campaign->clicked_count  = $campaign->emails()->where( 'opened', 1 )->count();
			}
		);
	}
}
