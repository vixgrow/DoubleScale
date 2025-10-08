<?php
/**
 * Abstract Individual Message Sender
 * Base class for individual message sending (SMS, WhatsApp, Email)
 *
 * Follows the same architectural pattern as Abstract_Messaging_Campaign_Controller
 * for consistency across the codebase.
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Message_Source_Types;
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
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public function send( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$to         = $request->get_param( 'to' );
			$message    = $request->get_param( 'message' );
			$channel    = $this->get_channel_type();

			// Validate contact exists
			$contact = Contact_Model::find( $contact_id );
			if ( ! $contact ) {
				return new WP_Error( 'not_found', __( 'Contact not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Validate recipient (channel-specific)
			$validation = $this->validate_recipient( $to );
			if ( is_wp_error( $validation ) ) {
				return $validation;
			}

			// Get provider for channel
			$provider = Message_Provider_Registry::instance()->get_provider( $channel );
			if ( ! $provider ) {
				return new WP_Error(
					'provider_not_configured',
					sprintf(
						/* translators: %s: channel name (SMS, WhatsApp, etc.) */
						__( '%s provider not configured. Please configure a provider in settings.', 'quillcrm' ),
						ucfirst( $channel )
					),
					array( 'status' => 500 )
				);
			}

			// Create tracking entry
			$tracking_entry = $this->create_tracking_entry( $contact, $to );

			// Process message (merge tags + click tracking)
			$processed_message = $this->process_message( $message, $contact, $tracking_entry );

			// Send message via provider
			$result = $this->send_via_provider( $provider, $to, $processed_message, $contact );

			// Handle result
			return $this->handle_result( $result, $tracking_entry, $provider, $contact, $to );

		} catch ( \Exception $e ) {
			return $this->handle_error( $e, $tracking_entry ?? null, $contact_id ?? null );
		}
	}

	/**
	 * Create tracking entry
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact Contact model
	 * @param string        $recipient Recipient (email or phone)
	 * @return Tracking_Model
	 */
	protected function create_tracking_entry( $contact, $recipient ) {
		return Tracking_Model::create(
			array(
				'contact_id'  => $contact->id,
				'template_id' => 0, // No template for individual messages
				'hash_key'    => wp_generate_password( 32, false ),
				'mode'        => $this->get_tracking_mode(),
				'source_type' => Message_Source_Types::INDIVIDUAL,
				'source_id'   => 0, // No campaign/automation
				'author_id'   => get_current_user_id(), // Track who sent it
				'recipient'   => $recipient,
				'status'      => Tracking_Status::PENDING,
			)
		);
	}

	/**
	 * Process message (merge tags + click tracking)
	 *
	 * @since 1.0.0
	 *
	 * @param string         $message Raw message content
	 * @param Contact_Model  $contact Contact for merge tags
	 * @param Tracking_Model $tracking_entry Tracking record
	 * @return string Processed message
	 */
	protected function process_message( $message, $contact, $tracking_entry ) {
		// Process merge tags
		$processed = Merge_Tags_Manager::instance()->process_merge_tags( $message, $contact );

		// Add click tracking
		$tracking_class = $this->get_tracking_class();
		if ( class_exists( $tracking_class ) && method_exists( $tracking_class, 'add_click_tracking' ) ) {
			$processed = $tracking_class::add_click_tracking( $processed, $tracking_entry->hash_key );
		}

		return $processed;
	}

	/**
	 * Send via provider
	 *
	 * @since 1.0.0
	 *
	 * @param \QuillCRM\Interfaces\Message_Provider_Interface $provider Provider instance
	 * @param string                                          $to Recipient
	 * @param string                                          $message Processed message
	 * @param Contact_Model                                   $contact Contact model
	 * @return array Provider result
	 */
	protected function send_via_provider( $provider, $to, $message, $contact ) {
		$channel = $this->get_channel_type();

		$message_data = array(
			'To'   => $to,
			'Body' => $message,
		);

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
	 * @param array                                           $result Provider result
	 * @param Tracking_Model                                  $tracking_entry Tracking record
	 * @param \QuillCRM\Interfaces\Message_Provider_Interface $provider Provider instance
	 * @param Contact_Model                                   $contact Contact model
	 * @param string                                          $to Recipient
	 * @return WP_REST_Response|WP_Error
	 */
	protected function handle_result( $result, $tracking_entry, $provider, $contact, $to ) {
		// Validate send result
		if ( ! isset( $result['success'] ) || ! $result['success'] ) {
			$error_message = $result['error'] ?? sprintf( '%s sending failed', ucfirst( $this->get_channel_type() ) );
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
				__( 'Individual %s sent successfully', 'quillcrm' ),
				ucfirst( $this->get_channel_type() )
			),
			array(
				'contact_id'  => $contact->id,
				'tracking_id' => $tracking_entry->id,
				'author_id'   => get_current_user_id(),
				'recipient'   => $to,
				'channel'     => $this->get_channel_type(),
				'provider'    => $provider->get_provider_name(),
				'external_id' => $result['message_id'] ?? null,
			)
		);

		return new WP_REST_Response(
			array(
				'success'     => true,
				'message'     => sprintf(
					/* translators: %s: channel name (SMS, WhatsApp, etc.) */
					__( '%s sent successfully', 'quillcrm' ),
					ucfirst( $this->get_channel_type() )
				),
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
	 * @param \Exception          $e Exception that occurred
	 * @param Tracking_Model|null $tracking_entry Tracking record (if created)
	 * @param int|null            $contact_id Contact ID (if available)
	 * @return WP_Error
	 */
	protected function handle_error( $e, $tracking_entry, $contact_id ) {
		// Update tracking status to failed
		if ( $tracking_entry ) {
			$tracking_entry->update( array( 'status' => Tracking_Status::FAILED ) );
		}

		quillcrm_get_logger()->error(
			sprintf(
				/* translators: %s: channel name (SMS, WhatsApp, etc.) */
				__( 'Individual %s send exception', 'quillcrm' ),
				ucfirst( $this->get_channel_type() )
			),
			array(
				'error'      => $e->getMessage(),
				'contact_id' => $contact_id,
				'channel'    => $this->get_channel_type(),
			)
		);

		return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
	}
}

