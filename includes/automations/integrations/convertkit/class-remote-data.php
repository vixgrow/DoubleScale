<?php
/**
 * Class Convertkit Remote Data
 *
 * This class is responsible for handling the Convertkit Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Convertkit;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * Convertkit Remote Data class
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
		'tags',
		'sequences',
		'fields',
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
			case 'fields':
				$result = $this->fetch_fields();
				break;
			case 'tags':
				$result = $this->fetch_tags();
				break;
			case 'sequences':
				$result = $this->fetch_sequences();
				break;
		}

		return $result;
	}

	/**
	 * Fetch fields.
	 *
	 * @return array
	 */
	public function fetch_fields() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_fields();

		return $response;
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
		$response = $api->get_tags();

		return $response;
	}

	/**
	 * Fetch sequences.
	 *
	 * @return array
	 */
	public function fetch_sequences() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_sequences();

		return $response;
	}
}
