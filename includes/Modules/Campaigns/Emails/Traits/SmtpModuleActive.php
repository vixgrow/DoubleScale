<?php
/**
 * Bundled SMTP module detection for campaign senders
 *
 * Campaign bulk and cURL-multi paths resolve the CRM’s built-in SMTP module
 * first. Legacy standalone SMTP (or forks exposing the same constants)
 * remains supported when the bundle is not present.
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 * @subpackage Emails\Traits
 */

namespace DoubleScale\Modules\Campaigns\Emails\Traits;


defined( 'ABSPATH' ) || exit;

trait SmtpModuleActive {

	/**
	 * Settings class that implements smart routing (bundled module preferred).
	 *
	 * @return string|null Fully qualified class name.
	 */
	public static function get_smtp_settings_class() {
		if ( class_exists( '\DoubleScale\Modules\Smtp\Settings' ) ) {
			return '\DoubleScale\Modules\Smtp\Settings';
		}
		if ( class_exists( '\smtp\Settings' ) ) {
			return '\smtp\Settings';
		}
		return null;
	}

	/**
	 * Smart route array from the active SMTP settings backend, or null.
	 *
	 * @param string|null $from_email Optional From address for routing.
	 * @return array<string, mixed>|null
	 */
	public static function get_smtp_smart_route( $from_email = null ) {
		$settings_class = self::get_smtp_settings_class();
		if ( ! $settings_class || ! method_exists( $settings_class, 'get_smart_route' ) ) {
			return null;
		}
		return call_user_func( array( $settings_class, 'get_smart_route' ), $from_email );
	}

	/**
	 * First routed connection (default then fallback) whose mailer slug exists in $allowed.
	 *
	 * @param array<string, mixed> $route   Result of {@see self::get_smtp_smart_route()}.
	 * @param array<string, true>  $allowed Mailer slug => true.
	 * @return string|null Mailer slug.
	 */
	public static function pick_routed_mailer_slug( array $route, array $allowed ) {
		foreach ( array( 'default_connection', 'fallback_connection' ) as $field ) {
			$connection = $route[ $field ] ?? null;
			if ( empty( $connection ) || ! is_array( $connection ) ) {
				continue;
			}
			$mailer = isset( $connection['mailer'] ) ? (string) $connection['mailer'] : '';
			if ( $mailer !== '' && isset( $allowed[ $mailer ] ) ) {
				return $mailer;
			}
		}
		return null;
	}

	/**
	 * Whether the bundled SMTP module or a legacy SMTP plugin stack is present.
	 *
	 * @return bool
	 */
	public static function is_smtp_module_active() {
		if ( class_exists( '\DoubleScale\Modules\Smtp\Settings' )
			|| class_exists( '\DoubleScale\Modules\Smtp\Module' ) ) {
			return true;
		}

		return defined( 'smtp_PLUGIN_VERSION' );
	}

	/**
	 * Whether Pro-tier mailer code (e.g. AWS SES) is available inside the bundle or legacy add-on.
	 *
	 * @return bool
	 */
	public static function is_smtp_pro_mailers_active() {
		if ( class_exists( '\DoubleScale\Modules\Smtp\Settings' )
			|| class_exists( '\DoubleScale\Modules\Smtp\Module' ) ) {
			return class_exists( '\DoubleScale\Modules\Smtp\Providers\Aws\Accounts' );
		}

		return defined( 'smtp_PRO_PLUGIN_VERSION' );
	}

	/**
	 * Whether the general SMTP stack meets the minimum version (bundle always passes).
	 *
	 * @return bool
	 */
	public static function is_smtp_module_version_supported() {
		if ( class_exists( '\DoubleScale\Modules\Smtp\Settings' )
			|| class_exists( '\DoubleScale\Modules\Smtp\Module' ) ) {
			return true;
		}

		if ( defined( 'smtp_PLUGIN_VERSION' ) ) {
			return version_compare( smtp_PLUGIN_VERSION, '1.7.0', '>=' );
		}

		return false;
	}

	/**
	 * Whether Pro mailer code meets minimum version (bundle with AWS passes).
	 *
	 * @return bool
	 */
	public static function is_smtp_pro_mailers_version_supported() {
		if ( class_exists( '\DoubleScale\Modules\Smtp\Providers\Aws\Accounts' ) ) {
			return true;
		}

		if ( defined( 'smtp_PRO_PLUGIN_VERSION' ) ) {
			return version_compare( smtp_PRO_PLUGIN_VERSION, '1.0.0', '>=' );
		}

		return false;
	}
}
