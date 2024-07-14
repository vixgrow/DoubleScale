<?php
/**
 * Class Ontraport API
 *
 * This class is responsible for handling the Ontraport API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Ontraport;

use QuillCRM\Abstracts\Integration_API;
/**
 * Ontraport API class
 */
class API extends Integration_API {

	/**
	 * API Key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $api_key;

	/**
	 * App ID
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $app_id;

	/**
	 * Constructor
	 *
	 * @param string $api_key
	 * @param string $app_id
	 *
	 * @since 1.0.0
	 */
	public function __construct( $api_key, $app_id ) {
		$this->endpoint = 'https://api.ontraport.com/1';
		$this->api_key  = $api_key;
		$this->app_id   = $app_id;
	}

	/**
	 * Get info
	 *
	 * @return array|WP_Error
	 */
	public function get_info() {
		return $this->get( 'Contacts/getInfo' );
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
					'Accept'       => 'application/json',
					'Content-Type' => 'application/json; charset=' . get_option( 'blog_charset' ),
					'Api-Appid'    => $this->app_id,
					'Api-Key'      => $this->api_key,
				),
				'timeout' => 30,
			)
		);
	}
}
