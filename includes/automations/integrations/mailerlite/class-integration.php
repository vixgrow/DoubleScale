<?php
/**
 * Class MailerLite
 *
 * This class is responsible for handling the MailerLite integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\MailerLite;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * MailerLite class
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'MailerLite';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'mailerlite';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'MailerLite Integration';

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

		$api_key = $this->get_setting( 'api_key' );

		if ( empty( $api_key ) ) {
			return false;
		}

		$this->api = new API( $api_key );

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
		$api_key = $settings['api_key'] ?? '';

		if ( empty( $api_key ) ) {
			return new \WP_Error( 'invalid_settings', __( 'API Key is required.', 'quill-crm' ) );
		}

		$api    = new API( $api_key );
		$result = $api->get_groups();
		if ( $result['success'] ) {
			return true;
		} else {
			return false;
		}
	}
}

Integrations_Manager::instance()->register( new Integration() );
