<?php
/**
 * Class Keap Remote Data
 *
 * This class is responsible for handling the Keap Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Keap;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * Keap Remote Data class
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
		'tags'   => array(
			'callback' => 'fetch_tags',
		),
		'fields' => array(
			'callback' => 'fetch_fields',
		),
	);

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

		foreach ( $response['data'] as $tag ) {
			$result[] = array(
				'label' => $tag['name'],
				'value' => $tag['id'],
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

		foreach ( $response['data']['custom_fields'] as $field ) {
			$result[] = array(
				'label' => $field['label'],
				'value' => $field['id'],
			);
		}

		return $result;
	}
}
