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
use QuillCRM\Managers\Integrations_Manager;

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
	 * Send SMS via Twilio
	 *
	 * @since 1.0.0
	 *
	 * @param array         $data Message data
	 * @param Contact_Model $contact Contact model
	 * @return array Result array
	 */
	public function send_sms( array $data, Contact_Model $contact): array {
		try {
			$api = $this->get_api();
			if ( ! $api ) {
				return $this->error_result( 'Twilio not configured' );
			}

			// Call existing Twilio integration
			$result = $api->send_sms( $data );

			// Map Twilio response to standard format
			return $this->map_twilio_response( $result, $contact, 'sms' );

		} catch ( \Exception $e ) {
			$this->log(
				'error',
				'Twilio SMS send failed',
				array(
					'error'      => $e->getMessage(),
					'contact_id' => $contact->id,
					'channel'    => 'sms',
				)
			);

			return $this->error_result( $e->getMessage() );
		}
	}

	/**
	 * Send WhatsApp via Twilio
	 *
	 * @since 1.0.0
	 *
	 * @param array         $data Message data
	 * @param Contact_Model $contact Contact model
	 * @return array Result array
	 */
	public function send_whatsapp( array $data, Contact_Model $contact): array {
		try {
			$api = $this->get_api();
			if ( ! $api ) {
				return $this->error_result( 'Twilio not configured' );
			}

			// Call existing Twilio integration
			$result = $api->send_whatsapp( $data );

			// Map Twilio response to standard format
			return $this->map_twilio_response( $result, $contact, 'whatsapp' );

		} catch ( \Exception $e ) {
			$this->log(
				'error',
				'Twilio WhatsApp send failed',
				array(
					'error'      => $e->getMessage(),
					'contact_id' => $contact->id,
					'channel'    => 'whatsapp',
				)
			);

			return $this->error_result( $e->getMessage() );
		}
	}

	/**
	 * Check if Twilio is configured
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_configured(): bool {
		$twilio = Integrations_Manager::instance()->get_integration( 'twilio' );
		return $twilio && $twilio->is_connected();
	}

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
	 * Get Twilio API instance (lazy loaded)
	 *
	 * @since 1.0.0
	 *
	 * @return mixed|null Twilio API instance or null if not available
	 */
	private function get_api() {
		if ( ! $this->api ) {
			$twilio = Integrations_Manager::instance()->get_integration( 'twilio' );
			$this->api = $twilio ? $twilio->connect() : null;
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

		return $this->error_result( $error, $result );
	}
}
