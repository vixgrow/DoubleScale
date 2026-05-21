<?php
/**
 * Payment Gateways Manager.
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Managers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Booking\PaymentGateway\PaymentGateway;

/**
 * PaymentGatewaysManager class.
 */
final class PaymentGatewaysManager extends \DoubleScale\Modules\Booking\Abstracts\Manager {

	use \DoubleScale\Modules\Booking\Traits\Singleton;

	/**
	 * Register a payment gateway.
	 *
	 * @param PaymentGateway $payment_gateway
	 */
	public function register_payment_gateway( PaymentGateway $payment_gateway ) {
		parent::register(
			$payment_gateway,
			PaymentGateway::class,
			'slug',
			array(
				'name'        => 'name',
				'description' => 'description',
				'settings'    => 'get_settings',
				'fields'      => 'get_fields',
				'enabled'     => 'is_enabled',
			)
		);
	}
}
