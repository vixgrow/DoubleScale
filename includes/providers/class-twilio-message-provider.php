<?php
/**
 * Twilio Message Provider
 * Adapter for Twilio integration
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Providers;

use QuillCRM\Abstracts\Abstract_Message_Provider;
use QuillCRM\Models\Contact_Model;

/**
 * Twilio_Message_Provider class
 *
 * Wraps the existing Twilio integration to implement the Message_Provider_Interface.
 * This adapter pattern allows Twilio to work with the new provider system without
 * modifying the existing Twilio integration code.
 *
 * @since 1.0.0
 */
class Twilio_Message_Provider extends Abstract_Message_Provider {

	/**
	 * Provider slug
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $provider_slug = 'twilio';

	/**
	 * Provider name
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $provider_name = 'Twilio';

	/**
	 * Supported channels
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $supported_channels = array( 'sms', 'whatsapp' );

	/**
	 * Twilio API instance (lazy loaded)
	 *
	 * @since 1.0.0
	 *
	 * @var mixed
	 */
	private $api;

	/**
	 * Send message via Twilio (unified method for all channels)
	 *
	 * @since 1.0.0
	 *
	 * @param string        $channel Channel type ('sms', 'whatsapp')
	 * @param array         $data Message data
	 * @param Contact_Model $contact Contact model
	 * @return array Result array
	 */
	public function send_message( string $channel, array $data, Contact_Model $contact ): array {
		try {
			// Validate channel support
			if ( ! $this->supports_channel( $channel ) ) {
				return $this->error_result(
					sprintf( 'Twilio provider does not support channel: %s', $channel )
				);
			}

			// Get Twilio API instance
			$api = $this->get_api();
			if ( ! $api ) {
				return $this->error_result( 'Twilio not configured' );
			}

			// Call appropriate Twilio API method based on channel
			switch ( $channel ) {
				case 'sms':
					$result = $api->send_sms( $data );
					break;

				case 'whatsapp':
					$result = $api->send_whatsapp( $data );
					break;

				default:
					return $this->error_result( sprintf( 'Unknown channel: %s', $channel ) );
			}

			// Map Twilio response to standard format
			return $this->map_twilio_response( $result, $contact, $channel );

		} catch ( \Exception $e ) {
			$this->log(
				'error',
				sprintf( 'Twilio %s send failed', ucfirst( $channel ) ),
				array(
					'channel'    => $channel,
					'error'      => $e->getMessage(),
					'contact_id' => $contact->id,
				)
			);

			return $this->error_result( $e->getMessage() );
		}
	}

	// is_configured() is now inherited from Abstract_Message_Provider
	// It uses $this->get_integration() automatically via provider_slug

	/**
	 * Get webhook URL for Twilio callbacks
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type
	 * @return string|null Webhook URL or null
	 */
	public function get_webhook_url( string $channel): ?string {
		// Get tracking class for the channel
		$tracking_class = $channel === 'sms'
			? \QuillCRM\Tracking\SMS::class
			: \QuillCRM\Tracking\WhatsApp::class;

		// Return webhook URL if tracking class has one
		if ( method_exists( $tracking_class, 'get_webhook_url' ) ) {
			return $tracking_class::get_webhook_url();
		}

		return null;
	}

	/**
	 * Process webhook from Twilio
	 *
	 * @since 1.0.0
	 *
	 * @param string $channel Channel type ('sms', 'whatsapp')
	 * @param array  $webhook_data Raw webhook data from Twilio
	 * @return array Standardized webhook result
	 */
	public function process_webhook( string $channel, array $webhook_data ): array {
		// Validate channel support
		if ( ! $this->supports_channel( $channel ) ) {
			return $this->webhook_error_result( 'Channel not supported' );
		}

		// Verify Twilio webhook signature for security
		if ( ! $this->verify_webhook_signature() ) {
			$this->log(
				'warning',
				sprintf( 'Twilio %s webhook signature verification failed', ucfirst( $channel ) ),
				array(
					'channel'     => $channel,
					'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
				)
			);
			return $this->webhook_error_result( 'Signature verification failed' );
		}

		// Extract Twilio webhook fields
		$message_sid    = $webhook_data['MessageSid'] ?? '';
		$message_status = $webhook_data['MessageStatus'] ?? '';
		$error_code     = $webhook_data['ErrorCode'] ?? null;
		$error_message  = $webhook_data['ErrorMessage'] ?? null;

		// Validate required fields
		if ( empty( $message_sid ) || empty( $message_status ) ) {
			$this->log(
				'warning',
				sprintf( 'Twilio %s webhook missing required data', ucfirst( $channel ) ),
				array(
					'channel'        => $channel,
					'message_sid'    => $message_sid,
					'message_status' => $message_status,
				)
			);
			return $this->webhook_error_result( 'Missing required webhook fields' );
		}

		// Map Twilio status to standard status
		$standard_status = $this->map_twilio_status( $message_status );

		$this->log(
			'debug',
			sprintf( 'Twilio %s webhook processed', ucfirst( $channel ) ),
			array(
				'channel'        => $channel,
				'message_sid'    => $message_sid,
				'message_status' => $message_status,
				'standard_status' => $standard_status,
			)
		);

		// Return standardized webhook result
		return $this->webhook_success_result(
			$message_sid,
			$standard_status,
			$error_code,
			$error_message,
			array(
				'twilio_status' => $message_status,
				'raw_data'      => $webhook_data,
			)
		);
	}

	/**
	 * Verify Twilio webhook signature
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	private function verify_webhook_signature(): bool {
		// Get integration instance using provider slug
		$integration = $this->get_integration();

		if ( ! $integration ) {
			return false;
		}

		$auth_token = $integration->get_setting( 'auth_token' );
		if ( ! $auth_token ) {
			return false;
		}

		// Get webhook URL and signature
		$url       = $_SERVER['REQUEST_URI'] ?? '';
		$signature = $_SERVER['HTTP_X_TWILIO_SIGNATURE'] ?? '';

		if ( ! $signature ) {
			return false;
		}

		// Build data string for validation
		$data = '';
		ksort( $_POST );
		foreach ( $_POST as $key => $value ) {
			$data .= $key . $value;
		}

		// Calculate expected signature
		$full_url = home_url( $url );
		$expected_signature = base64_encode( hash_hmac( 'sha1', $full_url . $data, $auth_token, true ) );

		return hash_equals( $expected_signature, $signature );
	}

	/**
	 * Map Twilio status to standard status
	 *
	 * @since 1.0.0
	 *
	 * @param string $twilio_status Twilio status string
	 * @return string Standard status
	 */
	private function map_twilio_status( string $twilio_status ): string {
		$status_map = array(
			'queued'      => 'pending',
			'sending'     => 'pending',
			'sent'        => 'sent',
			'delivered'   => 'delivered',
			'read'        => 'read',
			'failed'      => 'failed',
			'undelivered' => 'failed',
		);

		return $status_map[ $twilio_status ] ?? 'unknown';
	}

	/**
	 * Get Twilio API instance (lazy loaded)
	 *
	 * @since 1.0.0
	 *
	 * @return mixed|null Twilio API instance or null if not available
	 */
	private function get_api() {
		if ( ! $this->api ) {
			$integration = $this->get_integration();
			$this->api = $integration ? $integration->connect() : null;
		}
		return $this->api;
	}

	/**
	 * Map Twilio response to standard provider response format
	 *
	 * @since 1.0.0
	 *
	 * @param array         $result Twilio API result
	 * @param Contact_Model $contact Contact model
	 * @param string        $channel Channel type
	 * @return array Standardized result
	 */
	private function map_twilio_response( array $result, Contact_Model $contact, string $channel): array {
		// Check if send was successful
		if ( isset( $result['success'] ) && $result['success'] ) {
			// Extract message ID (Twilio's SID)
			$message_id = $result['data']['sid'] ?? '';

			$this->log(
				'debug',
				sprintf( 'Twilio %s sent successfully', ucfirst( $channel ) ),
				array(
					'message_id' => $message_id,
					'contact_id' => $contact->id,
					'channel'    => $channel,
				)
			);

			return $this->success_result(
				$message_id,
				$result['data'] ?? array()
			);
		}

		// Handle failure
		$error = $result['error'] ?? 'Unknown Twilio error';

		$this->log(
			'error',
			sprintf( 'Twilio %s send failed', ucfirst( $channel ) ),
			array(
				'error'      => $error,
				'contact_id' => $contact->id,
				'channel'    => $channel,
				'result'     => $result,
			)
		);

		// Pass Twilio error data in metadata for proper error formatting
		$metadata = array();
		if ( isset( $result['data'] ) ) {
			$metadata['error_details'] = $result['data'];
		}

		return $this->error_result( $error, $metadata );
	}
}
