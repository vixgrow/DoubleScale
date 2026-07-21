<?php
/**
 * Determines whether the full DoubleScale kernel should boot for the current request.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core;

defined( 'ABSPATH' ) || exit;

final class RequestContext {

	/**
	 * Whether the full plugin kernel (modules, Eloquent, admin, REST) should load.
	 */
	public static function should_boot_full_kernel(): bool {
		if ( defined( 'DOUBLESCALE_DISABLE_LAZY_BOOT' ) && DOUBLESCALE_DISABLE_LAZY_BOOT ) {
			return true;
		}

		if ( apply_filters( 'doublescale_force_full_kernel', false ) ) {
			return true;
		}

		$filtered = apply_filters( 'doublescale_boot_full_kernel', null );
		if ( null !== $filtered ) {
			return (bool) $filtered;
		}

		if ( self::is_admin_context() ) {
			return true;
		}

		if ( self::is_background_context() ) {
			return true;
		}

		if ( self::is_rest_context() ) {
			return true;
		}

		if ( self::is_public_crm_request() ) {
			return true;
		}

		if ( self::is_commerce_request() ) {
			return true;
		}

		if ( self::is_logged_in_crm_user() ) {
			return true;
		}

		if ( self::is_website_tracking_enabled() ) {
			return true;
		}

		return false;
	}

	private static function is_admin_context(): bool {
		if ( function_exists( 'is_admin' ) && is_admin() ) {
			return true;
		}

		// wp-login.php and admin-ajax from front-end context.
		if ( isset( $_SERVER['SCRIPT_NAME'] ) ) {
			$script = basename( wp_unslash( (string) $_SERVER['SCRIPT_NAME'] ) );
			if ( in_array( $script, array( 'wp-login.php', 'admin-post.php' ), true ) ) {
				return true;
			}
		}

		return false;
	}

	private static function is_background_context(): bool {
		if ( function_exists( 'wp_doing_cron' ) && wp_doing_cron() ) {
			return true;
		}

		if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
			return true;
		}

		if ( function_exists( 'wp_doing_ajax' ) && wp_doing_ajax() ) {
			return true;
		}

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return true;
		}

		return false;
	}

	private static function is_rest_context(): bool {
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return true;
		}

		$uri = self::request_uri();
		if ( false !== strpos( $uri, '/wp-json/' ) ) {
			return true;
		}

		return false;
	}

	private static function is_public_crm_request(): bool {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- early route detection only.
		if ( isset( $_GET['doublescale'] ) && isset( $_GET['hash_key'] ) ) {
			return true;
		}

		if ( isset( $_GET['doublescale_unsubscribe_success'] ) ) {
			return true;
		}

		if ( ! empty( $_GET['ds_file'] ) || ! empty( $_GET['ds_support_file'] ) ) {
			return true;
		}

		if ( isset( $_REQUEST['action'] ) ) {
			$action = sanitize_key( wp_unslash( (string) $_REQUEST['action'] ) );
			if ( 0 === strpos( $action, 'doublescale_' ) ) {
				return true;
			}
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$uri = self::request_uri();
		if ( false !== strpos( $uri, '/wp-json/doublescale/' ) ) {
			return true;
		}

		$booking_markers = array( 'doublescale_booking', 'ds-booking', 'ds_booking' );
		foreach ( $booking_markers as $marker ) {
			if ( false !== strpos( $uri, $marker ) ) {
				return true;
			}
		}

		return false;
	}

	private static function is_commerce_request(): bool {
		$uri = self::request_uri();

		$patterns = array(
			'/checkout',
			'/cart',
			'edd_action=',
			'edd-gateway=',
			'purchase',
			'wc-ajax=',
			'add-to-cart',
			'add_to_cart',
			'/edd-sl/',
		);

		foreach ( $patterns as $pattern ) {
			if ( false !== stripos( $uri, $pattern ) ) {
				return true;
			}
		}

		return false;
	}

	private static function is_logged_in_crm_user(): bool {
		if ( ! function_exists( 'is_user_logged_in' ) || ! is_user_logged_in() ) {
			return false;
		}

		$user = wp_get_current_user();
		if ( ! $user instanceof \WP_User ) {
			return false;
		}

		foreach ( (array) $user->roles as $role ) {
			if ( is_string( $role ) && 0 === strpos( $role, 'doublescale_' ) ) {
				return true;
			}
		}

		if ( user_can( $user, 'manage_options' ) ) {
			return true;
		}

		return false;
	}

	private static function is_website_tracking_enabled(): bool {
		if ( ! apply_filters( 'doublescale_is_pro_addon_active', false ) ) {
			return false;
		}

		$settings = get_option( 'doublescale_settings', array() );
		if ( ! is_array( $settings ) || ! isset( $settings['website_tracking'] ) || ! is_array( $settings['website_tracking'] ) ) {
			return false;
		}

		$tracking    = $settings['website_tracking'];
		$enabled_raw = $tracking['enabled'] ?? false;
		$enabled     = filter_var( $enabled_raw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
		if ( null === $enabled ) {
			$enabled = (bool) $enabled_raw;
		}

		return (bool) apply_filters( 'doublescale_website_tracking_enabled', $enabled );
	}

	private static function request_uri(): string {
		if ( ! isset( $_SERVER['REQUEST_URI'] ) ) {
			return '';
		}

		return sanitize_text_field( wp_unslash( (string) $_SERVER['REQUEST_URI'] ) );
	}
}
