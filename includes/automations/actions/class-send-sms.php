<?php
/**
 * Send SMS Action
 * Auto-generates templates and creates tracking records
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Services\Auto_Template_Manager;
use QuillCRM\Campaign\SMS_Processing;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Utils;

/**
 * Send SMS Action
 */
class Send_SMS extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send SMS';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_sms';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'message';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'sms';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send an SMS to the user with full tracking and analytics.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Process Action
	 * auto-create template, create tracking, reuse campaign infrastructure
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $automation_contact Automation Contact Model.
	 *
	 * @return bool|array True on success, false or array with status on failure
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		try {
			// 1. Get SMS content from step settings (user composes directly in UI)
			$body = $step->get_setting( 'body' );

			$contact = $automation_contact->contact;

			// Validate required fields
			if ( empty( $body ) ) {
				quillcrm_get_logger()->error(
					'Send SMS action: Body is required',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => 'send_sms_no_body',
					)
				);
				return false;
			}

			if ( empty( $contact->phone ) ) {
				quillcrm_get_logger()->warning(
					'Send SMS action: Contact has no phone number',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => 'send_sms_no_phone',
					)
				);
				return array(
					'status'  => 'skipped',
					'message' => 'Contact has no phone number',
				);
			}

			// Check if contact is unsubscribed
			if ( $contact->status === 'unsubscribed' ) {
				quillcrm_get_logger()->info(
					'Send SMS action: Contact is unsubscribed',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => 'send_sms_unsubscribed',
					)
				);
				return array(
					'status'  => 'skipped',
					'message' => 'Contact is unsubscribed',
				);
			}

			// 2. Auto-create or find template (with deduplication)
			// SMS templates don't have subject, just body
			$template = Auto_Template_Manager::find_or_create(
				'', // No subject for SMS
				$body,
				array(),
				\QuillCRM\Constants\Campaign_Channel::CHANNEL_SMS
			);

			// 3. Create tracking record BEFORE sending (critical for analytics)
			$tracking = Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => $template->id,
					'mode'        => Tracking_Model::MODE_SMS,
					'source_type' => Message_Source_Types::AUTOMATION,
					'source_id'   => $automation->id,
					'recipient'   => $contact->phone,
					'status'      => Tracking_Status::PENDING,
					'hash_key'    => Utils::generate_hash_key(),
				)
			);

			// 4. Create dummy campaign for process_campaign_message() to work
			// This allows us to reuse 100% of existing campaign infrastructure
			$dummy_campaign = new Campaign_Model(
				array(
					'id'       => $automation->id,
					'name'     => 'Automation: ' . $automation->name,
					'type'     => 'sms',
					'settings' => array(),
				)
			);
			$dummy_campaign->exists = true; // Mark as existing to prevent save attempts

			// 5. ✅ REUSE EXISTING CAMPAIGN INFRASTRUCTURE
			// This gives us: merge tags, provider integration, click tracking, etc.
			SMS_Processing::instance()->process_campaign_message(
				$dummy_campaign,
				$contact,
				$tracking
			);

			// 6. Check result and return
			$tracking->refresh();

			if ( $tracking->status === Tracking_Status::SENT ) {
				quillcrm_get_logger()->info(
					'Send SMS action: SMS sent successfully',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'tracking_id'   => $tracking->id,
						'template_id'   => $template->id,
						'code'          => 'send_sms_success',
					)
				);
				return true;
			} else {
				quillcrm_get_logger()->error(
					'Send SMS action: SMS sending failed',
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'tracking_id'   => $tracking->id,
						'status'        => $tracking->status,
						'code'          => 'send_sms_failed',
					)
				);
				return false;
			}
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				'Send SMS action: Exception occurred',
				array(
					'automation_id' => $automation->id ?? 0,
					'contact_id'    => $automation_contact->contact->id ?? 0,
					'error'         => $e->getMessage(),
					'code'          => 'send_sms_exception',
				)
			);
			return false;
		}
	}

	/**
	 * Get fields for UI
	 * User composes SMS directly (no template selection)
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'body' => array(
				'label'       => __( 'Message', 'quillcrm' ),
				'type'        => 'textarea',
				'required'    => true,
				'placeholder' => __( 'Enter SMS message...', 'quillcrm' ),
				'description' => __( 'Maximum 160 characters for standard SMS. Longer messages will be split.', 'quillcrm' ),
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'body' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Send_SMS::instance();

