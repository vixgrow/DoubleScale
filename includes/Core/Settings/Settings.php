<?php
/**
 * Class Settings
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Core\Settings;


defined( 'ABSPATH' ) || exit;

/**
 * Settings Class
 *
 * @since 1.0.0
 */
class Settings {

	/**
	 * Option name where to store all settings
	 *
	 * @since 1.0.0
	 */
	const OPTION_NAME = 'doublescale_settings';

	/**
	 * Get a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $default Default value.
	 * @return mixed
	 */
	public static function get( $key, $default = false ) {
		$settings = self::get_all();
		return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
	}

	/**
	 * Update a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $value Value.
	 * @return boolean
	 */
	public static function update( $key, $value ) {
		return self::update_many( array( $key => $value ) );
	}

	/**
	 * Delete a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @return boolean
	 */
	public static function delete( $key ) {
		$settings = self::get_all();
		unset( $settings[ $key ] );
		return self::update_all( $settings );
	}

	/**
	 * Get all settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_all() {
		return get_option( self::OPTION_NAME, array() );
	}

	/**
	 * Update many settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $new_settings New settings.
	 * @return boolean
	 */
	public static function update_many( $new_settings ) {
		$old_settings = self::get_all();

		// Ensure both old and new settings are arrays to avoid type errors.
		if ( ! is_array( $old_settings ) ) {
			$old_settings = array();
		}

		if ( ! is_array( $new_settings ) ) {
			$new_settings = array();
		}

		$settings = array_replace( $old_settings, $new_settings );
		return self::update_all( $settings );
	}

	/**
	 * Update all settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings Settings.
	 * @return boolean
	 */
	public static function update_all( $settings ) {
		update_option( 'doublescale_flush_rewrite_rules', 1 );
		return update_option( self::OPTION_NAME, $settings );
	}

	/**
	 * Delete all settings
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public static function delete_all() {
		return delete_option( self::OPTION_NAME );
	}

	/**
	 * Get default email footer
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public static function get_default_email_footer() {
		return "<p>Don't want to stay in the loop? We'll be sad to see you go, but you can click here to <a href='{{contact:unsubscribe_link}}'>unsubscribe</a>.</p>";
	}

	/**
	 * Get default opt-in email subject
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public static function get_default_opt_in_subject() {
		return 'Please Confirm Your Subscription';
	}

	/**
	 * Get default opt-in email content
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public static function get_default_opt_in_content() {
		return '<p>Please confirm your subscription by clicking the link below:</p><p><a href="{{contact:subscribe_link}}">Confirm Subscription</a></p>';
	}

	/**
	 * Get default confirmation message
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public static function get_default_confirmation_message() {
		return 'Thank you for confirming your subscription!';
	}

	/**
	 * Get global currency setting
	 *
	 * @since 1.0.0
	 *
	 * @return string Currency code (e.g., 'USD', 'EUR')
	 */
	public static function get_currency() {
		$currency_settings = self::get( 'currency', array() );
		return isset( $currency_settings['currency'] ) ? $currency_settings['currency'] : 'USD';
	}

	/**
	 * Encrypt a value using AES-256-CBC with SECURE_AUTH_KEY.
	 *
	 * @param string $value Plaintext value.
	 * @return string Base64-encoded ciphertext, or empty string if input is empty.
	 */
	public static function encrypt_value( $value ) {
		if ( empty( $value ) ) {
			return '';
		}
		$key = hash( 'sha256', SECURE_AUTH_KEY, true );
		$iv  = openssl_random_pseudo_bytes( 16 );
		$encrypted = openssl_encrypt( $value, 'aes-256-cbc', $key, 0, $iv );
		return base64_encode( $iv . '::' . $encrypted );
	}

	/**
	 * Decrypt a value encrypted by encrypt_value().
	 *
	 * Falls back to returning the raw value when decryption fails,
	 * which handles migration from pre-encryption plaintext keys.
	 *
	 * @param string $value Encrypted (or legacy plaintext) value.
	 * @return string Decrypted plaintext.
	 */
	public static function decrypt_value( $value ) {
		if ( empty( $value ) ) {
			return '';
		}
		$decoded = base64_decode( $value, true );
		if ( false === $decoded || strpos( $decoded, '::' ) === false ) {
			// Not encrypted (legacy plaintext key) — return as-is.
			return $value;
		}
		$parts = explode( '::', $decoded, 2 );
		if ( count( $parts ) !== 2 || strlen( $parts[0] ) !== 16 ) {
			return $value;
		}
		$key       = hash( 'sha256', SECURE_AUTH_KEY, true );
		$decrypted = openssl_decrypt( $parts[1], 'aes-256-cbc', $key, 0, $parts[0] );
		// If decryption fails (wrong key, corrupted data), return raw value.
		return false === $decrypted ? $value : $decrypted;
	}

}
