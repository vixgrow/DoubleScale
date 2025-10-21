<?php
/**
 * Abstract Send Message Action
 * Base class for all message sending actions (Email, SMS, WhatsApp)
 *
 * This class consolidates the common logic for sending messages across all channels:
 * - Template retrieval from step settings (templates created by model events)
 * - Tracking record creation
 * - Campaign infrastructure reuse
 * - Error handling and logging
 * - Validation patterns
 *
 * Child classes only need to implement channel-specific behavior.
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Template_Model;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Utils;

/**
 * Abstract_Send_Message class
 */
abstract class Abstract_Send_Message extends Action {

	/**
	 * Source - all message actions are of type 'message'
	 *
	 * @var string
	 */
	public $source = 'message';

	/**
	 * Get the channel type (email, sms, whatsapp)
	 * Used for template creation, tracking, and campaign type
	 *
	 * @return string
	 */
	abstract protected function get_channel_type();

	/**
	 * Get the tracking mode constant
	 *
	 * @return int Tracking_Model::MODE_EMAIL, MODE_SMS, or MODE_WHATSAPP
	 */
	abstract protected function get_tracking_mode();

	/**
	 * Get the recipient field from contact (email or phone)
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @return string|null
	 */
	abstract protected function get_recipient( Contact_Model $contact );

	/**
	 * Validate the recipient field
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @return array|null Returns array with status/message if invalid, null if valid
	 */
	abstract protected function validate_recipient( Contact_Model $contact );

	/**
	 * Get the content fields from step settings
	 * Returns array with keys: subject (optional), body, and any other channel-specific fields
	 *
	 * @param Automation_Step_Model $step Automation Step Model.
	 * @return array
	 */
	abstract protected function get_content_fields( Automation_Step_Model $step );

	/**
	 * Validate required content fields
	 *
	 * @param array $content_fields Content fields from get_content_fields().
	 * @return string|null Returns error message if invalid, null if valid
	 */
	abstract protected function validate_content_fields( array $content_fields );

	/**
	 * Get the processing instance for this channel
	 * Returns Email_Processing, SMS_Processing, or WhatsApp_Processing instance
	 *
	 * @return object
	 */
	abstract protected function get_processing_instance();

	/**
	 * Get the channel name for logging (Email, SMS, WhatsApp)
	 *
	 * @return string
	 */
	abstract protected function get_channel_name();

	/**
	 * Process Action
	 * Consolidated logic for all message sending actions
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
			$contact      = $automation_contact->contact;
			$channel_name = $this->get_channel_name();
			$channel_type = $this->get_channel_type();

			// 1. Get content fields from step settings
			$content_fields = $this->get_content_fields( $step );

			// 2. Validate required content fields
			$content_error = $this->validate_content_fields( $content_fields );
			if ( $content_error ) {
				quillcrm_get_logger()->error(
					"Send {$channel_name} action: {$content_error}",
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => "send_{$channel_type}_validation_error",
					)
				);
				return false;
			}

			// 3. Validate recipient
			$recipient_error = $this->validate_recipient( $contact );
			if ( $recipient_error ) {
				quillcrm_get_logger()->warning(
					"Send {$channel_name} action: {$recipient_error['message']}",
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => "send_{$channel_type}_no_recipient",
					)
				);
				return $recipient_error;
			}

			// 4. Check if contact is unsubscribed
			if ( $contact->status === 'unsubscribed' ) {
				quillcrm_get_logger()->info(
					"Send {$channel_name} action: Contact is unsubscribed",
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'code'          => "send_{$channel_type}_unsubscribed",
					)
				);
				return array(
					'status'  => 'skipped',
					'message' => 'Contact is unsubscribed',
				);
			}

			// 5. Get template from step settings (already created by model event)
			$template_ids = $step->get_setting( 'template_ids', array() );
			if ( empty( $template_ids ) ) {
				quillcrm_get_logger()->error(
					"Send {$channel_name} action: No template found in step settings",
					array(
						'automation_id' => $automation->id,
						'step_id'       => $step->id,
						'contact_id'    => $contact->id,
						'code'          => "send_{$channel_type}_no_template",
					)
				);
				throw new \Exception( "No template found for automation step {$step->id}" );
			}

			$template_id = reset( $template_ids );
			$template    = Template_Model::find( $template_id );

			if ( ! $template ) {
				quillcrm_get_logger()->error(
					"Send {$channel_name} action: Template not found in database",
					array(
						'automation_id' => $automation->id,
						'step_id'       => $step->id,
						'template_id'   => $template_id,
						'contact_id'    => $contact->id,
						'code'          => "send_{$channel_type}_template_not_found",
					)
				);
				throw new \Exception( "Template {$template_id} not found" );
			}

			// 6. Create tracking record BEFORE sending (critical for analytics)
			$tracking = Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => $template->id,
					'mode'        => $this->get_tracking_mode(),
					'source_type' => Message_Source_Types::AUTOMATION,
					'source_id'   => $automation->id,
					'recipient'   => $this->get_recipient( $contact ),
					'status'      => Tracking_Status::PENDING,
					'hash_key'    => Utils::generate_hash_key(),
				)
			);

			// 7. Create dummy campaign for process_campaign_message() to work
			// This allows us to reuse 100% of existing campaign infrastructure
			$dummy_campaign = new Campaign_Model(
				array(
					'id'       => $automation->id,
					'name'     => 'Automation: ' . $automation->name,
					'type'     => $channel_type,
					'settings' => array(),
				)
			);
			$dummy_campaign->exists = true; // Mark as existing to prevent save attempts

			// 8. REUSE EXISTING CAMPAIGN INFRASTRUCTURE
			// This gives us: merge tags, provider integration, tracking, etc.
			$this->get_processing_instance()->process_campaign_message(
				$dummy_campaign,
				$contact,
				$tracking
			);

			// 9. Check result and return
			$tracking->refresh();

			if ( $tracking->status === Tracking_Status::SENT ) {
				quillcrm_get_logger()->info(
					"Send {$channel_name} action: Message sent successfully",
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'tracking_id'   => $tracking->id,
						'template_id'   => $template->id,
						'code'          => "send_{$channel_type}_success",
					)
				);
				return true;
			} else {
				quillcrm_get_logger()->error(
					"Send {$channel_name} action: Message sending failed",
					array(
						'automation_id' => $automation->id,
						'contact_id'    => $contact->id,
						'tracking_id'   => $tracking->id,
						'status'        => $tracking->status,
						'code'          => "send_{$channel_type}_failed",
					)
				);
				return false;
			}
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				"Send {$this->get_channel_name()} action: Exception occurred",
				array(
					'automation_id' => $automation->id ?? 0,
					'contact_id'    => $automation_contact->contact->id ?? 0,
					'error'         => $e->getMessage(),
					'code'          => "send_{$this->get_channel_type()}_exception",
				)
			);
			return false;
		}
	}
}

