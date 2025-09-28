<?php
/**
 * SMS Tracking
 * This class is responsible for handling SMS tracking functionality
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Tracking;

use QuillCRM\Models\Tracking_Model;
use QuillCRM\Utils;
use QuillCRM\Abstracts\Abstract_Twilio_Tracking;

defined('ABSPATH') || exit;

/**
 * SMS Tracking Class
 */
class SMS extends Abstract_Twilio_Tracking
{

    /**
     * Campaign type
     *
     * @var string
     */
    protected $campaign_type = 'sms';

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
        // SMS delivery webhooks for Twilio
        add_action('wp_ajax_nopriv_quillcrm_sms_webhook', [$this, 'handle_webhook']);
        add_action('wp_ajax_quillcrm_sms_webhook', [$this, 'handle_webhook']);

        // SMS click tracking
        add_action('template_redirect', [$this, 'handle_sms_click_tracking'], 1);
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
            case 'sms_click':
                $this->handle_click_tracking($hash_key);
                break;
            case 'sms_unsubscribe':
                $this->handle_unsubscribe($hash_key);
                break;
        }
    }

    /**
     * Handle SMS click tracking
     *
     * @since 1.0.0
     */
    public function handle_sms_click_tracking()
    {
        if (!isset($_GET['quillcrm']) || $_GET['quillcrm'] !== 'sms_click') {
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
     * Get webhook URL - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    public static function get_webhook_url()
    {
        return home_url('/wp-admin/admin-ajax.php?action=quillcrm_sms_webhook');
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
     * Get campaign model class - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    protected function get_campaign_model_class()
    {
        return Tracking_Model::class;
    }

    /**
     * Get campaign mode - implementation of abstract method
     *
     * @since 1.0.0
     * @return int
     */
    protected function get_campaign_mode()
    {
        return Tracking_Model::MODE_SMS;
    }

    /**
     * Get tracking action - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    protected static function get_tracking_action()
    {
        return 'sms_click';
    }

    /**
     * Get unsubscribe action - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    protected static function get_unsubscribe_action()
    {
        return 'sms_unsubscribe';
    }

    /**
     * Get campaign type - implementation of abstract method
     *
     * @since 1.0.0
     * @return string
     */
    protected static function get_campaign_type()
    {
        return 'sms';
    }
}

// Initialize
SMS::instance();
