<?php
/**
 * Abstract Twilio Campaign Controller
 * Base class for all Twilio-based campaign REST controllers (SMS, WhatsApp)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Managers\Integrations_Manager;
use QuillCRM\Abstracts\Abstract_Campaign_Controller;

/**
 * Abstract_Twilio_Campaign_Controller class
 */
abstract class Abstract_Twilio_Campaign_Controller extends Abstract_Campaign_Controller
{
	/**
	 * Get Twilio tracking class - must be implemented by child classes
	 *
	 * @return string Tracking class name
	 */
	abstract protected function get_twilio_tracking_class();

	/**
	 * Prepare test message data - must be implemented by child classes
	 *
	 * @param WP_REST_Request $request Request object
	 * @param mixed $api Twilio API instance
	 * @param Contact_Model $contact Contact for merge tags
	 * @return array Message data for Twilio API
	 */
	abstract protected function prepare_test_message_data($request, $api, $contact);

	/**
	 * Send test message - common logic for all Twilio services
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	protected function send_test_message_common($request)
	{
		try {
			$phone = $request->get_param('phone');
			$message = $request->get_param('message');

			// Get Twilio integration
			$twilio = Integrations_Manager::instance()->get_integration('twilio');
			$api = $twilio->connect();

			if (!$api) {
				return new WP_Error('error', __('Failed to connect to Twilio', 'quillcrm'), array('status' => 500));
			}

			// Find contact for merge tag processing
			$contact = Contact_Model::where('phone', $phone)->first() ?? null;

			// Prepare message data (implemented by child classes)
			$message_data = $this->prepare_test_message_data($request, $api, $contact);

			// Add StatusCallback URL for production environments only
			$message_data = $this->add_status_callback($message_data);

			// Send message using appropriate API method
			$result = $this->send_twilio_message($api, $message_data);

			// Handle result with improved error messages
			return $this->handle_twilio_result($result);

		} catch (\Exception $e) {
			return new WP_Error('error', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Add StatusCallback URL to message data
	 * Common StatusCallback logic for all Twilio services
	 *
	 * @param array $message_data Message data array
	 * @return array Modified message data
	 */
	protected function add_status_callback($message_data)
	{
		$tracking_class = $this->get_twilio_tracking_class();
		$webhook_url = $tracking_class::get_webhook_url();
		$site_url = home_url();

		// Only add StatusCallback for production URLs (not localhost)
		if (!empty($webhook_url) && strpos($site_url, 'localhost') === false && strpos($site_url, '127.0.0.1') === false) {
			$message_data['StatusCallback'] = $webhook_url;
		}

		return $message_data;
	}

	/**
	 * Send message via Twilio API - must be implemented by child classes
	 *
	 * @param mixed $api Twilio API instance
	 * @param array $message_data Message data
	 * @return array API result
	 */
	abstract protected function send_twilio_message($api, $message_data);

	/**
	 * Handle Twilio API result with improved error messages
	 * Common error handling for all Twilio services
	 *
	 * @param array $result Twilio API result
	 * @return WP_REST_Response|WP_Error
	 */
	protected function handle_twilio_result($result)
	{
		if (!$result['success']) {
			$error_details = isset($result['data']) ? $result['data'] : 'No error details';
			$error_message = 'Failed to send test message';
			
			// Provide more specific error messages for common issues
			if (isset($result['data']['code'])) {
				$error_message = $this->get_specific_error_message($result['data']['code'], $result['data']['message'] ?? '');
			} elseif (isset($result['data']['message'])) {
				$error_message = $this->get_message_based_error($result['data']['message']);
			}
			
			return new WP_Error('error', __($error_message, 'quillcrm'), array('status' => 400));
		}

		return new WP_REST_Response(array('message' => $this->get_success_message()), 200);
	}

	/**
	 * Get specific error message based on Twilio error code
	 * Common error codes for all Twilio services
	 *
	 * @param string|int $error_code Twilio error code (can be string or int)
	 * @param string $original_message Original error message
	 * @return string User-friendly error message
	 */
	protected function get_specific_error_message($error_code, $original_message)
	{
		// Normalize error code to integer for consistent comparison
		$error_code = (int) $error_code;

		// Check for service-specific errors FIRST (allows child classes to override)
		$service_specific_error = $this->get_service_specific_error_message($error_code, $original_message);
		if ($service_specific_error) {
			return $service_specific_error;
		}

		// Then check common errors (shared across all services)
		$common_errors = array(
			21211 => 'Invalid "To" phone number format. Please use E.164 format (e.g., +1234567890).',
			21609 => 'Invalid webhook URL. This usually happens in local development environments.',
			21610 => 'Messages to this number are blocked or restricted.',
			21614 => 'Invalid "From" phone number. Please check your Twilio phone number configuration.',
			21408 => 'Permission denied. Your account may not have permissions or the number may be restricted.',
			60200 => 'International messaging permissions required for this destination.',
			// Note: 21612 is service-specific (different for SMS vs WhatsApp) - handled by child classes
			// Note: 63038 is SMS-specific - handled by SMS controller
		);

		if (isset($common_errors[$error_code])) {
			return $common_errors[$error_code];
		}

		// Default to generic error with details
		return 'Failed to send test message: ' . ($original_message ?: 'Unknown error (code: ' . $error_code . ')');
	}

	/**
	 * Get service-specific error message - can be overridden by child classes
	 * IMPORTANT: This is called BEFORE common errors, allowing child classes to override
	 *
	 * @param int $error_code Twilio error code (normalized to integer)
	 * @param string $original_message Original error message
	 * @return string|false Service-specific error message or false if not handled
	 */
	protected function get_service_specific_error_message($error_code, $original_message)
	{
		return false;
	}

	/**
	 * Get error message based on message content
	 * Common message-based error handling
	 *
	 * @param string $api_message API error message
	 * @return string User-friendly error message
	 */
	protected function get_message_based_error($api_message)
	{
		// Common patterns across SMS and WhatsApp
		if (strpos($api_message, "'To' and 'From' number cannot be the same") !== false) {
			return 'Cannot send message to the same number as the sender. Please use a different phone number.';
		}

		return 'Failed to send test message: ' . $api_message;
	}

	/**
	 * Get success message - can be overridden by child classes
	 *
	 * @return string Success message
	 */
	protected function get_success_message()
	{
		return 'Test message sent successfully';
	}

	/**
	 * Process merge tags in message content
	 * Common merge tag processing for all Twilio services
	 *
	 * @param string $message Message content
	 * @param Contact_Model $contact Contact for merge tags (can be null)
	 * @return string Processed message
	 */
	protected function process_merge_tags($message, $contact)
	{
		return Merge_Tags_Manager::instance()->process_merge_tags($message, $contact);
	}
}