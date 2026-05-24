<?php
/**
 * Abstract Payment Gateway class.
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\PaymentGateway;

defined( 'ABSPATH' ) || exit;

use Illuminate\Support\Arr;
use DoubleScale\Modules\Booking\Managers\PaymentGatewaysManager;

/**
 * Payment Gateway class.
 */
abstract class PaymentGateway {

	/**
	 * Payment Gateway Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name;

	/**
	 * Payment Gateway Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug;

	/**
	 * Payment Gateway Description
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
	 * Subclasses instances.
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	private static $instances = array();

	/**
	 * PaymentGateway instances.
	 *
	 * Instantiates or reuses an instance of PaymentGateway.
	 *
	 * @since 1.0.0
	 * @static
	 *
	 * @return static - Single instance
	 */
	public static function instance() {
		if ( ! isset( self::$instances[ static::class ] ) ) {
			$instance = new static();
			$instance->register();
			self::$instances[ static::class ] = $instance;
		}
		return self::$instances[ static::class ];
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->init();
	}

	/**
	 * Init
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init() {
		$this->option_name = 'doublescale_booking_' . $this->slug . '_settings';
	}

	/**
	 * Register
	 *
	 * @return bool
	 */
	private function register() {
		try {
			PaymentGatewaysManager::instance()->register_payment_gateway( $this );
		} catch ( \Exception $e ) {
			return false;
		}

		return true;
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
	 * @param mixed  $default
	 *
	 * @return mixed
	 */
	public function get_setting( $key, $default = '' ) {
		$settings = $this->get_settings();
		return Arr::get( $settings, $key, $default );
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
	 * Check if the gateway is enabled
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public function is_enabled() {
		return (bool) get_option( "doublescale_booking_{$this->slug}_enabled", false );
	}

	/**
	 * Set gateway enabled status
	 *
	 * @since 1.0.0
	 *
	 * @param boolean $enabled
	 * @return void
	 */
	public function set_enabled( $enabled ) {
		update_option( "doublescale_booking_{$this->slug}_enabled", (bool) $enabled );
	}

	/**
	 * Validate the integration. Concrete gateways override to validate their
	 * settings payload; default permits anything.
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings Candidate settings payload.
	 *
	 * @return bool
	 */
	public function validate( $settings ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable, Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Default no-op for subclasses to override.
		return true;
	}

	/**
	 * Is gateway and method configured
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	abstract public function is_configured();

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	abstract public function get_fields();
}
