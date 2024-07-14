<?php
/**
 * Class Keap
 *
 * This class is responsible for handling the Keap integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Keap;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Keap class
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Keap';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'keap';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'Keap Integration';

	/**
	 * Option name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $option_name = 'keap';

	/**
	 * App
	 *
	 * @var App
	 */
	public $app;

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

		$this->app = new App( $this );
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

		$tokens        = $this->get_setting( 'credentials', array() );
		$access_token  = $tokens['access_token'] ?? '';
		$refresh_token = $tokens['refresh_token'] ?? '';
		if ( empty( $access_token ) || empty( $refresh_token ) ) {
			return false;
		}

		$this->api = new API( $access_token, $refresh_token, $this->app );

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
		$client_id = $settings['client_id'] ?? '';
		$secret    = $settings['client_secret'] ?? '';

		if ( empty( $client_id ) ) {
			return new \WP_Error( 'invalid_settings', __( 'API Key is required.', 'quillcrm' ) );
		}

		if ( empty( $secret ) ) {
			return new \WP_Error( 'invalid_settings', __( 'API Secret is required.', 'quillcrm' ) );
		}

		return true;
	}
}

Integrations_Manager::instance()->register( new Integration() );
