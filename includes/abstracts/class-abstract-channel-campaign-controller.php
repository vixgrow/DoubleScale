<?php
/**
 * Abstract Channel Campaign Controller
 * Base class for channel-specific campaign controllers (SMS, WhatsApp)
 *
 * Provides common functionality for campaigns that send via message providers.
 * Email campaigns extend Abstract_Campaign_Controller directly.
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Message_Provider_Registry;
use QuillCRM\Abstracts\Abstract_Campaign_Controller;

/**
 * Abstract_Channel_Campaign_Controller class
 */
abstract class Abstract_Channel_Campaign_Controller extends Abstract_Campaign_Controller
{
	/**
	 * Get channel type (sms, whatsapp) - must be implemented by child classes
	 *
	 * @return string Channel type
	 */
	abstract protected function get_channel_type();

	/**
	 * Prepare test message data - must be implemented by child classes
	 *
	 * @param WP_REST_Request $request Request object
	 * @param Contact_Model $contact Contact for merge tags
	 * @return array Message data for provider
	 */
	abstract protected function prepare_test_message_data($request, $contact);

	/**
	 * Send test message via provider system
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	protected function send_test_message_common($request)
	{
		try {
			$phone = $request->get_param('phone');
			$message = $request->get_param('message');

			// Get channel type from child class
			$channel = $this->get_channel_type();

			// Get provider for this channel from registry
			$provider = Message_Provider_Registry::instance()->get_provider($channel);

			if (!$provider) {
				return new WP_Error(
					'provider_not_available',
					sprintf(__('No provider configured for %s channel', 'quillcrm'), $channel),
					array('status' => 500)
				);
			}

			// Find contact for merge tag processing
			$contact = Contact_Model::where('phone', $phone)->first() ?? null;

			// Prepare message data (implemented by child classes)
			$message_data = $this->prepare_test_message_data($request, $contact);

			// Send message using provider
			$result = $provider->send_message($channel, $message_data, $contact ?? new Contact_Model());

			// Handle result
			return $this->handle_provider_result($result, $provider);

		} catch (\Exception $e) {
			return new WP_Error('error', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Handle provider result
	 *
	 * @param array $result Provider result
	 * @param \QuillCRM\Interfaces\Message_Provider_Interface $provider Provider instance
	 * @return WP_REST_Response|WP_Error
	 */
	protected function handle_provider_result($result, $provider)
	{
		if (!isset($result['success']) || !$result['success']) {
			$error_message = $result['error'] ?? 'Failed to send test message';

			// Check if provider has error details in metadata
			if (isset($result['metadata']['error_details'])) {
				$error_message = $this->format_provider_error($result['metadata']['error_details']);
			}

			return new WP_Error('error', __($error_message, 'quillcrm'), array('status' => 400));
		}

		return new WP_REST_Response(array('message' => $this->get_success_message()), 200);
	}

	/**
	 * Format provider-specific error for user-friendly display
	 *
	 * @param mixed $error_details Provider error details
	 * @return string Formatted error message
	 */
	protected function format_provider_error($error_details)
	{
		if (is_string($error_details)) {
			return $error_details;
		}

		if (is_array($error_details) && isset($error_details['message'])) {
			return $error_details['message'];
		}

		return 'Failed to send test message';
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

	// process_merge_tags() is now inherited from Abstract_Campaign_Controller
	// All campaign types (Email, SMS, WhatsApp) can use the same method
}
