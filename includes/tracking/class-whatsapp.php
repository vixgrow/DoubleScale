<?php
/**
 * WhatsApp Tracking
 * This class is responsible for handling WhatsApp tracking functionality
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Tracking;

use QuillCRM\Models\Campaign_Message_Model;
use QuillCRM\Utils;
use QuillCRM\Abstracts\Abstract_Twilio_Tracking;

defined('ABSPATH') || exit;

/**
 * WhatsApp Tracking Class
 */
class WhatsApp extends Abstract_Twilio_Tracking
{

    /**
     * Campaign type
     *
     * @var string
     */
    protected $campaign_type = 'whatsapp';

    /**
     * Constructor
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Add hooks - implementation of abstract method
     *
     * @since 1.0.0
     */
    public function add_hooks()
    {
        // WhatsApp delivery webhooks for Twilio
        add_action('wp_ajax_nopriv_quillcrm_whatsapp_webhook', [$this, 'handle_webhook']);
        add_action('wp_ajax_quillcrm_whatsapp_webhook', [$this, 'handle_webhook']);

        // WhatsApp click tracking
        add_action('template_redirect', [$this, 'handle_whatsapp_click_tracking'], 1);
    }

    /**
     * Handle tracking requests - implementation of abstract method
     *
     * @since 1.0.0
     */
    public function handle_tracking()
    {
        if (!isset($_GET['quillcrm']) || !isset($_GET['hash_key'])) {
            return;
        }

        $action = sanitize_text_field($_GET['quillcrm']);
        $hash_key = sanitize_text_field($_GET['hash_key']);

        switch ($action) {
            case 'whatsapp_click':
                $this->handle_click_tracking($hash_key);
                break;
            case 'whatsapp_unsubscribe':
                $this->handle_unsubscribe($hash_key);
                break;
        }
    }

    /**
     * Handle WhatsApp click tracking
     *
     * @since 1.0.0
     */
    public function handle_whatsapp_click_tracking()
    {
        if (!isset($_GET['quillcrm']) || $_GET['quillcrm'] !== 'whatsapp_click') {
            return;
        }

        if (!isset($_GET['hash_key']) || !isset($_GET['original'])) {
            return;
        }

        $hash_key = sanitize_text_field($_GET['hash_key']);
        $original_url = esc_url_raw($_GET['original']);

        $this->handle_click_tracking($hash_key, $original_url);
    }



    /**
     * Handle webhook - implementation of abstract method
     *
     * @since 1.0.0
     * @return void
     */
    public function handle_webhook()
    {
        $this->process_webhook();
    }

    /**
     * Update delivery status - override parent method for WhatsApp specifics
     *
     * @since 1.0.0
     *
     * @param Campaign_Message_Model $campaign_record Campaign WhatsApp record
     * @param string $status Delivery status
     * @param string $error_code Error code if any
     * @param string $error_message Error message if any
     */
    protected function update_delivery_status($campaign_record, $status, $error_code = '', $error_message = '')
    {
        $previous_status = $campaign_record->status;

        switch ($status) {
            case 'sent':
                $campaign_record->status = 'sent';
                $campaign_record->sent_at = current_time('mysql');
                break;
            case 'delivered':
                $campaign_record->status = 'delivered';
                break;
            case 'read':
                $campaign_record->status = 'read';
                break;
            case 'failed':
                $campaign_record->status = 'failed';
                break;
        }

        $campaign_record->save();

        quillcrm_get_logger()->info('WhatsApp delivery status updated', [
            'campaign_whatsapp_id' => $campaign_record->id,
            'previous_status' => $previous_status,
            'new_status' => $status,
            'code' => 'whatsapp_delivery_update'
        ]);

        // Trigger delivery status hooks
        do_action('quillcrm_whatsapp_delivery_status_updated', $campaign_record, $status, $previous_status);
    }

    /**
     * Get webhook URL - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    public static function get_webhook_url()
    {
        return home_url('/wp-admin/admin-ajax.php?action=quillcrm_whatsapp_webhook');
    }



    /**
     * Get campaign model class - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    protected function get_campaign_model_class()
    {
        return Campaign_Message_Model::class;
    }

    /**
     * Get campaign mode - implementation of abstract method
     *
     * @since 1.0.0
     * @return int
     */
    protected function get_campaign_mode()
    {
        return Campaign_Message_Model::MODE_WHATSAPP;
    }

    /**
     * Get tracking action - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    protected static function get_tracking_action()
    {
        return 'whatsapp_click';
    }

    /**
     * Get unsubscribe action - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    protected static function get_unsubscribe_action()
    {
        return 'whatsapp_unsubscribe';
    }

    /**
     * Get campaign type - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    protected static function get_campaign_type()
    {
        return 'whatsapp';
    }

}

// Initialize
WhatsApp::instance();
