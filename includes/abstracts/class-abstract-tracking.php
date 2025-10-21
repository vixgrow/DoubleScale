<?php
/**
 * Abstract Tracking
 * Base class for tracking functionality across all communication types (SMS, WhatsApp, Email)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Utils;
use QuillCRM\Managers\Message_Provider_Registry;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Campaign_Channel;

defined('ABSPATH') || exit;

/**
 * Abstract_Tracking Class
 */
abstract class Abstract_Tracking
{
	/**
	 * Instance storage for child classes
	 *
	 * @var array
	 */
	private static $instances = array();

	/**
	 * Communication channel (sms, whatsapp, email)
	 *
	 * @var string
	 */
	protected $channel;

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
	 * Register standard provider hooks (common for SMS and WhatsApp)
	 * Should be called from add_hooks() in child classes
	 *
	 * @return void
	 */
	protected function register_standard_hooks()
	{
		$type = $this->channel;

		// Webhook handlers
		add_action("wp_ajax_nopriv_quillcrm_{$type}_webhook", [$this, 'handle_webhook']);
		add_action("wp_ajax_quillcrm_{$type}_webhook", [$this, 'handle_webhook']);

		// Click tracking - use generic method instead of dynamic method names
		add_action('template_redirect', [$this, 'handle_click_tracking_request'], 1);
	}

	/**
	 * Handle standard tracking requests (common logic)
	 *
	 * @return void
	 */
	protected function handle_standard_tracking()
	{
		if (!isset($_GET['quillcrm']) || !isset($_GET['hash_key'])) {
			return;
		}

		$action = sanitize_text_field($_GET['quillcrm']);
		$hash_key = sanitize_text_field($_GET['hash_key']);
		$type = $this->channel;

		switch ($action) {
			case "{$type}_click":
				$this->handle_click_tracking($hash_key);
				break;
			case "{$type}_unsubscribe":
				$this->handle_unsubscribe($hash_key);
				break;
		}
	}

	/**
	 * Process provider webhook (common logic for SMS and WhatsApp)
	 *
	 * @return void
	 */
	protected function process_provider_webhook()
	{
		// Get provider for this channel
		$provider = Message_Provider_Registry::instance()->get_provider($this->channel);

		if (!$provider) {
			quillcrm_get_logger()->error(ucfirst($this->channel) . ' webhook: no provider configured', [
				'code' => "{$this->channel}_webhook_no_provider",
				'channel' => $this->channel
			]);
			wp_die('Service Unavailable', 'Service Unavailable', 503);
		}

		// Process webhook through provider (handles signature verification and parsing)
		$webhook_result = $provider->process_webhook($this->channel, $_POST);

		// Check if webhook is valid
		if (!isset($webhook_result['valid']) || !$webhook_result['valid']) {
			$error = $webhook_result['error_message'] ?? 'Invalid webhook';
			quillcrm_get_logger()->warning(ucfirst($this->channel) . ' webhook validation failed', [
				'code' => "{$this->channel}_webhook_validation_failed",
				'error' => $error,
				'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
			]);
			wp_die('Bad Request', 'Bad Request', 400);
		}

		// Extract standardized webhook data
		$message_id = $webhook_result['message_id'] ?? '';
		$status = $webhook_result['status'] ?? '';
		$error_code = $webhook_result['error_code'] ?? '';
		$error_message = $webhook_result['error_message'] ?? '';

		if (empty($message_id) || empty($status)) {
			quillcrm_get_logger()->warning(ucfirst($this->channel) . ' webhook missing required fields', [
				'message_id' => $message_id,
				'status' => $status,
				'code' => "{$this->channel}_webhook_missing_data"
			]);
			wp_die('Bad Request', 'Bad Request', 400);
		}

		// Find tracking record by provider's message ID
		$campaign_model_class = $this->get_campaign_model_class();
		$tracking_record = $campaign_model_class::where('external_id', $message_id)
			->where('mode', $this->get_campaign_mode())
			->first();

		if (!$tracking_record) {
			quillcrm_get_logger()->warning(ucfirst($this->channel) . ' webhook: tracking record not found', [
				'message_id' => $message_id,
				'status' => $status,
				'code' => "{$this->channel}_webhook_tracking_not_found"
			]);
			wp_die('OK'); // Acknowledge but don't process
		}

		// Update tracking record status based on webhook data
		$this->update_delivery_status($tracking_record, $status, $error_code, $error_message);

		wp_die('OK'); // Acknowledge successful processing
	}

	/**
	 * Update delivery status for tracking record
	 * Centralized status update logic with campaign-type-specific handling
	 *
	 * @param object $tracking_record Tracking record
	 * @param string $status Delivery status from Twilio
	 * @param string $error_code Error code if any
	 * @param string $error_message Error message if any
	 * @return void
	 */
	protected function update_delivery_status($tracking_record, $status, $error_code = '', $error_message = '')
	{
		$previous_status = $tracking_record->status;

		// Handle status updates
		switch ($status) {
			case 'sent':
				$tracking_record->status = Tracking_Status::SENT;
				$tracking_record->sent_at = current_time('mysql');
				break;
			case 'delivered':
				$tracking_record->status = Tracking_Status::DELIVERED;
				break;
			case 'read':
				// WhatsApp-specific status (not yet defined in constants, using delivered for now)
				if ($this->channel === Campaign_Channel::CHANNEL_WHATSAPP) {
					$tracking_record->status = Tracking_Status::DELIVERED;
				}
				break;
			case 'failed':
			case 'undelivered':
				$tracking_record->status = Tracking_Status::FAILED;
				break;
		}

		$tracking_record->save();

		// Log status update
		// quillcrm_get_logger()->info(ucfirst($this->campaign_type) . ' delivery status updated', [
		// 	'tracking_record_id' => $tracking_record->id,
		// 	'previous_status' => $previous_status,
		// 	'new_status' => $status,
		// 	'contact_id' => $tracking_record->contact_id,
		// 	'source_id' => $tracking_record->source_id,
		// 	'source_type' => $tracking_record->source_type,
		// 	'error_code' => $error_code,
		// 	'error_message' => $error_message,
		// 	'code' => "{$this->campaign_type}_delivery_status_updated"
		// ]);

		// Trigger delivery status hooks
		do_action("quillcrm_{$this->channel}_delivery_status_updated", $tracking_record, $status, $previous_status);
	}

	/**
	 * Handle click tracking request from template_redirect hook
	 * Centralized method that checks for channel type and processes click tracking
	 *
	 * @return void
	 */
	public function handle_click_tracking_request()
	{
		$expected_action = "{$this->channel}_click";
		
		if (!isset($_GET['quillcrm']) || $_GET['quillcrm'] !== $expected_action) {
			return;
		}

		if (!isset($_GET['hash_key']) || !isset($_GET['original'])) {
			return;
		}

		$hash_key = sanitize_text_field($_GET['hash_key']);
		$original_url = urldecode($_GET['original']);

		$this->handle_click_tracking($hash_key, $original_url);
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
			"quillcrm_" . static::get_channel_type() . "_unsubscribe_text",
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
				quillcrm_get_logger()->warning("{$this->channel} click tracking: Invalid hash key", [
					'hash_key' => $hash_key,
					'code' => "invalid_{$this->channel}_hash_key"
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

				// quillcrm_get_logger()->info("{$this->channel} click tracked", [
				// 	'campaign_record_id' => $campaign_record->id,
				// 	'contact_id' => $campaign_record->contact_id,
				// 	'source_id' => $campaign_record->source_id,
				// 	'source_type' => $campaign_record->source_type,
				// 	'code' => "{$this->channel}_click_tracked"
				// ]);

			// Trigger click automation if enabled
			do_action("quillcrm_{$this->channel}_clicked", $campaign_record);
		}

		// Redirect to original URL
			if ($original_url) {
				wp_redirect($original_url);
				exit;
			}

		} catch (\Exception $e) {
			quillcrm_get_logger()->error("{$this->channel} click tracking error", [
				'hash_key' => $hash_key,
				'error' => $e->getMessage(),
				'code' => "{$this->channel}_click_error"
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
				quillcrm_get_logger()->warning("{$this->channel} unsubscribe: Invalid hash key", [
					'hash_key' => $hash_key,
					'code' => "invalid_{$this->channel}_hash_key"
				]);
				return;
			}

			$contact = $campaign_record->contact;
			if ($contact) {
				$contact->status = 'unsubscribed';
				$contact->save();

				// quillcrm_get_logger()->info("{$this->channel} unsubscribe processed", [
				// 	'contact_id' => $contact->id,
				// 	'campaign_record_id' => $campaign_record->id,
				// 	'code' => "{$this->channel}_unsubscribe"
				// ]);

				// Trigger unsubscribe automation
				do_action("quillcrm_{$this->channel}_unsubscribed", $contact, $campaign_record);

				// Redirect to unsubscribe page
				$unsubscribe_page = apply_filters("quillcrm_{$this->channel}_unsubscribe_redirect", home_url());
				wp_redirect($unsubscribe_page);
				exit;
			}

		} catch (\Exception $e) {
			quillcrm_get_logger()->error("{$this->channel} unsubscribe error", [
				'hash_key' => $hash_key,
				'error' => $e->getMessage(),
				'code' => "{$this->channel}_unsubscribe_error"
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
	 * Get channel type - must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected static function get_channel_type();
}