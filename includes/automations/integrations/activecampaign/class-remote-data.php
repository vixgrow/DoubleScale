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
}
