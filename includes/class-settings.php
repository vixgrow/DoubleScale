<?php
/**
 * Class Settings
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM;

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
	const OPTION_NAME = 'quillcrm_settings';

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
		update_option( 'quillcrm-flush-rewrite-rules', 1 );
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

}
