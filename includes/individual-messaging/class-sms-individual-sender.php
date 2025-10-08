<?php
/**
 * SMS Individual Message Sender
 * Handles sending individual SMS messages to contacts
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Individual_Messaging;

use WP_Error;
use QuillCRM\Abstracts\Abstract_Individual_Message_Sender;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Tracking\SMS;

/**
 * SMS_Individual_Sender class
 *
 * Concrete implementation for SMS individual message sending.
 * Extends abstract base class with SMS-specific validation and configuration.
 *
 * @since 1.0.0
 */
class SMS_Individual_Sender extends Abstract_Individual_Message_Sender {

	/**
	 * Get channel type
	 *
	 * @since 1.0.0
	 *
	 * @return string Channel type
	 */
	protected function get_channel_type() {
		return 'sms';
	}

	/**
	 * Get tracking mode
	 *
	 * @since 1.0.0
	 *
	 * @return int Tracking mode constant
	 */
	protected function get_tracking_mode() {
		return Tracking_Model::MODE_SMS;
	}

	/**
	 * Get tracking class
	 *
	 * @since 1.0.0
	 *
	 * @return string Tracking class name
	 */
	protected function get_tracking_class() {
		return SMS::class;
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
		// Basic phone number validation
		if ( empty( $recipient ) || strlen( $recipient ) < 10 ) {
			return new WP_Error(
				'invalid_phone',
				__( 'Invalid phone number. Use E.164 format: +1234567890', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}
}

