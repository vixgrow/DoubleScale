<?php
/**
 * Functions
 * This file contains all the functions used in the plugin
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */
use QuillCRM\QuillCRM;

use QuillCRM\Interfaces\Logger_Interface;
use QuillCRM\Logger;
use QuillCRM\Settings;

/**
 * Helper function to sanitize a string from user input or from the db
 * Forked from WordPress core
 *
 * @see https://developer.wordpress.org/reference/functions/_sanitize_text_fields/
 * It is marked as a private function in WordPress.
 * so we copied its implementation here in case it has been removed in any future WordPress version
 *
 * @since 1.0.0
 *
 * @param string $str           String to deeply sanitize.
 * @param bool   $keep_newlines Whether to keep newlines. Default: false.
 *
 * @return string Sanitized string, or empty string if not a string provided.
 */
function quillcrm_sanitize_text_fields( $str, $keep_newlines = false ) {
	if ( is_object( $str ) || is_array( $str ) ) {
		return '';
	}

	$str = (string) $str;

	$filtered = wp_check_invalid_utf8( $str );

	if ( strpos( $filtered, '<' ) !== false ) {
		$filtered = wp_pre_kses_less_than( $filtered );
		// This will strip extra whitespace for us.
		$filtered = wp_strip_all_tags( $filtered, false );

		// Use HTML entities in a special case to make sure no later
		// newline stripping stage could lead to a functional tag.
		$filtered = str_replace( "<\n", "&lt;\n", $filtered );
	}

	if ( ! $keep_newlines ) {
		$filtered = preg_replace( '/[\r\n\t ]+/', ' ', $filtered );
	}
	$filtered = trim( $filtered );

	$found = false;
	while ( preg_match( '/%[a-f0-9]{2}/i', $filtered, $match ) ) {
		$filtered = str_replace( $match[0], '', $filtered );
		$found    = true;
	}

	if ( $found ) {
		// Strip out the whitespace that may now exist after removing the octets.
		$filtered = trim( preg_replace( '/ +/', ' ', $filtered ) );
	}

	return $filtered;
}

/**
 * Deeply sanitize the string, preserve newlines if needed.
 * Prevent maliciously prepared strings from containing HTML tags.
 * Heavily inspired by wpforms
 *
 * @since 1.0.0
 *
 * @param string $string        String to deeply sanitize.
 * @param bool   $keep_newlines Whether to keep newlines. Default: false.
 *
 * @return string Sanitized string, or empty string if not a string provided.
 */
function quillcrm_sanitize_text_deeply( $string, $keep_newlines = false ) {

	if ( is_object( $string ) || is_array( $string ) ) {
		return '';
	}

	$string        = (string) $string;
	$keep_newlines = (bool) $keep_newlines;

	$new_value = quillcrm_sanitize_text_fields( $string, $keep_newlines );

	if ( strlen( $new_value ) !== strlen( $string ) ) {
		$new_value = quillcrm_sanitize_text_deeply( $new_value, $keep_newlines );
	}

	return $new_value;
}

/**
 * Decode special characters, both alpha- (<) and numeric-based (').
 * Sanitize recursively, preserve new lines.
 * Handle all the possible mixed variations of < and `&lt;` that can be processed into tags.
 * Heavily inspired by wpforms
 *
 * @since 1.0.0
 *
 * @param string $string Raw string to decode.
 *
 * @return string
 */
function quillcrm_decode_string( $string ) {

	if ( ! is_string( $string ) ) {
		return $string;
	}

	/*
	 * Sanitization should be done first, so tags are stripped and < is converted to &lt; etc.
	 * This iteration may do nothing when the string already comes with &lt; and &gt; only.
	 */
	$string = quillcrm_sanitize_text_deeply( $string, true );

	// Now we need to convert the string without tags: &lt; back to < (same for quotes).
	$string = wp_kses_decode_entities( html_entity_decode( $string, ENT_QUOTES ) );

	// And now we need to sanitize AGAIN, to avoid unwanted tags that appeared after decoding.
	return quillcrm_sanitize_text_deeply( $string, true );
}

/**
 * Check if plugin is active
 *
 * @since 1.0.0
 *
 * @param string $plugin_name
 *
 * @return bool
 */
function quillcrm_is_plugin_active( $plugin_name ) {
	$active_plugins = get_option( 'active_plugins' );

	return in_array( $plugin_name, $active_plugins, true );
}

/**
 * Get countries list
 *
 * @since 1.0.0
 *
 * @return array
 */
function quillcrm_get_countries() {
	require_once ABSPATH . 'wp-admin/includes/file.php'; // We will probably need to load this file.
	global $wp_filesystem;
	WP_Filesystem(); // Initial WP file system.
	$contries  = QUILLCRM_PLUGIN_DIR . 'assets/countries.json';
	$countries = $wp_filesystem->get_contents( $contries );

	return json_decode( $countries, true );
}

/**
 * Get country code by country name
 *
 * @since 1.0.0
 *
 * @param string $country_name
 *
 * @return string
 */
function quillcrm_get_country_code( $country_name ) {
	$countries = quillcrm_get_countries();
	if ( isset( $countries[ $country_name ] ) ) {
		return $country_name;
	}
	$country_name = ucwords( strtolower( $country_name ) );
	$code         = array_search( $country_name, array_column( $countries, 'name' ) );

	return $code;
}

/**
 * Get country name by country code
 *
 * @since 1.0.0
 *
 * @param string $country_code
 *
 * @return string
 */
function quillcrm_get_country_name( $country_code ) {
	$countries = quillcrm_get_countries();
	$name      = $countries[ $country_code ]['name'] ?? '';

	return $name;
}

/**
 * Get validator
 *
 * @since 1.0.0
 *
 * @return object
 */
function quillcrm_validator() {
	return QuillCRM::instance()->validator;
}

/**
 * Get a shared logger instance.
 * This function is forked from Woocommerce
 *
 * Use the quillcrm_logging_class filter to change the logging class. You may provide one of the following:
 *     - a class name which will be instantiated as `new $class` with no arguments
 *     - an instance which will be used directly as the logger
 * In either case, the class or instance *must* implement Logger_Interface.
 *
 * @since 1.0.0
 * @see Logger_Interface
 *
 * @return Logger
 */
function quillcrm_get_logger() {
	static $logger = null;

	$class = apply_filters( 'quillcrm_logging_class', Logger::class );

	if ( null !== $logger && is_string( $class ) && is_a( $logger, $class ) ) {
		return $logger;
	}

	$implements = class_implements( $class );

	if ( is_array( $implements ) && in_array( Logger_Interface::class, $implements, true ) ) {
		$threshold = Settings::get( 'log_level', 'info' );
		$logger    = is_object( $class ) ? $class : new $class( null, $threshold );
	} else {
		_doing_it_wrong(
			__FUNCTION__,
			sprintf(
				/* translators: 1: class name 2: quillcrm_logging_class 3: Logger_Interface */
				__( 'The class %1$s provided by %2$s filter must implement %3$s.', 'quillcrm' ),
				'<code>' . esc_html( is_object( $class ) ? get_class( $class ) : $class ) . '</code>',
				'<code>quillcrm_logging_class</code>',
				'<code>Logger_Interface</code>'
			),
			'1.0.0'
		);

		$logger = is_a( $logger, Logger::class ) ? $logger : new Logger();
	}

	return $logger;
}

/**
 * Trigger logging cleanup using the logging class.
 *
 * @since 1.0.0
 */
function quillcrm_cleanup_logs() {
	$logger = quillcrm_get_logger();

	if ( is_callable( array( $logger, 'clear_expired_logs' ) ) ) {
		$logger->clear_expired_logs();
	}
}
add_action( 'quillcrm_cleanup_logs', 'quillcrm_cleanup_logs' );

/**
 * Add contact meta
 *
 * @since 1.0.0
 *
 * @param int    $contact_id Contact ID.
 * @param string $meta_key Meta key.
 * @param mixed  $meta_value Meta value.
 * @param bool   $unique Optional. Whether the same key should not be added. Default false.
 *
 * @return int|false Meta ID on success, false on failure.
 */
function quillcrm_add_contact_meta( $contact_id, $meta_key, $meta_value, $unique = false ) {
	return add_metadata( 'quillcrm_contact', $contact_id, $meta_key, $meta_value, $unique );
}

/**
 * Update contact meta
 *
 * @since 1.0.0
 *
 * @param int    $contact_id Contact ID.
 * @param string $meta_key Meta key.
 * @param mixed  $meta_value Meta value.
 * @param mixed  $prev_value Optional. Previous value to check before updating. Default empty.
 *
 * @return int|bool Meta ID if the key didn't exist, true on successful update, false on failure.
 */
function quillcrm_update_contact_meta( $contact_id, $meta_key, $meta_value, $prev_value = '' ) {
	return update_metadata( 'quillcrm_contact', $contact_id, $meta_key, $meta_value, $prev_value );
}

/**
 * Get contact meta
 *
 * @since 1.0.0
 *
 * @param int    $contact_id Contact ID.
 * @param string $meta_key Optional. Meta key. If not specified, retrieve all metadata for the contact.
 * @param bool   $single Optional. If true, return only the first value of the specified meta_key. Default false.
 *
 * @return mixed Single metadata value, or array of values.
 */
function quillcrm_get_contact_meta( $contact_id, $meta_key = '', $single = false ) {
	return get_metadata( 'quillcrm_contact', $contact_id, $meta_key, $single );
}

/**
 * Delete contact meta
 *
 * @since 1.0.0
 *
 * @param int    $contact_id Contact ID.
 * @param string $meta_key Meta key.
 * @param mixed  $meta_value Optional. Meta value. If provided, rows will only be removed that match the value. Default empty.
 *
 * @return bool True on success, false on failure.
 */
function quillcrm_delete_contact_meta( $contact_id, $meta_key, $meta_value = '' ) {
	return delete_metadata( 'quillcrm_contact', $contact_id, $meta_key, $meta_value );
}
