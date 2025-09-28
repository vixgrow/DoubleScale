<?php
/**
 * Abstract Twilio Tracking
 * Base class for all Twilio-based tracking functionality (SMS, WhatsApp)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Utils;

defined('ABSPATH') || exit;

/**
 * Abstract_Twilio_Tracking Class
 */
abstract class Abstract_Twilio_Tracking
{
	/**
	 * Instance storage for child classes
	 *
	 * @var array
	 */
	private static $instances = array();

	/**
	 * Campaign type (sms, whatsapp)
	 *
	 * @var string
	 */
	protected $campaign_type;

	/**
	 * Get instance - implemented by child classes
	 *
	 * @return static
	 */
	public static function instance()
	{
		$class = get_called_class();
		if (!isset(self::$instances[$class])) {
			self::$instances[$class] = new static();
		}
		return self::$instances[$class];
	}

	/**
	 * Constructor
	 */
	public function __construct()
	{
		add_action('init', [$this, 'handle_tracking']);
		add_action('quillcrm_loaded', [$this, 'add_hooks']);
	}

	/**
	 * Add hooks - must be implemented by child classes
	 *
	 * @return void
	 */
	abstract public function add_hooks();

	/**
	 * Handle tracking requests - must be implemented by child classes
	 *
	 * @return void
	 */
	abstract public function handle_tracking();

	/**
	 * Get webhook URL - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract public static function get_webhook_url();

	/**
	 * Handle webhook - must be implemented by child classes
	 *
	 * @return void
	 */
	abstract public function handle_webhook();

	/**
	 * Get campaign model class - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected function get_campaign_model_class();

	/**
	 * Get campaign mode for unified table filtering
	 *
	 * @return int
	 */
	abstract protected function get_campaign_mode();

	/**
	 * Verify Twilio webhook signature
	 * Common signature verification logic for all Twilio webhooks
	 *
	 * @return bool
	 */
	protected function verify_twilio_webhook()
	{
		// Get Twilio auth token from integration settings
		$twilio_integration = \QuillCRM\Managers\Integrations_Manager::instance()->get_integration('twilio');

		if (!$twilio_integration) {
			return false;
		}

		$auth_token = $twilio_integration->get_setting('auth_token');
		if (!$auth_token) {
			return false;
		}

		// Get webhook URL and signature
		$url = static::get_webhook_url();
		$signature = $_SERVER['HTTP_X_TWILIO_SIGNATURE'] ?? '';

		if (!$signature) {
			return false;
		}

		// Build data string for validation
		$data = '';
		ksort($_POST);
		foreach ($_POST as $key => $value) {
			$data .= $key . $value;
		}

		// Calculate expected signature
		$expected_signature = base64_encode(hash_hmac('sha1', $url . $data, $auth_token, true));

		return hash_equals($expected_signature, $signature);
	}

	/**
	 * Process webhook data and update delivery status (Simplified)
	 * Simplified webhook processing for common features only
	 *
	 * @return void
	 */
	protected function process_webhook()
	{
		// For simplified implementation, we don't use complex webhook processing
		// Just acknowledge the webhook and return OK
		wp_die('OK');
	}

	/**
	 * Update delivery status for campaign record (Simplified)
	 * Basic status update for common features only
	 *
	 * @param mixed $campaign_record Campaign record (SMS or WhatsApp model)
	 * @param string $status Delivery status
	 * @param string $error_code Error code if any
	 * @param string $error_message Error message if any
	 * @return void
	 */
	protected function update_delivery_status($campaign_record, $status, $error_code = '', $error_message = '')
	{
		// Simplified: Only update basic status
		switch ($status) {
			case 'sent':
				$campaign_record->status = 'sent';
				$campaign_record->sent_at = current_time('mysql');
				break;
			case 'failed':
				$campaign_record->status = 'failed';
				break;
		}

		$campaign_record->save();

		quillcrm_get_logger()->info("{$this->campaign_type} status updated", [
			'campaign_record_id' => $campaign_record->id,
			'new_status' => $status,
			'code' => "{$this->campaign_type}_status_update"
		]);

		// Trigger status hooks
		do_action("quillcrm_{$this->campaign_type}_status_updated", $campaign_record, $status);
	}

	/**
	 * Add click tracking to message content
	 * Common click tracking logic for all Twilio services
	 *
	 * @param string $message Message content
	 * @param string $hash_key Campaign hash key
	 * @return string Modified message with tracking
	 */
	public static function add_click_tracking($message, $hash_key)
	{
		// Find URLs in the message
		$pattern = '/https?:\/\/[^\s]+/i';

		return preg_replace_callback($pattern, function ($matches) use ($hash_key) {
			$original_url = $matches[0];

			// Create tracking URL
			$tracking_url = add_query_arg([
				'quillcrm' => static::get_tracking_action(),
				'hash_key' => $hash_key,
				'original' => urlencode($original_url)
			], home_url());

			return $tracking_url;
		}, $message);
	}

	/**
	 * Add unsubscribe link to message content
	 * Common unsubscribe link logic for all Twilio services
	 *
	 * @param string $message Message content
	 * @param string $hash_key Campaign hash key
	 * @return string Modified message with unsubscribe link
	 */
	public static function add_unsubscribe_link($message, $hash_key)
	{
		$unsubscribe_url = add_query_arg([
			'quillcrm' => static::get_unsubscribe_action(),
			'hash_key' => $hash_key
		], home_url());

		$unsubscribe_text = apply_filters(
			"quillcrm_" . static::get_campaign_type() . "_unsubscribe_text", 
			"\n\nTo unsubscribe: {$unsubscribe_url}"
		);

		return $message . $unsubscribe_text;
	}

	/**
	 * Handle click tracking
	 * Common click tracking logic for all Twilio services
	 *
	 * @param string $hash_key Campaign hash key
	 * @param string $original_url Original URL to redirect to
	 * @return void
	 */
	protected function handle_click_tracking($hash_key, $original_url = null)
	{
		try {
			$campaign_model_class = $this->get_campaign_model_class();
			$campaign_record = $campaign_model_class::where('hash_key', $hash_key)
				->where('mode', $this->get_campaign_mode())
				->first();

			if (!$campaign_record) {
				quillcrm_get_logger()->warning("{$this->campaign_type} click tracking: Invalid hash key", [
					'hash_key' => $hash_key,
					'code' => "invalid_{$this->campaign_type}_hash_key"
				]);

				if ($original_url) {
					wp_redirect($original_url);
					exit;
				}
				return;
			}

			// Update click tracking
			if (!$campaign_record->clicked) {
				$campaign_record->clicked = 1;
				$campaign_record->clicked_at = current_time('mysql');
				$campaign_record->save();

				quillcrm_get_logger()->info("{$this->campaign_type} click tracked", [
					'campaign_record_id' => $campaign_record->id,
					'contact_id' => $campaign_record->contact_id,
					'source_id' => $campaign_record->source_id,
					'source_type' => $campaign_record->source_type,
					'code' => "{$this->campaign_type}_click_tracked"
				]);

				// Trigger click automation if enabled
				do_action("quillcrm_{$this->campaign_type}_clicked", $campaign_record);
			}

			// Auto-login if enabled
			$contact = $campaign_record->contact;
			if ($contact && $contact->user_id) {
				$auto_login = apply_filters("quillcrm_{$this->campaign_type}_auto_login", true, $campaign_record);
				if ($auto_login) {
					wp_set_auth_cookie($contact->user_id);
				}
			}

			// Redirect to original URL
			if ($original_url) {
				wp_redirect($original_url);
				exit;
			}

		} catch (\Exception $e) {
			quillcrm_get_logger()->error("{$this->campaign_type} click tracking error", [
				'hash_key' => $hash_key,
				'error' => $e->getMessage(),
				'code' => "{$this->campaign_type}_click_error"
			]);

			if ($original_url) {
				wp_redirect($original_url);
				exit;
			}
		}
	}

	/**
	 * Handle unsubscribe request
	 * Common unsubscribe logic for all Twilio services
	 *
	 * @param string $hash_key Campaign hash key
	 * @return void
	 */
	protected function handle_unsubscribe($hash_key)
	{
		try {
			$campaign_model_class = $this->get_campaign_model_class();
			$campaign_record = $campaign_model_class::where('hash_key', $hash_key)
				->where('mode', $this->get_campaign_mode())
				->first();

			if (!$campaign_record) {
				quillcrm_get_logger()->warning("{$this->campaign_type} unsubscribe: Invalid hash key", [
					'hash_key' => $hash_key,
					'code' => "invalid_{$this->campaign_type}_hash_key"
				]);
				return;
			}

			$contact = $campaign_record->contact;
			if ($contact) {
				$contact->status = 'unsubscribed';
				$contact->save();

				quillcrm_get_logger()->info("{$this->campaign_type} unsubscribe processed", [
					'contact_id' => $contact->id,
					'campaign_record_id' => $campaign_record->id,
					'code' => "{$this->campaign_type}_unsubscribe"
				]);

				// Trigger unsubscribe automation
				do_action("quillcrm_{$this->campaign_type}_unsubscribed", $contact, $campaign_record);

				// Redirect to unsubscribe page
				$unsubscribe_page = apply_filters("quillcrm_{$this->campaign_type}_unsubscribe_redirect", home_url());
				wp_redirect($unsubscribe_page);
				exit;
			}

		} catch (\Exception $e) {
			quillcrm_get_logger()->error("{$this->campaign_type} unsubscribe error", [
				'hash_key' => $hash_key,
				'error' => $e->getMessage(),
				'code' => "{$this->campaign_type}_unsubscribe_error"
			]);
		}
	}

	/**
	 * Get tracking action name - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected static function get_tracking_action();

	/**
	 * Get unsubscribe action name - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected static function get_unsubscribe_action();

	/**
	 * Get campaign type - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected static function get_campaign_type();
}