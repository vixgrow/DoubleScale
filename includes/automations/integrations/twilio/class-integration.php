<?php
/**
 * Class Twilio
 *
 * This class is responsible for handling the Twilio integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Twilio;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Twilio class
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Twilio';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'twilio';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'Twilio Integration';

	/**
	 * Option name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $option_name = 'twilio';

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

		$account_sid  = $this->get_setting( 'account_sid' );
		$auth_token   = $this->get_setting( 'auth_token' );
		$phone_number = $this->get_setting( 'phone_number' );

		if ( empty( $account_sid ) || empty( $auth_token ) || empty( $phone_number ) ) {
			return false;
		}

		$this->api = new API( $account_sid, $auth_token, $phone_number );

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
		$account_sid  = $settings['account_sid'] ?? '';
		$auth_token   = $settings['auth_token'] ?? '';
		$phone_number = $settings['phone_number'] ?? '';

		if ( empty( $account_sid ) ) {
			return new \WP_Error( 'invalid_settings', __( 'Account SID is required.', 'quillcrm' ) );
		}

		if ( empty( $auth_token ) ) {
			return new \WP_Error( 'invalid_settings', __( 'Auth Token is required.', 'quillcrm' ) );
		}

		if ( empty( $phone_number ) ) {
			return new \WP_Error( 'invalid_settings', __( 'Phone Number is required.', 'quillcrm' ) );
		}

		$api    = new API( $account_sid, $auth_token, $phone_number );
		$result = $api->get_accounts();
		error_log( wp_json_encode( $result ) );
		if ( $result['success'] ) {
			return true;
		} else {
			return false;
		}
	}
}

Integrations_Manager::instance()->register( new Integration() );
