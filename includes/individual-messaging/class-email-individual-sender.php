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
use WP_REST_Request;
use WP_REST_Response;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Models\Message_Model;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Emails\Emails;
use QuillCRM\Emails\Email_Tracking_Helper;
use QuillCRM\Settings;

/**
 * Email_Individual_Sender class
 *
 * Handles individual email sending with tracking, merge tags, and click tracking.
 * Unlike SMS/WhatsApp, email doesn't use the Message_Provider_Interface pattern.
 *
 * @since 1.0.0
 */
class Email_Individual_Sender {

	/**
	 * Send individual email to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public function send( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$to         = $request->get_param( 'to' );
			$subject    = $request->get_param( 'subject' );
			$body       = $request->get_param( 'body' );

			// Validate contact exists
			$contact = Contact_Model::find( $contact_id );
			if ( ! $contact ) {
				return new WP_Error( 'not_found', __( 'Contact not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Validate recipient email address
			if ( ! filter_var( $to, FILTER_VALIDATE_EMAIL ) ) {
				return new WP_Error(
					'invalid_email',
					__( 'Invalid email address', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			// Create tracking entry FIRST (for open/click tracking)
			$tracking_entry = Tracking_Model::create(
				array(
					'contact_id'  => $contact->id,
					'template_id' => 0, // No template for individual emails
					'hash_key'    => wp_generate_password( 32, false ),
					'mode'        => Tracking_Model::MODE_EMAIL,
					'source_type' => Message_Source_Types::INDIVIDUAL,
					'source_id'   => 0, // No campaign/automation
					'author_id'   => get_current_user_id(),
					'recipient'   => $to,
					'status'      => Tracking_Status::PENDING,
				)
			);

			// Process merge tags
			$processed_subject = Merge_Tags_Manager::instance()->process_merge_tags( $subject, $contact );
			$processed_body    = Merge_Tags_Manager::instance()->process_merge_tags( $body, $contact );

			// Add tracking pixel only
			$processed_body = Email_Tracking_Helper::add_tracking_pixel( $processed_body, $tracking_entry );

			// Add click tracking to all links
			$processed_body = Email_Tracking_Helper::add_click_tracking( $processed_body, $tracking_entry->hash_key, $contact );

			// Create message record (store content for audit trail)
			$message_record = Message_Model::create(
				array(
					'tracking_id' => $tracking_entry->id,
					'subject'     => $processed_subject,
					'body'        => $processed_body,
				)
			);

			// Get global email settings
			$email_settings = Settings::get( 'email', array() );

			// Send email using Emails class
			$emails               = new Emails();
			$emails->from_name    = $email_settings['from_name'] ?? get_bloginfo( 'name' );
			$emails->from_address = $email_settings['from_email'] ?? get_option( 'admin_email' );
			$emails->reply_to     = $email_settings['reply_to'] ?? get_option( 'admin_email' );

			// Remove competing filters
			$this->remove_wp_mail_filters();

			// Send the email
			$result = $emails->send( $to, $processed_subject, $processed_body );

			// Validate email send result
			if ( is_wp_error( $result ) ) {
				throw new \Exception( 'WP Mail Error: ' . $result->get_error_message() );
			} elseif ( $result === false || $result === null ) {
				throw new \Exception( 'Email sending failed - wp_mail returned false' );
			}

			// Update tracking status - email sent successfully
			$tracking_entry->update(
				array(
					'status'  => Tracking_Status::SENT,
					'sent_at' => current_time( 'mysql' ),
				)
			);

			quillcrm_get_logger()->info(
				__( 'Individual email sent successfully', 'quillcrm' ),
				array(
					'contact_id'  => $contact->id,
					'tracking_id' => $tracking_entry->id,
					'message_id'  => $message_record->id,
					'author_id'   => get_current_user_id(),
					'recipient'   => $to,
					'subject'     => $processed_subject,
				)
			);

			return new WP_REST_Response(
				array(
					'success'     => true,
					'message'     => __( 'Email sent successfully', 'quillcrm' ),
					'tracking_id' => $tracking_entry->id,
					'message_id'  => $message_record->id,
				),
				200
			);

		} catch ( \Exception $e ) {
			// Update tracking status to failed
			if ( isset( $tracking_entry ) ) {
				$tracking_entry->update( array( 'status' => Tracking_Status::FAILED ) );
			}

			quillcrm_get_logger()->error(
				__( 'Individual email send exception', 'quillcrm' ),
				array(
					'error'       => $e->getMessage(),
					'contact_id'  => $contact_id ?? null,
					'tracking_id' => $tracking_entry->id ?? null,
					'message_id'  => $message_record->id ?? null,
				)
			);

			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
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
