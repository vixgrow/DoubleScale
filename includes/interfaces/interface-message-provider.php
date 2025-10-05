<?php
/**
 * Message Provider Interface
 * Defines contract for all messaging providers (SMS, WhatsApp, etc.)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Interfaces;

use QuillCRM\Models\Contact_Model;

/**
 * Message_Provider_Interface
 *
 * Contract that all message providers must implement to ensure consistent
 * behavior across different messaging services (Twilio, Vonage, AWS SNS, etc.)
 *
 * @since 1.0.0
 */
interface Message_Provider_Interface {

	/**
	 * Send message via specified channel
	 *
	 * Unified method for sending messages across all channels (SMS, WhatsApp, Voice, etc.)
	 * This replaces channel-specific methods (send_sms, send_whatsapp) with a single
	 * flexible interface that supports any messaging channel.
	 *
	 * @since 1.0.0
	 *
	 * @param string        $channel Channel type ('sms', 'whatsapp', 'voice', etc.)
	 * @param array         $data Message data including 'Body', 'To', and optional 'StatusCallback'
	 * @param Contact_Model $contact Contact model for context
	 * @return array Result array with keys:
	 *               - 'success' (bool): Whether send was successful
	 *               - 'message_id' (string|null): Provider's message ID (e.g., Twilio SID)
	 *               - 'error' (string|null): Error message if failed
	 *               - 'metadata' (array): Additional provider-specific data
	 */
	public function send_message( string $channel, array $data, Contact_Model $contact ): array;

	/**
	 * Get provider slug
	 *
	 * @since 1.0.0
	 *
	 * @return string Provider identifier (e.g., 'twilio', 'vonage', 'aws_sns')
	 */
	public function get_provider_slug(): string;

	/**
	 * Check if provider is configured
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if provider has valid credentials and is ready to send messages
	 */
	public function is_configured(): bool;

	/**
	 * Check if provider supports a specific channel
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type ('sms', 'whatsapp', 'voice', etc.)
	 * @return bool True if provider supports the channel
	 */
	public function supports_channel( string $channel): bool;

	/**
	 * Get webhook URL for status callbacks
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type ('sms', 'whatsapp')
	 * @return string|null Webhook URL for this provider/channel, or null if not supported
	 */
	public function get_webhook_url( string $channel): ?string;

	/**
	 * Get provider name for display
	 *
	 * @since 1.0.0
	 *
	 * @return string Human-readable provider name (e.g., 'Twilio', 'Vonage SMS')
	 */
	public function get_provider_name(): string;
}
