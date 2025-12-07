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
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\Tracking\Email as Email_Tracking;
use QuillCRM\Emails\Emails;
use QuillCRM\Emails\Email_Tracking_Helper;
use QuillCRM\Settings;
use QuillCRM\Constants\Campaign_Channel;

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
		return Campaign_Channel::STR_EMAIL;
	}

	/**
	 * Get activity type
	 *
	 * @since 1.0.0
	 *
	 * @return string Activity type
	 */
	protected function get_activity_type() {
		return 'email_sent';
	}

	/**
	 * Get tracking mode
	 *
	 * @since 1.0.0
	 *
	 * @return int Tracking mode constant
	 */
	protected function get_tracking_mode() {
		return Communication_Tracking_Model::MODE_EMAIL;
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
	 * Validate email-specific requirements
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Request object
	 * @return true|WP_Error True if valid, WP_Error if invalid
	 */
	protected function validate_email_requirements( $request ) {
		$subject = $request->get_param( 'subject' );

		if ( empty( $subject ) || ! trim( $subject ) ) {
			return new WP_Error(
				'missing_subject',
				__( 'Subject is required for email messages.', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Send email with subject validation
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request Request object
	 * @return \WP_REST_Response|WP_Error
	 */
	public function send( $request ) {
		// Validate email-specific requirements
		$validation = $this->validate_email_requirements( $request );
		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		// Call parent send logic
		return parent::send( $request );
	}

	/**
	 * Override process_message to add email-specific tracking (pixel + footer)
	 *
	 * @since 1.0.0
	 *
	 * @param string         $message Raw message content
	 * @param Contact_Model  $contact Contact for merge tags
	 * @param Communication_Tracking_Model $tracking_entry Tracking record
	 * @return string Processed message
	 */
	protected function process_message( $message, $contact, $tracking_entry ) {
		// Process merge tags (from parent)
		$processed = parent::process_message( $message, $contact, $tracking_entry );

		// Add tracking pixel only (no footer for individual messages)
		$processed = Email_Tracking_Helper::add_tracking_pixel( $processed, $tracking_entry );

		// Add click tracking
		$processed = Email_Tracking_Helper::add_click_tracking( $processed, $tracking_entry->hash_key, $contact );

		return $processed;
	}


	// COMMENTED OUT: Role-based validation - pending product owner decision
	// /**
	//  * Check if current user is a sales rep
	//  *
	//  * @since 1.0.0
	//  *
	//  * @return bool True if user has sales rep role, false otherwise
	//  */
	// protected function is_sales_rep() {
	// 	$user = wp_get_current_user();
	// 	if ( ! $user || ! $user->ID ) {
	// 		return false;
	// 	}
	//
	// 	return in_array( \QuillCRM\User_Roles\User_Roles::SALES_REP, (array) $user->roles, true );
	// }

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

			// Get admin email from settings
			$admin_email = $email_settings['from_email'] ?? get_option( 'admin_email' );

			// Note: QuillSMTP connection validation removed - now handled as warning in settings
			// Email will attempt to send using WordPress default mail system if no SMTP configured

			// Setup Emails class
			$emails = new Emails();

			// Use global settings for email sending
			$emails->from_name    = $email_settings['from_name'] ?? get_bloginfo( 'name' );
			$emails->from_address = $admin_email;
			$emails->reply_to     = $email_settings['reply_to'] ?? $admin_email;

			// COMMENTED OUT: Role-based sender selection - available for future use
			// $current_user = wp_get_current_user();
			// $user_email = ( $current_user && $current_user->ID && is_email( $current_user->user_email ) )
			// 	? $current_user->user_email
			// 	: null;
			// $is_sales_rep = $this->is_sales_rep();
			//
			// if ( $is_sales_rep && $user_email ) {
			// 	// Sales rep: Use their own email
			// 	$emails->from_name    = $current_user->display_name ?: $current_user->user_login;
			// 	$emails->from_address = $user_email;
			// 	$emails->reply_to     = $user_email;
			// } else {
			// 	// Admin/Manager/Others: Use global settings
			// 	$emails->from_name    = $email_settings['from_name'] ?? get_bloginfo( 'name' );
			// 	$emails->from_address = $admin_email;
			// 	$emails->reply_to     = $email_settings['reply_to'] ?? $admin_email;
			// }

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
}
