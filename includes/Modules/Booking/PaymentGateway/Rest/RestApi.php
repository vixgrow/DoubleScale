<?php
/**
 * REST API class.
 *
 * @since 1.0.0
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\PaymentGateway\Rest;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Booking\PaymentGateway\PaymentGateway;

/**
 * REST class.
 *
 * @since 1.0.0
 */
class RestApi {

	/**
	 * Payment gateway.
	 *
	 * @var PaymentGateway
	 */
	protected $payment_gateway;

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		// 'settings_controller' => RestSettingsController::class,
	);

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param PaymentGateway $payment_gateway payment_gateway.
	 */
	public function __construct( $payment_gateway ) {
		$this->payment_gateway = $payment_gateway;

		if ( ! empty( static::$classes['settings_controller'] ?? null ) ) {
			new static::$classes['settings_controller']( $this->payment_gateway );
		}
	}
}
