<?php
/**
 * Class ActiveCampaign Remote Data
 *
 * This class is responsible for handling the ActiveCampaign Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\ActiveCampaign;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * ActiveCampaign Remote Data class
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
		'tags'   => array(
			'callback' => 'fetch_tags',
		),
		'fields' => array(
			'callback' => 'fetch_fields',
		),
	);

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

		foreach ( $response['data']['fields'] ?? array() as $field ) {
			$result[] = array(
				'label' => $field['name'],
				'value' => $field['id'],
			);
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

		if ( ! $response['success'] ) {
			return $result;
		}

		foreach ( $response['data']['lists'] ?? array() as $list ) {
			$result[] = array(
				'label' => $list['name'],
				'value' => $list['id'],
			);
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
		$response = $api->get_tags();
		$result   = array();

		if ( ! $response['success'] ) {
			return $result;
		}

		foreach ( $response['data']['tags'] ?? array() as $tag ) {
			$result[] = array(
				'label' => $tag['tag'],
				'value' => $tag['id'],
			);
		}

		return $result;
	}
}
