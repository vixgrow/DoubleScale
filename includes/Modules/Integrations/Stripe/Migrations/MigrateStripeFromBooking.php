<?php
/**
 * One-shot migration: pull existing Stripe credentials out of the booking
 * gateway option key and into the global Stripe integration's option key.
 *
 * Pre-prod migration — runs once. Also drops the now-unused PayPal and
 * WooCommerce gateway options.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Integrations\Stripe\Migrations;

defined( 'ABSPATH' ) || exit;

class MigrateStripeFromBooking {

	private const GUARD_OPTION = 'doublescale_stripe_settings_migrated_v1';
	private const OLD_STRIPE   = 'doublescale_booking_stripe_settings';
	private const NEW_STRIPE   = 'doublescale_stripe_settings';
	private const OLD_PAYPAL   = 'doublescale_booking_paypal_settings';
	private const OLD_WOO      = 'doublescale_booking_woocommerce_settings';

	public static function run(): void {
		if ( get_option( self::GUARD_OPTION ) ) {
			return;
		}

		$old = get_option( self::OLD_STRIPE );
		if ( is_array( $old ) && ! empty( $old ) ) {
			$existing = get_option( self::NEW_STRIPE, array() );
			if ( ! is_array( $existing ) ) {
				$existing = array();
			}

			update_option( self::NEW_STRIPE, array_merge( $existing, $old ) );
			delete_option( self::OLD_STRIPE );
		}

		delete_option( self::OLD_PAYPAL );
		delete_option( self::OLD_WOO );
		delete_option( 'doublescale_booking_paypal_enabled' );
		delete_option( 'doublescale_booking_stripe_enabled' );
		delete_option( 'doublescale_booking_woocommerce_enabled' );

		update_option( self::GUARD_OPTION, true );
	}
}
