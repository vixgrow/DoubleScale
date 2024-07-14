<?php
/**
 * Class Hubspot API
 *
 * This class is responsible for handling the Hubspot API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Hubspot;

use QuillCRM\Abstracts\Integration_API;
/**
 * Hubspot API class
 */
class API extends Integration_API {

	/**
	 * Access token
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $access_token;

	/**
	 * Constructor
	 *
	 * @param string $access_token
	 *
	 * @since 1.0.0
	 */
	public function __construct( $access_token ) {
		$this->endpoint     = 'https://api.hubapi.com';
		$this->access_token = $access_token;
	}

	/**
	 * Get companies
	 *
	 * @return array|WP_Error
	 */
	public function get_companies() {
		return $this->get( 'crm/v3/objects/companies' );
	}

	/**
	 * Create contact
	 *
	 * @param array $data
	 *
	 * @return array|WP_Error
	 */
	public function create_contact( $data ) {
		return $this->post( 'crm/v3/objects/contacts', $data );
	}

	/**
	 * Get contact by email
	 *
	 * @param string $email
	 *
	 * @return array|WP_Error
	 */
	public function get_contact_by_email( $email ) {
		$body = array(
			'filterGroups' => array(
				array(
					'filters' => array(
						array(
							'propertyName' => 'email',
							'operator'     => 'EQ',
							'value'        => $email,
						),
					),
				),
			),
			'sorts'        => array(
				'vid',
			),
			'query'        => $email,
			'properties'   => array(
				'vid',
			),
			'limit'        => 1,
			'after'        => 0,
		);

		$contacts = $this->post( 'crm/v3/objects/contacts/search', $body );

		if ( $contacts['success'] && ! empty( $contacts['data'] ) ) {
			return $this->prepare_response( true, 200, $contacts['data']['results'][0] );
		}

		return $this->prepare_response( false, 404, array() );
	}

	/**
	 * Get or create contact
	 *
	 * @param array $data
	 *
	 * @return array|WP_Error
	 */
	public function get_or_create_contact( $data ) {
		$email   = $data['properties']['email'];
		$contact = $this->get_contact_by_email( $email );

		if ( $contact['success'] ) {
			return $contact;
		}

		return $this->create_contact( $data );
	}

	/**
	 * Create or update contact
	 *
	 * @param array $data
	 *
	 * @return array|WP_Error
	 */
	public function create_or_update_contact( $data ) {
		$email   = $data['properties']['email'];
		$contact = $this->get_contact_by_email( $email );

		if ( $contact['success'] ) {
			$contact_id = $contact['data']['id'];
			return $this->update_contact( $contact_id, $data );
		}

		return $this->create_contact( $data );
	}

	/**
	 * Update contact
	 *
	 * @param int   $contact_id
	 * @param array $data
	 *
	 * @return array|WP_Error
	 */
	public function update_contact( $contact_id, $data ) {
		return $this->patch( "crm/v3/objects/contacts/$contact_id", $data );
	}


	/**
	 * Get fields
	 *
	 * @return array|WP_Error
	 */
	public function get_fields() {
		return $this->get( 'crm/v3/properties/contacts' );
	}

	/**
	 * Get lists
	 *
	 * @return array|WP_Error
	 */
	public function get_lists() {
		return $this->get( 'contacts/v1/lists' );
	}

	/**
	 * Add contact to list
	 *
	 * @param int $contact_id
	 * @param int $list_id
	 *
	 * @return array|WP_Error
	 */
	public function add_contact_to_list( $contact_id, $list_id ) {
		$body = array(
			'vids' => array( $contact_id ),
		);

		return $this->post( "contacts/v1/lists/$list_id/add", $body );
	}

	/**
	 * Remove contact from list
	 *
	 * @param int $contact_id
	 * @param int $list_id
	 *
	 * @return array|WP_Error
	 */
	public function remove_contact_from_list( $contact_id, $list_id ) {
		$body = array(
			'vids' => array( $contact_id ),
		);

		return $this->post( "contacts/v1/lists/$list_id/remove", $body );
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
					'Authorization' => 'Bearer ' . $this->access_token,
				),
				'timeout' => 30,
			)
		);
	}
}
