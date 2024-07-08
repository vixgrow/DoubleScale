<?php
/**
 * Class ActiveCampaign
 *
 * This class is responsible for handling the ActiveCampaign integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\ActiveCampaign;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * ActiveCampaign class
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'ActiveCampaign';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'activecampaign';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'ActiveCampaign Integration';

	/**
	 * Option name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $option_name = 'activecampaign';

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

		$api_url = $this->get_setting( 'api_url' );
		$api_key = $this->get_setting( 'api_key' );

		if ( empty( $api_url ) || empty( $api_key ) ) {
			return false;
		}

		$this->api = new API( $api_url, $api_key );

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
		$api_url = $settings['api_url'] ?? '';
		$api_key = $settings['api_key'] ?? '';

		if ( empty( $api_url ) ) {
			return new \WP_Error( 'invalid_settings', __( 'API URL is required.', 'quillcrm' ) );
		}

		if ( empty( $api_key ) ) {
			return new \WP_Error( 'invalid_settings', __( 'API Key is required.', 'quillcrm' ) );
		}

		$this->endpoint = $api_url;
		$this->api_key  = $api_key;

		$api    = new API( $api_url, $api_key );
		$result = $api->get( 'users/me' );
		if ( $result['success'] ) {
			return true;
		} else {
			return false;
		}
	}
}

Integrations_Manager::instance()->register( new Integration() );
