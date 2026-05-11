<?php
/**
 * Payment Gateway abstract layer loader (free tier).
 *
 * Initializes the PaymentGatewaysManager singleton so concrete gateways
 * registered via the pro Loader can find a manager to register against.
 *
 * Class resolution is handled by PSR-4; this loader exists to give
 * Module::boot() a single explicit entry point.
 *
 * @since 1.0.0
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\PaymentGateway;

use DoubleScale\Modules\Booking\Managers\PaymentGatewaysManager;

defined( 'ABSPATH' ) || exit;

final class Loader {

	/**
	 * Boot the payment gateway abstract layer.
	 *
	 * ReturnHandler.php is a global-namespace function file (no class), so
	 * PSR-4 can't autoload it. Pull it in here so the post-payment redirect
	 * handler (`?doublescale_booking_payment=…` URLs returned from Stripe
	 * Checkout / Hosted Invoice flows) is registered on the `init` hook.
	 */
	public static function register(): void {
		PaymentGatewaysManager::instance();
		require_once __DIR__ . '/ReturnHandler.php';
	}
}
