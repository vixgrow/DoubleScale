<?php
/**
 * SMS Campaign Processing
 * This class is responsible for handling SMS campaign processing
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Campaign;

use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Abstracts\Abstract_Campaign_Processing;
use QuillCRM\Tracking\SMS as SMS_Tracking;

/**
 * SMS Campaign Processing class
 */
class SMS_Processing extends Abstract_Campaign_Processing
{
    /**
     * Campaign type
     *
     * @var string
     */
    protected $campaign_type = 'sms';

    /**
     * Add hooks
     *
     * @return void
     */
    public function add_hooks()
    {
        add_action(
            'init',
            function () {
                QuillCRM::instance()->daily_tasks->register_callback('quillcrm_daily3', array($this, 'reset_daily_count'));
                QuillCRM::instance()->campaigns_tasks->register_callback('quillcrm_sms_campaigns', array($this, 'process_campaigns'));
                QuillCRM::instance()->campaigns_tasks->register_callback('process_campaign_sms', array($this, 'process_campaign_message'));
            }
        );
    }

    /**
     * Get campaign message mode
     *
     * @return int
     */
    protected function get_message_mode()
    {
        return Tracking_Model::MODE_SMS;
    }

    /**
     * Get recipient field from contact
     *
     * @param Contact_Model $contact
     * @return string|null
     */
    protected function get_recipient(Contact_Model $contact)
    {
        return $contact->phone;
    }

    /**
     * Send message
     *
     * @param array $message_data Prepared message data
     * @param Contact_Model $contact Contact model
     * @param Tracking_Model $campaign_message Campaign tracking record
     * @return array Result array with 'success' boolean and optional data
     */
    protected function send_message($message_data, Contact_Model $contact, Tracking_Model $campaign_message)
    {
        try {
            // Prepare SMS data
            $sms_data = array(
                'Body' => $message_data['body'],
                'To' => $campaign_message->recipient,
            );

            // Add StatusCallback if webhook URL is available
            $webhook_url = SMS_Tracking::get_webhook_url();
            $sms_data = $this->prepare_status_callback($webhook_url, $sms_data);

            // Send SMS
            $result = $this->external_api->send_sms($sms_data);

            return $result ?? array('success' => false);
        } catch (\Exception $e) {
            quillcrm_get_logger()->error(
                __('SMS send error.', 'quillcrm'),
                array(
                    'code' => 'sms_send_error',
                    'error' => $e->getMessage(),
                )
            );
            return array('success' => false, 'error' => $e->getMessage());
        }
    }

    /**
     * Get tracking class
     *
     * @return string
     */
    protected function get_tracking_class()
    {
        return \QuillCRM\Tracking\SMS::class;
    }

    /**
     * Prepare StatusCallback URL for Twilio requests
     * Excludes StatusCallback for localhost development environments
     *
     * @param string $webhook_url The webhook URL to use
     * @param array $data The message data array to modify
     * @return array Modified data array
     */
    protected function prepare_status_callback($webhook_url, $data = array())
    {
        // Only add StatusCallback for production URLs (not localhost)
        $site_url = home_url();
        if (!empty($webhook_url) && strpos($site_url, 'localhost') === false && strpos($site_url, '127.0.0.1') === false) {
            $data['StatusCallback'] = $webhook_url;
        }

        return $data;
    }
}
