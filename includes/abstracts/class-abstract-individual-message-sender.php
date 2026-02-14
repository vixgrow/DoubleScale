<?php
/**
 * Abstract Individual Message Sender
 * Base class for individual message sending (SMS, WhatsApp, Email)
 *
 * REFACTORED: Activity is now the PRIMARY record, tracking is supplementary
 * Activities are created FIRST, then tracking links to them via source_id (polymorphic FK)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\Models\Communication_Tracking_Meta_Model;
use QuillCRM\Models\Activity_Model;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Constants\Message_Direction;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Managers\Message_Provider_Registry;

/**
 * Abstract_Individual_Message_Sender class
 *
 * Provides common functionality for sending individual messages across all channels.
 * Child classes only need to implement channel-specific logic.
 *
 * @since 1.0.0
 */
abstract class Abstract_Individual_Message_Sender {

	/**
	 * Get channel type (sms, whatsapp, email) - must be implemented by child classes
	 *
	 * @since 1.0.0
	 *
	 * @return string Channel type
	 */
	abstract protected function get_channel_type();

	/**
	 * Get activity type - must be implemented by child classes
	 *
	 * @since 1.0.0
	 *
	 * @return string Activity type (email_sent, sms_sent, whatsapp_sent)
	 */
	abstract protected function get_activity_type();

	/**
	 * Get tracking mode constant - must be implemented by child classes
	 *
	 * @since 1.0.0
	 *
	 * @return int Tracking mode constant
	 */
	abstract protected function get_tracking_mode();

	/**
	 * Get tracking class - must be implemented by child classes
	 *
	 * @since 1.0.0
	 *
	 * @return string Tracking class name
	 */
	abstract protected function get_tracking_class();

	/**
	 * Validate recipient - must be implemented by child classes
	 *
	 * @since 1.0.0
	 *
	 * @param string $recipient Recipient (email or phone)
	 * @return true|WP_Error True if valid, WP_Error if invalid
	 */
	abstract protected function validate_recipient( $recipient );

	/**
	 * Send individual message (common logic for all channels)
	 *
	 * NEW FLOW:
	 * 1. Create Activity (primary record) FIRST
	 * 2. Create Tracking (supplementary data) linked to activity
	 * 3. Process and send message
	 * 4. Update records with results
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
			$body       = $request->get_param( 'body' ) ?? $request->get_param( 'message' ); // Support both 'body' and 'message'
			$subject    = $request->get_param( 'subject' ) ?? null; // Email-only (null for SMS/WhatsApp)
			$deal_id    = $request->get_param( 'deal_id' ) ?? null; // Context-aware: set if sent from deal modal
			$channel    = $this->get_channel_type();

			// Validate contact exists
			$contact = Contact_Model::find( $contact_id );
			if ( ! $contact ) {
				return new WP_Error( 'not_found', __( 'Contact not found', 'quill-crm' ), array( 'status' => 404 ) );
			}

			// Validate recipient (channel-specific)
			$validation = $this->validate_recipient( $to );
			if ( is_wp_error( $validation ) ) {
				return $validation;
			}

			// Get provider for channel (email uses wp_mail, SMS/WhatsApp use providers)
			$provider = null;
			if ( $channel !== 'email' ) {
				$provider = Message_Provider_Registry::instance()->get_provider( $channel );
				if ( ! $provider ) {
					return new WP_Error(
						'provider_not_configured',
						sprintf(
							/* translators: %s: channel name (SMS, WhatsApp, etc.) */
							__( '%s provider not configured. Please configure a provider in settings.', 'quill-crm' ),
							ucfirst( $channel )
						),
						array( 'status' => 500 )
					);
				}
			}

			// STEP 1: Process merge tags FIRST (before creating activity)
			// Individual messages store PROCESSED content in activity (unlike campaigns which store templates)
			// This is because activity is a 1:1 record for this specific contact - no need for tracking_meta
			$processed_subject = $subject ? Merge_Tags_Manager::instance()->process_merge_tags( $subject, $contact ) : null;
			$processed_body    = Merge_Tags_Manager::instance()->process_merge_tags( $body, $contact );

			// STEP 2: Create ACTIVITY with processed content (display-ready, NO tracking elements)
			$activity = $this->create_activity( $contact, $to, $processed_subject, $processed_body );

			// STEP 3: Add deal to activity if it exists
			if ( $deal_id ) {
				$this->add_deal_to_activity( $activity, $deal_id );
			}

			// STEP 4: Create TRACKING record (supplementary data, links to activity)
			$tracking_entry = $this->create_tracking_entry( $contact, $to, $activity->id );

			// STEP 5: Add tracking elements for SENDING ONLY (pixel, click tracking)
			// These are NEVER stored in activity - only used for the sent message
			$sendable_body = $this->add_tracking_elements( $processed_body, $contact, $tracking_entry );

			// Send message via provider (with tracking elements)
			$result = $this->send_via_provider( $provider, $to, $sendable_body, $processed_subject, $contact );

			// Handle result
			return $this->handle_result( $result, $tracking_entry, $activity, $provider, $contact, $to );

		} catch ( \Exception $e ) {
			return $this->handle_error( $e, $tracking_entry ?? null, $activity ?? null, $contact_id ?? null );
		}
	}

	/**
	 * Create activity record (primary record)
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact    Contact model
	 * @param string        $recipient  Recipient (email or phone)
	 * @param string|null   $subject    Subject (email only)
	 * @param string        $body       Message body
	 * @param int|null      $deal_id    Deal ID (context-aware: set if sent from deal modal)
	 * @return Activity_Model
	 */
	protected function create_activity( $contact, $recipient, $subject, $body, $deal_id = null ) {
		return Activity_Model::create(
			array(
				'contact_id'    => $contact->id,
				// 'deal_id'       => $deal_id, // SET if sent from deal modal, NULL if from contact details
				'activity_type' => $this->get_activity_type(),
				'data'          => array(
					'subject' => $subject,
					'body'    => $body,
					'to'      => $recipient,
				),
				'user_id'       => get_current_user_id(),
			)
		);
	}

	protected function add_deal_to_activity( $activity, $deal_id ) {
		// in activity association table, add the deal_id to the activity
		\QuillCRM\Models\Activity_Association_Model::create(
			array(
				'activity_id' => $activity->id,
				'entity_type' => \QuillCRM\Models\Activity_Association_Model::ENTITY_TYPE_DEAL,
				'entity_id'   => $deal_id,
				'created_at'  => current_time( 'mysql' ),
				'updated_at'  => current_time( 'mysql' ),
			)
		);
	}

	/**
	 * Create tracking entry (supplementary data, links to activity via source_id)
	 *
	 * For individual messages, source_id points to the activity (polymorphic FK).
	 * This is semantically consistent: the activity IS the source of the message.
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact     Contact model
	 * @param string        $recipient   Recipient (email or phone)
	 * @param int           $activity_id Activity ID to link to
	 * @return Communication_Tracking_Model
	 */
	protected function create_tracking_entry( $contact, $recipient, $activity_id ) {
		return Communication_Tracking_Model::create(
			array(
				'contact_id'  => $contact->id,
				'template_id' => null, // No template for individual messages
				'hash_key'    => \QuillCRM\Utils::generate_hash_key(),
				'mode'        => $this->get_tracking_mode(),
				'direction'   => Message_Direction::OUTBOUND,
				'source_type' => Message_Source_Types::INDIVIDUAL,
				'source_id'   => $activity_id, // Points to activity (polymorphic FK)
				'author_id'   => get_current_user_id(), // Track who sent it
				'recipient'   => $recipient,
				'status'      => Tracking_Status::PENDING,
			)
		);
	}

	/**
	 * Add tracking elements to message for sending
	 *
	 * Adds click tracking URLs (and pixel for email via override).
	 * These elements are for sending ONLY - never stored in activity.
	 *
	 * @since 1.0.0
	 *
	 * @param string                        $message        Processed message (merge tags already resolved)
	 * @param Contact_Model                 $contact        Contact model
	 * @param Communication_Tracking_Model  $tracking_entry Tracking record
	 * @return string Message with tracking elements added
	 */
	protected function add_tracking_elements( $message, $contact, $tracking_entry ) {
		// Add click tracking
		$tracking_class = $this->get_tracking_class();
		if ( class_exists( $tracking_class ) && method_exists( $tracking_class, 'add_click_tracking' ) ) {
			$message = $tracking_class::add_click_tracking( $message, $tracking_entry->hash_key );
		}

		return $message;
	}

	/**
	 * Send via provider
	 *
	 * @since 1.0.0
	 *
	 * @param \QuillCRM\Interfaces\Message_Provider_Interface $provider Provider instance
	 * @param string                                          $to       Recipient
	 * @param string                                          $body     Processed message body
	 * @param string|null                                     $subject  Processed subject (email only)
	 * @param Contact_Model                                   $contact  Contact model
	 * @return array Provider result
	 */
	protected function send_via_provider( $provider, $to, $body, $subject, $contact ) {
		$channel = $this->get_channel_type();

		$message_data = array(
			'To'   => $to,
			'Body' => $body,
		);

		// Add subject for email channel
		if ( $subject && $channel === 'email' ) {
			$message_data['Subject'] = $subject;
		}

		// Add webhook URL for delivery status tracking
		$webhook_url = $provider->get_webhook_url( $channel );
		if ( $webhook_url ) {
			$message_data['StatusCallback'] = $webhook_url;
		}

		return $provider->send_message( $channel, $message_data, $contact );
	}

	/**
	 * Handle success result
	 *
	 * @since 1.0.0
	 *
	 * @param array                                           $result         Provider result
	 * @param Communication_Tracking_Model                                  $tracking_entry Tracking record
	 * @param Activity_Model                                  $activity       Activity record
	 * @param \QuillCRM\Interfaces\Message_Provider_Interface $provider       Provider instance
	 * @param Contact_Model                                   $contact        Contact model
	 * @param string                                          $to             Recipient
	 * @return WP_REST_Response|WP_Error
	 */
	protected function handle_result( $result, $tracking_entry, $activity, $provider, $contact, $to ) {
		// Validate send result
		if ( ! isset( $result['success'] ) || ! $result['success'] ) {
			$error_message = $result['error'] ?? sprintf( '%s sending failed', ucfirst( $this->get_channel_type() ) );
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not direct output.
			throw new \Exception( $error_message );
		}

		// Update tracking status - message sent successfully
		$tracking_entry->update(
			array(
				'status'      => Tracking_Status::SENT,
				'sent_at'     => current_time( 'mysql' ),
				'external_id' => $result['message_id'] ?? null, // Store provider message ID
			)
		);

		// Log success
		quillcrm_get_logger()->info(
			sprintf(
				/* translators: %s: channel name (SMS, WhatsApp, etc.) */
				__( 'Individual %s sent successfully', 'quill-crm' ),
				ucfirst( $this->get_channel_type() )
			),
			array(
				'contact_id'  => $contact->id,
				'activity_id' => $activity->id,
				'tracking_id' => $tracking_entry->id,
				'author_id'   => get_current_user_id(),
				'recipient'   => $to,
				'channel'     => $this->get_channel_type(),
				'provider'    => $provider ? $provider->get_provider_name() : 'wp_mail',
				'external_id' => $result['message_id'] ?? null,
			)
		);

		return new WP_REST_Response(
			array(
				'success'     => true,
				'message'     => sprintf(
					/* translators: %s: channel name (SMS, WhatsApp, etc.) */
					__( '%s sent successfully', 'quill-crm' ),
					ucfirst( $this->get_channel_type() )
				),
				'activity_id' => $activity->id,
				'tracking_id' => $tracking_entry->id,
			),
			200
		);
	}

	/**
	 * Handle error
	 *
	 * @since 1.0.0
	 *
	 * @param \Exception          $e              Exception that occurred
	 * @param Communication_Tracking_Model|null $tracking_entry Tracking record (if created)
	 * @param Activity_Model|null $activity       Activity record (if created)
	 * @param int|null            $contact_id     Contact ID (if available)
	 * @return WP_Error
	 */
	protected function handle_error( $e, $tracking_entry, $activity, $contact_id ) {
		// Update tracking status to failed
		if ( $tracking_entry ) {
			$tracking_entry->update( array( 'status' => Tracking_Status::FAILED ) );

			// Store error information in meta table for display in message details
			$error_message = $e->getMessage();
			$error_code    = $e->getCode() ? (string) $e->getCode() : 'send_error';

			Communication_Tracking_Meta_Model::store_error_info(
				$tracking_entry->id,
				$error_code,
				$error_message
			);
		}

		quillcrm_get_logger()->error(
			sprintf(
				/* translators: %s: channel name (SMS, WhatsApp, etc.) */
				__( 'Individual %s send exception', 'quill-crm' ),
				ucfirst( $this->get_channel_type() )
			),
			array(
				'error'       => $e->getMessage(),
				'contact_id'  => $contact_id,
				'channel'     => $this->get_channel_type(),
				'activity_id' => $activity->id ?? null,
				'tracking_id' => $tracking_entry->id ?? null,
			)
		);

		return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
	}
}
