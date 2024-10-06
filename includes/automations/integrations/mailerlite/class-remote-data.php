<?php
/**
 * Class MailerLite Remote Data
 *
 * This class is responsible for handling the MailerLite Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\MailerLite;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * MailerLite Remote Data class
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
		'groups' => array(
			'callback' => 'fetch_groups',
		),
	);

	/**
	 * Fetch groups.
	 *
	 * @return array
	 */
	public function fetch_groups() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_groups();
		$result   = array();

		if ( ! empty( $response ) ) {
			foreach ( $response['data'] as $group ) {
				$result[] = array(
					'value' => $group['id'],
					'label' => $group['name'],
				);
			}
		}

		return $result;
	}
}
