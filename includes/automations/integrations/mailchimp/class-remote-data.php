<?php
/**
 * Class Mailchimp Remote Data
 *
 * This class is responsible for handling the Mailchimp Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Mailchimp;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * Mailchimp Remote Data class
 */
class Remote_Data extends Integration_Remote_Data {

	/**
	 * Entities.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $entities = array(
		'lists',
		'tags',
	);

	/**
	 * Get remote data
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request.
	 * @param string          $entity Entity.
	 * @param int             $entity_id Entity ID.
	 * @return array|WP_Error
	 */
	public function fetch( $request, $entity, $entity_id ) {
		$result = array();

		switch ( $entity ) {
			case 'lists':
				$result = $this->fetch_lists();
				break;
			case 'tags':
				$result = $this->fetch_tags();
				break;
		}

		return $result;
	}

	/**
	 * Fetch lists.
	 *
	 * @return array
	 */
	public function fetch_lists() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_lists();
		$result   = array();

		if ( ! empty( $response ) ) {
			foreach ( $response['data']['lists'] ?? array() as $list ) {
				$result[] = array(
					'id'   => $list['id'],
					'name' => $list['name'],
				);
			}
		}

		return $result;
	}

	/**
	 * Fetch tags.
	 *
	 * @return array
	 */
	public function fetch_tags() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_tags( $this->integration->get_setting( 'list_id' ) );

		return $response;
	}
}
