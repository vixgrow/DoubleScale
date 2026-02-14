<?php
/**
 * Class Drip
 *
 * This class is responsible for handling the Drip integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Drip;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Drip class
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Drip';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'drip';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'Drip Integration';

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

		$api_token  = $this->get_setting( 'api_token' );
		$account_id = $this->get_setting( 'account_id' );

		if ( empty( $api_token ) ) {
			return false;
		}

		$this->api = new API( $api_token, $account_id );

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
		$api_token = $settings['api_token'] ?? '';

		if ( empty( $api_token ) ) {
			return new \WP_Error( 'invalid_settings', __( 'API Key is required.', 'quill-crm' ) );
		}

		$api    = new API( $api_token, '' );
		$result = $api->get_accounts();
		if ( $result['success'] ) {
			return true;
		} else {
			return false;
		}
	}
}

Integrations_Manager::instance()->register( new Integration() );
