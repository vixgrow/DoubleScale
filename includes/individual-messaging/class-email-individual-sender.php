<?php
/**
 * Email Individual Message Sender
 * Handles sending individual email messages to contacts
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Individual_Messaging;

use WP_Error;
use QuillCRM\Abstracts\Abstract_Individual_Message_Sender;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Tracking\Email as Email_Tracking;
use QuillCRM\Emails\Emails;
use QuillCRM\Emails\Email_Tracking_Helper;
use QuillCRM\Settings;

/**
 * Email_Individual_Sender class
 *
 * Concrete implementation for email individual message sending.
 * Extends abstract base class with email-specific validation and sending logic.
 *
 * @since 1.0.0
 */
class Email_Individual_Sender extends Abstract_Individual_Message_Sender {

	/**
	 * Get channel type
	 *
	 * @since 1.0.0
	 *
	 * @return string Channel type
	 */
	protected function get_channel_type() {
		return 'email';
	}

	/**
	 * Get tracking mode
	 *
	 * @since 1.0.0
	 *
	 * @return int Tracking mode constant
	 */
	protected function get_tracking_mode() {
		return Tracking_Model::MODE_EMAIL;
	}

	/**
	 * Get tracking class
	 *
	 * @since 1.0.0
	 *
	 * @return string Tracking class name
	 */
	protected function get_tracking_class() {
		return Email_Tracking::class;
	}

	/**
	 * Validate recipient email address
	 *
	 * @since 1.0.0
	 *
	 * @param string $recipient Email address to validate
	 * @return true|WP_Error True if valid, WP_Error if invalid
	 */
	protected function validate_recipient( $recipient ) {
		if ( ! filter_var( $recipient, FILTER_VALIDATE_EMAIL ) ) {
			return new WP_Error(
				'invalid_email',
				__( 'Invalid email address', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Override process_message to add email-specific tracking (pixel + footer)
	 *
	 * @since 1.0.0
	 *
	 * @param string         $message Raw message content
	 * @param Contact_Model  $contact Contact for merge tags
	 * @param Tracking_Model $tracking_entry Tracking record
	 * @return string Processed message
	 */
	protected function process_message( $message, $contact, $tracking_entry ) {
		// Process merge tags (from parent)
		$processed = parent::process_message( $message, $contact, $tracking_entry );

		// Add footer and tracking pixel (for individual emails)
		$processed = Email_Tracking_Helper::add_footer_and_tracking( $processed, $tracking_entry, $contact );

		// Add click tracking
		$processed = Email_Tracking_Helper::add_click_tracking( $processed, $tracking_entry->hash_key, $contact );

		return $processed;
	}

	/**
	 * Override send_via_provider to use WordPress email system
	 *
	 * Email uses wp_mail directly rather than the Message_Provider_Interface pattern
	 * used by SMS/WhatsApp. This is because email sending is handled by WordPress core
	 * and various SMTP plugins, while SMS/WhatsApp require third-party API providers.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed          $provider Not used for email (null)
	 * @param string         $to Recipient email address
	 * @param string         $body Processed message body
	 * @param string|null    $subject Processed subject
	 * @param Contact_Model  $contact Contact model
	 * @return array Provider result
	 */
	protected function send_via_provider( $provider, $to, $body, $subject, $contact ) {
		try {
			// Get global email settings
			$email_settings = Settings::get( 'email', array() );

			// Setup Emails class
			$emails               = new Emails();
			$emails->from_name    = $email_settings['from_name'] ?? get_bloginfo( 'name' );
			$emails->from_address = $email_settings['from_email'] ?? get_option( 'admin_email' );
			$emails->reply_to     = $email_settings['reply_to'] ?? get_option( 'admin_email' );

			// Remove competing filters
			$this->remove_wp_mail_filters();

			// Send the email
			$result = $emails->send( $to, $subject, $body );

			// Validate email send result
			if ( is_wp_error( $result ) ) {
				return array(
					'success' => false,
					'error'   => 'WP Mail Error: ' . $result->get_error_message(),
				);
			} elseif ( $result === false || $result === null ) {
				return array(
					'success' => false,
					'error'   => 'Email sending failed - wp_mail returned false',
				);
			}

			return array(
				'success'    => true,
				'message_id' => $result,
			);

		} catch ( \Exception $e ) {
			return array(
				'success' => false,
				'error'   => $e->getMessage(),
			);
		}
	}

	/**
	 * Remove competing wp_mail filters
	 * Allows custom from_email/from_name to work properly
	 *
	 * @since 1.0.0
	 */
	protected function remove_wp_mail_filters() {
		// Only remove if not multiple SMTP connections
		$quillsmtp_settings = get_option( 'quillsmtp_settings', array() );
		$connections        = $quillsmtp_settings['connections'] ?? array();

		if ( count( $connections ) <= 1 ) {
			remove_all_filters( 'wp_mail_from' );
			remove_all_filters( 'wp_mail_from_name' );
		}
	}
}
