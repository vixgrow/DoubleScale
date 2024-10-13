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
