<?php
/**
 * Class Twilio API
 *
 * This class is responsible for handling the Twilio API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Twilio;

use QuillCRM\Abstracts\Integration_API;
/**
 * Twilio API class
 */
class API extends Integration_API {

	/**
	 * Account SID
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $account_sid;

	/**
	 * API Key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $auth_token;

	/**
	 * Phone number
	 *
	 * @var string
	 */
	public $phone_number;

	/**
	 * Constructor
	 *
	 * @param string $account_sid
	 * @param string $auth_token
	 * @param string $phone_number
	 *
	 * @since 1.0.0
	 */
	public function __construct( $account_sid, $auth_token, $phone_number ) {
		$this->endpoint     = 'https://api.twilio.com/2010-04-01';
		$this->account_sid  = $account_sid;
		$this->auth_token   = $auth_token;
		$this->phone_number = $phone_number;
	}

	/**
	 * Get accounts
	 *
	 * @return array|WP_Error
	 */
	public function get_accounts() {
		return $this->get( 'Accounts.json' );
	}

	/**
	 * Send SMS
	 *
	 * @param array $data
	 *
	 * @return array|WP_Error
	 */
	public function send_sms( $data ) {
		if ( empty( $this->phone_number ) ) {
			return array(
				'success' => false,
				'error'   => __( 'Twilio phone number not configured. Please add your Twilio phone number in Settings > Integrations > Twilio.', 'quillcrm' ),
			);
		}

		$data['From'] = $this->phone_number;
		return $this->post( 'Accounts/' . $this->account_sid . '/Messages.json', $data );
	}

	/**
	 * Send WhatsApp message
	 *
	 * @param array $data
	 *
	 * @return array|WP_Error
	 */
	public function send_whatsapp( $data ) {
		if ( empty( $this->phone_number ) ) {
			return array(
				'success' => false,
				'error'   => __( 'Twilio phone number not configured. Please add your Twilio phone number in Settings > Integrations > Twilio.', 'quillcrm' ),
			);
		}

		// WhatsApp messages require "whatsapp:" prefix
		$data['From'] = 'whatsapp:' . $this->phone_number;

		// Ensure To number has whatsapp: prefix if not already present
		if ( strpos( $data['To'], 'whatsapp:' ) !== 0 ) {
			$data['To'] = 'whatsapp:' . $data['To'];
		}

		return $this->post( 'Accounts/' . $this->account_sid . '/Messages.json', $data );
	}


	/**
	 * Send POST request to the api.
	 *
	 * @param string     $path Path.
	 * @param array|null $body Body.
	 * @return array
	 */
	public function post( $path, $body = array() ) {
		return $this->request( 'POST', $path, $body ? http_build_query( $body ) : null );
	}

	/**
	 * Send request to the api.
	 *
	 * @param string      $method Method.
	 * @param string      $path URL.
	 * @param string|null $body Body.
	 * @return array|WP_Error
	 */
	public function request_remote( $method, $path, $body = null ) {
		return wp_remote_request(
			"{$this->endpoint}/$path",
			array(
				'method'  => $method,
				'body'    => $body,
				'headers' => array(
					'Accept'        => 'application/json',
					'Content-Type'  => 'application/x-www-form-urlencoded',
					'Cache-Control' => 'no-cache',
					'Authorization' => 'Basic ' . base64_encode( $this->account_sid . ':' . $this->auth_token ),
				),
				'timeout' => 30,
			)
		);
	}
}
