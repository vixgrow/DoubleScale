<?php
/**
 * Class Klaviyo Remote Data
 *
 * This class is responsible for handling the Klaviyo Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Klaviyo;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * Klaviyo Remote Data class
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
		'lists' => array(
			'callback' => 'fetch_lists',
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

		foreach ( $response['data']['data'] as $list ) {
			$result[] = array(
				'label' => $list['attributes']['name'],
				'value' => $list['id'],
			);
		}

		return $result;
	}
}
