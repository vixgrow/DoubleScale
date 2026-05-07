<?php

/**
 * Sms Campaign Processing
 * This class is responsible for handling Sms campaign processing
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Campaigns\Campaign;

use DoubleScale\Modules\Campaigns\Models\CampaignModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Tracking\Models\CommunicationTrackingModel;
use DoubleScale\Modules\Campaigns\Models\TemplateModel;
use DoubleScale\Plugin;
use DoubleScale\Modules\Campaigns\Abstracts\AbstractCampaignProcessing;
use DoubleScale\Modules\Tracking\Sms;
use DoubleScale\Constants\CampaignChannel;
use DoubleScale\Utils\PhoneValidator;

/**
 * Sms Campaign Processing class
 */
class SmsProcessing extends AbstractCampaignProcessing
{

	/**
	 * Communication channel
	 *
	 * @var string
	 */
	protected $channel = CampaignChannel::STR_SMS;

	/**
	 * Add hooks
	 *
	 * @return void
	 */
	public function add_hooks()
	{
		$this->register_campaign_processing_hooks();
	}

	/**
	 * Get campaign message mode
	 *
	 * @return int
	 */
	public function get_message_mode()
	{
		return CommunicationTrackingModel::MODE_SMS;
	}

	/**
	 * Get channel context for merge tags
	 *
	 * @return string
	 */
	public function get_channel_context()
	{
		return 'sms';
	}

	/**
	 * Prepare message content - Override to set channel context for merge tags
	 *
	 * @param \DoubleScale\Modules\Campaigns\Models\TemplateModel                         $template Template model
	 * @param ContactModel|\DoubleScale\Modules\Automations\Models\AutomationContactModel $contact_or_automation_contact Contact or Automation Contact model
	 * @param CommunicationTrackingModel                            $campaign_message Campaign tracking record
	 * @return array Message data array with subject, body, recipient, hash_key
	 */
	protected function prepare_message_content( TemplateModel $template, $contact_or_automation_contact, CommunicationTrackingModel $campaign_message )
	{
		// Set channel context for merge tags
		add_filter('doublescale_current_channel_context', array($this, 'get_channel_context'), 10);

		// Call parent method to process message
		$message_data = parent::prepare_message_content($template, $contact_or_automation_contact, $campaign_message);

		// Remove filter to prevent pollution
		remove_filter('doublescale_current_channel_context', array($this, 'get_channel_context'), 10);

		return $message_data;
	}

	/**
	 * Get recipient field from contact
	 *
	 * @param ContactModel $contact
	 * @return string|null
	 */
	protected function get_recipient(ContactModel $contact)
	{
		$phone = $contact->phone;

		if (empty($phone)) {
			doublescale_get_logger()->info(
				'Contact skipped - no phone number for Sms campaign',
				array(
					'code'       => 'missing_phone',
					'contact_id' => $contact->id,
				)
			);
			return null;
		}

		$sanitized = PhoneValidator::sanitize( $phone );
		if ( empty( $sanitized ) ) {
			doublescale_get_logger()->info(
				'Contact skipped - invalid phone number format for Sms campaign',
				array(
					'code'       => 'invalid_phone_format',
					'contact_id' => $contact->id,
					'phone'      => $phone,
				)
			);
			return null;
		}

		return $sanitized;
	}

	/**
	 * Send message
	 *
	 * @param array          $message_data Prepared message data
	 * @param ContactModel  $contact Contact model
	 * @param CommunicationTrackingModel $campaign_message Campaign tracking record
	 * @return array Result array with 'success' boolean and optional data
	 */
	protected function send_message($message_data, ContactModel $contact, CommunicationTrackingModel $campaign_message)
	{
		return $this->send_via_provider($message_data, $contact, $campaign_message);
	}

	/**
	 * Get tracking class
	 *
	 * @return string
	 */
	protected function get_tracking_class()
	{
		return \DoubleScale\Modules\Tracking\Sms::class;
	}

	/**
	 * Get default campaign content
	 *
	 * @return string
	 */
	protected function get_default_campaign_content()
	{
		return sprintf(__('Hi {{contact:first_name}}, thank you for subscribing! Reply STOP to unsubscribe.', 'doublescale'));
	}
}
