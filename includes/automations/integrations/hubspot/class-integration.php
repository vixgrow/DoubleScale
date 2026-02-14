<?php
/**
 * Class Hubspot
 *
 * This class is responsible for handling the Hubspot integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Hubspot;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Hubspot class
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Hubspot';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'hubspot';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'Hubspot Integration';

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		'remote_data'     => Remote_Data::class,
		'rest_controller' => REST_Controller::class,
	);

	/**
	 * Connect the integration
	 *
	 * @since 1.0.0
	 *
	 * @return bool|API
	 */
	public function connect() {
		if ( $this->api instanceof API ) {
			return $this->api;
		}

		$access_token = $this->get_setting( 'access_token' );

		if ( empty( $access_token ) ) {
			return false;
		}

		$this->api = new API( $access_token );

		return $this->api;
	}

	/**
	 * Validate.
	 *
	 * @param array $settings Settings.
	 *
	 * @return bool
	 */
	public function validate( $settings ) {
		$access_token = $settings['access_token'] ?? '';

		if ( empty( $access_token ) ) {
			return new \WP_Error( 'invalid_settings', __( 'API Key is required.', 'quill-crm' ) );
		}

		$api    = new API( $access_token );
		$result = $api->get_companies();
		if ( $result['success'] ) {
			return true;
		} else {
			return false;
		}
	}
}

Integrations_Manager::instance()->register( new Integration() );
