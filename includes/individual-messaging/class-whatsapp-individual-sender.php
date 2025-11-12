<?php
/**
 * WhatsApp Individual Message Sender
 * Handles sending individual WhatsApp messages to contacts
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Individual_Messaging;

use WP_Error;
use QuillCRM\Abstracts\Abstract_Individual_Message_Sender;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Tracking\WhatsApp;
use QuillCRM\Constants\Campaign_Channel;
use QuillCRM\Utils\Phone_Validator;

/**
 * WhatsApp_Individual_Sender class
 *
 * Concrete implementation for WhatsApp individual message sending.
 * Extends abstract base class with WhatsApp-specific validation and configuration.
 *
 * @since 1.0.0
 */
class WhatsApp_Individual_Sender extends Abstract_Individual_Message_Sender {

	/**
	 * Get channel type
	 *
	 * @since 1.0.0
	 *
	 * @return string Channel type
	 */
	protected function get_channel_type() {
		return Campaign_Channel::CHANNEL_WHATSAPP;
	}

	/**
	 * Get tracking mode
	 *
	 * @since 1.0.0
	 *
	 * @return int Tracking mode constant
	 */
	protected function get_tracking_mode() {
		return Tracking_Model::MODE_WHATSAPP;
	}

	/**
	 * Get tracking class
	 *
	 * @since 1.0.0
	 *
	 * @return string Tracking class name
	 */
	protected function get_tracking_class() {
		return WhatsApp::class;
	}

	/**
	 * Validate recipient phone number
	 *
	 * @since 1.0.0
	 *
	 * @param string $recipient Phone number to validate
	 * @return true|WP_Error True if valid, WP_Error if invalid
	 */
	protected function validate_recipient( $recipient ) {
		// Validate using centralized utility
		$validation = Phone_Validator::validate( $recipient, 'individual_whatsapp' );

		if ( ! $validation['valid'] ) {
			return new WP_Error(
				'invalid_phone',
				$validation['error'],
				array( 'status' => 400 )
			);
		}

		return true;
	}
}

