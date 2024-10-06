<?php
/**
 * Class ActiveCampaign API
 *
 * This class is responsible for handling the ActiveCampaign API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\ActiveCampaign;

use QuillCRM\Abstracts\Integration_API;
/**
 * ActiveCampaign API class
 */
class API extends Integration_API {

	/**
	 * API URL
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $api_url;

	/**
	 * API Key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $api_key;

	/**
	 * Constructor
	 *
	 * @param string $api_url
	 * @param string $api_key
	 *
	 * @since 1.0.0
	 */
	public function __construct( $api_url, $api_key ) {
		$this->endpoint = $api_url . '/api/3';
		$this->api_key  = $api_key;
	}

	/**
	 * Add contact
	 *
	 * @param array $data Data.
	 *
	 * @return array
	 */
	public function create_or_update( $data ) {
		return $this->post( 'contact/sync', $data );
	}

	/**
	 * Get contact
	 *
	 * @param string $email Email.
	 *
	 * @return array
	 */
	public function get_contact( $email ) {
		return $this->get( 'contacts?filters[email]=' . urlencode( $email ) );
	}

	/**
	 * Add contact tag
	 *
	 * @param array $data Data.
	 *
	 * @return array
	 */
	public function add_contact_tag( $data ) {
		return $this->post( 'contactTags', $data );
	}

	/**
	 * Remove contact tag
	 *
	 * @param array $data Data.
	 *
	 * @return array
	 */
	public function remove_contact_tag( $data ) {
		return $this->delete( 'contactTags', $data );
	}

	/**
	 * Sync contact list
	 *
	 * @param array $data Data.
	 *
	 * @return array
	 */
	public function sync_contact_list( $data ) {
		return $this->post( 'contactLists', $data );
	}

	/**
	 * Add contact to automation
	 *
	 * @param array $data Data.
	 *
	 * @return array
	 */
	public function add_contact_to_automation( $data ) {
		return $this->post( 'contactAutomations', $data );
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return $this->get( 'fields' );
	}

	/**
	 * Get lists
	 *
	 * @return array
	 */
	public function get_lists() {
		return $this->get( 'lists' );
	}

	/**
	 * Get tags
	 *
	 * @return array
	 */
	public function get_tags() {
		return $this->get( 'tags' );
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
					'Content-Type'  => 'application/json; charset=' . get_option( 'blog_charset' ),
					'Cache-Control' => 'no-cache',
					'Api-Token'     => $this->api_key,
				),
				'timeout' => 30,
			)
		);
	}
}
