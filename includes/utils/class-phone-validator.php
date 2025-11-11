<?php
/**
 * Phone Number Validator
 * Centralized utility for validating phone numbers in E.164 format
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Utils;

/**
 * Phone_Validator class
 *
 * Provides consistent phone number validation across the entire plugin.
 * Validates E.164 international phone number format.
 *
 * @since 1.0.0
 */
class Phone_Validator {

	/**
	 * E.164 format regex pattern
	 * Format: +[country code][number]
	 * - Must start with +
	 * - Country code: 1-3 digits (1-9)
	 * - Total length: 8-15 digits (including country code)
	 *
	 * Examples:
	 * - +1234567890 (US)
	 * - +447975777666 (UK)
	 * - +33612345678 (France)
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const E164_PATTERN = '/^\+[1-9]\d{1,14}$/';

	/**
	 * Validate phone number in E.164 format
	 *
	 * @since 1.0.0
	 * @param string|null $phone Phone number to validate
	 * @return bool True if valid E.164 format, false otherwise
	 */
	public static function is_valid( $phone ) {
		if ( empty( $phone ) ) {
			return false;
		}

		return (bool) preg_match( self::E164_PATTERN, $phone );
	}

	/**
	 * Validate phone number and return validation result with error message
	 *
	 * @since 1.0.0
	 * @param string|null $phone Phone number to validate
	 * @param string      $context Optional context for logging (e.g., 'campaign', 'action', 'contact')
	 * @return array{valid: bool, error: string|null} Validation result
	 */
	public static function validate( $phone, $context = '' ) {
		if ( empty( $phone ) ) {
			return array(
				'valid' => false,
				'error' => __( 'Phone number is required', 'quillcrm' ),
			);
		}

		if ( ! self::is_valid( $phone ) ) {
			$error_message = sprintf(
				/* translators: %s: example phone number */
				__( 'Invalid phone number format. Please use E.164 format (e.g., %s)', 'quillcrm' ),
				'+1234567890'
			);

			// Log validation failure if context provided
			if ( ! empty( $context ) ) {
				quillcrm_get_logger()->debug(
					'Phone number validation failed',
					array(
						'code'    => 'invalid_phone_format',
						'context' => $context,
						'phone'   => $phone,
					)
				);
			}

			return array(
				'valid' => false,
				'error' => $error_message,
			);
		}

		return array(
			'valid' => true,
			'error' => null,
		);
	}

	/**
	 * Sanitize phone number to E.164 format
	 * Attempts to clean and format phone number
	 *
	 * @since 1.0.0
	 * @param string      $phone Phone number to sanitize
	 * @param string|null $default_country_code Optional default country code (e.g., '1' for US)
	 * @return string|null Sanitized phone number or null if invalid
	 */
	public static function sanitize( $phone, $default_country_code = null ) {
		if ( empty( $phone ) ) {
			return null;
		}

		// Remove all non-numeric characters except +
		$cleaned = preg_replace( '/[^0-9+]/', '', $phone );

		// If already starts with +, validate and return
		if ( strpos( $cleaned, '+' ) === 0 ) {
			return self::is_valid( $cleaned ) ? $cleaned : null;
		}

		// Try to add default country code if provided
		if ( ! empty( $default_country_code ) ) {
			$with_country_code = '+' . $default_country_code . ltrim( $cleaned, '0' );
			if ( self::is_valid( $with_country_code ) ) {
				return $with_country_code;
			}
		}

		// Try with + prefix only
		$with_plus = '+' . $cleaned;
		return self::is_valid( $with_plus ) ? $with_plus : null;
	}

	/**
	 * Get E.164 format description for user-facing messages
	 *
	 * @since 1.0.0
	 * @return string Human-readable format description
	 */
	public static function get_format_description() {
		return __( 'E.164 format: +[country code][number] (e.g., +1234567890)', 'quillcrm' );
	}

	/**
	 * Get E.164 example phone number
	 *
	 * @since 1.0.0
	 * @param string $country Optional country code (us, uk, fr, etc.)
	 * @return string Example phone number
	 */
	public static function get_example( $country = 'us' ) {
		$examples = array(
			'us' => '+1234567890',
			'uk' => '+447975777666',
			'fr' => '+33612345678',
			'de' => '+4915123456789',
			'ca' => '+14165551234',
			'au' => '+61412345678',
		);

		return $examples[ strtolower( $country ) ] ?? $examples['us'];
	}
}
