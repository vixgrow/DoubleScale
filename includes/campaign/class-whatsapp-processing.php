<?php
/**
 * WhatsApp Campaign Processing
 * This class is responsible for handling WhatsApp campaign processing
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
use QuillCRM\Tracking\WhatsApp as WhatsApp_Tracking;

/**
 * WhatsApp Campaign Processing class
 */
class WhatsApp_Processing extends Abstract_Campaign_Processing
{
    /**
     * Campaign type
     *
     * @var string
     */
    protected $campaign_type = 'whatsapp';

    /**
     * Add hooks
     *
     * @return void
     */
    public function add_hooks()
    {
        $this->register_twilio_hooks();
    }

    /**
     * Get campaign message mode
     *
     * @return int
     */
    protected function get_message_mode()
    {
        return Tracking_Model::MODE_WHATSAPP;
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
        return $this->send_twilio_message($message_data, $contact, $campaign_message);
    }

    /**
     * Get tracking class
     *
     * @return string
     */
    protected function get_tracking_class()
    {
        return WhatsApp_Tracking::class;
    }

    /**
     * Call external API - implementation for WhatsApp
     *
     * @param array $api_data API data to send
     * @return array Result from API
     */
    protected function call_external_api($api_data)
    {
        return $this->external_api->send_whatsapp($api_data);
    }


}
