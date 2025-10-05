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
use QuillCRM\Abstracts\Abstract_Provider_Tracking;

defined('ABSPATH') || exit;

/**
 * SMS Tracking Class
 */
class SMS extends Abstract_Provider_Tracking
{
	/**
	 * Campaign type
	 *
	 * @var string
	 */
	protected $campaign_type = 'sms';

	/**
	 * Add hooks - implementation of abstract method
	 *
	 * @since 1.0.0
	 */
	public function add_hooks()
	{
		$this->register_standard_hooks();
	}

	/**
	 * Handle tracking requests - implementation of abstract method
	 *
	 * @since 1.0.0
	 */
	public function handle_tracking()
	{
		$this->handle_standard_tracking();
	}

	/**
	 * Handle webhook - implementation of abstract method
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function handle_webhook()
	{
		$this->process_provider_webhook();
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