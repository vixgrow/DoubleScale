<?php
/**
 * Class Hubspot Remote Data
 *
 * This class is responsible for handling the Hubspot Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Hubspot;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * Hubspot Remote Data class
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
		'lists'  => array(
			'callback' => 'fetch_lists',
		),
		'fields' => array(
			'callback' => 'fetch_fields',
		),
	);

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

		if ( ! $response['success'] ) {
			return $result;
		}

		foreach ( $response['data']['lists'] as $list ) {
			$result[] = array(
				'id'    => $list['listId'],
				'label' => $list['name'],
			);
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
		$result   = array();

		if ( ! $response['success'] ) {
			return $result;
		}

		foreach ( $response['data'] as $field ) {
			$result[] = array(
				'label' => $field['label'],
				'value' => $field['name'],
			);
		}

		return $result;
	}
}
