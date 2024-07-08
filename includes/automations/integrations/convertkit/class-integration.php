<?php
/**
 * Class Convertkit
 *
 * This class is responsible for handling the Convertkit integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Convertkit;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Convertkit class
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Convertkit';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'convertkit';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'Convertkit Integration';

	/**
	 * Option name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $option_name = 'convertkit';

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
	 * Constructor
	 */
	public function __construct() {
		parent::__construct();
	}

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

		$api_secret = $this->get_setting( 'api_secret' );

		if ( empty( $api_secret ) ) {
			return false;
		}

		$this->api = new API( $api_secret );

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
		$api_secret = $settings['api_secret'] ?? '';

		if ( empty( $api_secret ) ) {
			return new \WP_Error( 'invalid_settings', __( 'API Key is required.', 'quillcrm' ) );
		}

		$api    = new API( $api_secret );
		$result = $api->get_account();
		if ( $result['success'] ) {
			return true;
		} else {
			return false;
		}
	}
}

Integrations_Manager::instance()->register( new Integration() );
