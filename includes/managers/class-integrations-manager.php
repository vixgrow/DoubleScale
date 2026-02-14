<?php
/**
 * Class Integrations Manager
 * This class is responsible for handling the integrations
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Abstracts\Integration;

/**
 * Integrations class
 */
final class Integrations_Manager {

	/**
	 * Registed integrations
	 *
	 * @since 1.0.0
	 *
	 * @var Integration[]
	 */
	protected $integrations = array();

	/**
	 * Options
	 *
	 * @var array
	 */
	protected $options = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Integrations_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Integrations_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Register Integration
	 *
	 * @since 1.0.0
	 *
	 * @param Integration $integration
	 * @param bool        $override Whether to override existing integration (used by Pro plugin)
	 * @return void
	 */
	public function register( Integration $integration, $override = false ) {
		if ( ! $integration instanceof Integration ) {
			throw new Exception( __( 'Invalid integration', 'quill-crm' ) );
		}

		if ( isset( $this->integrations[ $integration->slug ] ) && ! $override ) {
			/* translators: %s: integration name */
			throw new Exception( sprintf( __( 'Integration %s already registered', 'quill-crm' ), $integration->name ) );
		}

		$this->integrations[ $integration->slug ] = $integration;
		$this->options[ $integration->slug ]      = array(
			'label'        => $integration->name,
			'description'  => $integration->description,
			'fields'       => $integration->rest_controller->get_settings_schema()['properties'],
			'is_connected' => $integration->is_connected(),
			'settings'     => $integration->get_settings(),
			'is_pro'       => $integration->is_pro ?? false,
		);
	}

	/**
	 * Get Integration
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 * @return Integration
	 */
	public function get_integration( $slug ) {
		if ( isset( $this->integrations[ $slug ] ) ) {
			return $this->integrations[ $slug ];
		}

		/* translators: %s: integration slug */
		throw new Exception( sprintf( __( 'Integration %s not found', 'quill-crm' ), $slug ) );
	}

	/**
	 * Get Integrations
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_integrations() {
		return $this->integrations;
	}

	/**
	 * Get Options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		return $this->options;
	}

	/**
	 * Is active
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 *
	 * @return bool
	 */
	public function is_active( $slug ) {
		if ( isset( $this->integrations[ $slug ] ) ) {
			return $this->integrations[ $slug ]->is_connected();
		}

		return false;
	}
}
