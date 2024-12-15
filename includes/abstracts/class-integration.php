<?php
/**
 * Class Integration
 *
 * This class is responsible for handling the integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

/**
 * Integration class
 */
abstract class Integration {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name;

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug;

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description;

	/**
	 * Option name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $option_name;

	/**
	 * Remote Data
	 *
	 * @var Integration_Remote_Data
	 */
	public $remote_data;

	/**
	 * REST Controller
	 *
	 * @var REST_Integration_Controller
	 */
	public $rest_controller;

	/**
	 * API
	 *
	 * @var Integration_API
	 */
	public $api;

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		// + classes from parent.
		// 'remote_data'   => Integration_Remote_Data::class,
		// 'rest_controller' => REST_Integration_Controller::class,
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		if ( ! empty( static::$classes['rest_controller'] ) ) {
			$this->rest_controller = new static::$classes['rest_controller']( $this );
		}

		if ( ! empty( static::$classes['remote_data'] ) ) {
			$this->remote_data = new static::$classes['remote_data']( $this );
		}

		$this->option_name = 'quillcrm_' . $this->slug . '_settings';
	}

	/**
	 * Connect the integration
	 *
	 * @since 1.0.0
	 *
	 * @return bool|Integration_API
	 */
	public function connect() {
		// Implement this method in the child class.
	}

	/**
	 * Get the settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_settings() {
		return get_option( $this->option_name, array() );
	}

	/**
	 * Get the setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key
	 *
	 * @return mixed
	 */
	public function get_setting( $key ) {
		$settings = $this->get_settings();
		return isset( $settings[ $key ] ) ? $settings[ $key ] : '';
	}

	/**
	 * Update the settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings
	 *
	 * @return void
	 */
	public function update_settings( $settings ) {
		update_option( $this->option_name, $settings );
	}

	/**
	 * Update the setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key
	 * @param mixed  $value
	 *
	 * @return void
	 */
	public function update_setting( $key, $value ) {
		$settings         = $this->get_settings();
		$settings[ $key ] = $value;
		$this->update_settings( $settings );
	}

	/**
	 * validate the integration
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings
	 *
	 * @return bool
	 */
	public function validate( $settings ) {
		return true;
	}

	/**
	 * Is connected
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_connected() {
		$api = $this->connect();
		if ( $api instanceof Integration_API ) {
			return true;
		}

		return false;
	}
}
