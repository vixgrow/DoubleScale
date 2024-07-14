<?php
/**
 * Class Drip Remote Data
 *
 * This class is responsible for handling the Drip Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Drip;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * Drip Remote Data class
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
		'accounts',
		'campaigns',
		'tags',
		'fields',
		'workflows',
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
			case 'campaigns':
				$result = $this->fetch_campaigns();
				break;
			case 'accounts':
				$result = $this->fetch_accounts();
				break;
			case 'workflows':
				$result = $this->fetch_workflows();
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
	 * Fetch campaigns.
	 *
	 * @return array
	 */
	public function fetch_campaigns() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_campaigns();

		return $response;
	}

	/**
	 * Fetch accounts.
	 *
	 * @return array
	 */
	public function fetch_accounts() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_accounts();

		return $response;
	}

	/**
	 * Fetch workflows.
	 *
	 * @return array
	 */
	public function fetch_workflows() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_workflows();

		return $response;
	}
}
