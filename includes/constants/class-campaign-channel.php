<?php
/**
 * Campaign Channel Constants
 * Defines string constants for campaign communication channels
 * Replaces magic strings throughout the codebase for better maintainability
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Constants;

use QuillCRM\Models\Tracking_Model;

/**
 * Campaign_Channel class
 *
 * Provides constants and utility methods for campaign channels (email, SMS, WhatsApp).
 * Supports extensibility for third-party plugins to register custom channels.
 *
 * Campaign types are stored as integers for performance and type safety.
 */
class Campaign_Channel {

	/**
	 * Email channel type (integer)
	 */
	const CHANNEL_EMAIL = 1;

	/**
	 * SMS channel type (integer)
	 */
	const CHANNEL_SMS = 2;

	/**
	 * WhatsApp channel type (integer)
	 */
	const CHANNEL_WHATSAPP = 3;

	/**
	 * Email sequence type (integer)
	 * Special type for email sequences (child campaigns of email)
	 */
	const CHANNEL_SEQUENCE_MAIL = 4;

	/**
	 * Email sequence parent type (integer)
	 * Parent email sequence campaign that contains sequence_mail children
	 */
	const CHANNEL_EMAIL_SEQUENCE = 5;

	/**
	 * String constants for channel types (for comparisons in code)
	 */
	const STR_EMAIL = 'email';
	const STR_SMS = 'sms';
	const STR_WHATSAPP = 'whatsapp';
	const STR_SEQUENCE_MAIL = 'sequence_mail';
	const STR_EMAIL_SEQUENCE = 'email_sequence';

	/**
	 * Registered custom channels (for third-party extensions)
	 *
	 * @var array
	 */
	private static $custom_channels = array();

	/**
	 * Get all core channels
	 *
	 * @return array Core channel slugs
	 */
	public static function get_core_channels() {
		return array(
			self::CHANNEL_EMAIL,
			self::CHANNEL_SMS,
			self::CHANNEL_WHATSAPP,
		);
	}

	/**
	 * Get all core channel strings (for API validation)
	 *
	 * @return array Core channel string slugs
	 */
	public static function get_core_channel_strings() {
		return array( self::STR_EMAIL, self::STR_SMS, self::STR_WHATSAPP );
	}

	/**
	 * Get all channels (core + custom)
	 *
	 * @return array All registered channel slugs
	 */
	public static function get_all() {
		return array_merge(
			self::get_core_channels(),
			self::$custom_channels
		);
	}

	/**
	 * Get default channel
	 *
	 * @return string Default channel slug
	 */
	public static function get_default() {
		return self::CHANNEL_EMAIL;
	}

	/**
	 * Register a custom channel (for third-party plugins)
	 *
	 * @param string $channel_slug Channel slug (e.g., 'telegram', 'push').
	 * @return bool True if registered successfully, false if already exists
	 */
	public static function register( $channel_slug ) {
		$channel_slug = sanitize_key( $channel_slug );

		// Prevent overriding core channels
		if ( in_array( $channel_slug, self::get_core_channels(), true ) ) {
			return false;
		}

		// Prevent duplicates
		if ( in_array( $channel_slug, self::$custom_channels, true ) ) {
			return false;
		}

		self::$custom_channels[] = $channel_slug;
		return true;
	}

	/**
	 * Check if a channel is valid
	 *
	 * @param string $channel Channel slug to validate.
	 * @return bool True if valid channel
	 */
	public static function is_valid( $channel ) {
		return in_array( $channel, self::get_all(), true );
	}

	/**
	 * Convert channel integer to string slug
	 *
	 * @param int $channel Channel type integer.
	 * @return string|null Channel slug ('email', 'sms', 'whatsapp', 'email_sequence', 'sequence_mail') or null if invalid
	 */
	public static function to_string( $channel ) {
		$mapping = array(
			self::CHANNEL_EMAIL          => self::STR_EMAIL,
			self::CHANNEL_SMS            => self::STR_SMS,
			self::CHANNEL_WHATSAPP       => self::STR_WHATSAPP,
			self::CHANNEL_SEQUENCE_MAIL  => self::STR_SEQUENCE_MAIL,
			self::CHANNEL_EMAIL_SEQUENCE => self::STR_EMAIL_SEQUENCE,
		);

		return $mapping[ $channel ] ?? null;
	}

	/**
	 * Convert channel string slug to integer
	 *
	 * @param string $channel_string Channel slug ('email', 'sms', 'whatsapp', 'email_sequence', 'sequence_mail').
	 * @return int|null Channel type integer or null if invalid
	 */
	public static function to_integer( $channel_string ) {
		$mapping = array(
			self::STR_EMAIL          => self::CHANNEL_EMAIL,
			self::STR_SMS            => self::CHANNEL_SMS,
			self::STR_WHATSAPP       => self::CHANNEL_WHATSAPP,
			self::STR_SEQUENCE_MAIL  => self::CHANNEL_SEQUENCE_MAIL,
			self::STR_EMAIL_SEQUENCE => self::CHANNEL_EMAIL_SEQUENCE,
		);

		return $mapping[ $channel_string ] ?? null;
	}

	/**
	 * Get channel label (human-readable name)
	 *
	 * @param int $channel Channel type integer.
	 * @return string Channel label
	 */
	public static function get_label( $channel ) {
		$labels = array(
			self::CHANNEL_EMAIL          => __( 'Email', 'quillcrm' ),
			self::CHANNEL_SMS            => __( 'SMS', 'quillcrm' ),
			self::CHANNEL_WHATSAPP       => __( 'WhatsApp', 'quillcrm' ),
			self::CHANNEL_SEQUENCE_MAIL  => __( 'Sequence Mail', 'quillcrm' ),
			self::CHANNEL_EMAIL_SEQUENCE => __( 'Email Sequence', 'quillcrm' ),
		);

		// Allow custom channels to define labels via filter
		$labels = apply_filters( 'quillcrm_campaign_channel_labels', $labels );

		return $labels[ $channel ] ?? __( 'Unknown', 'quillcrm' );
	}

	/**
	 * Convert channel type to Tracking_Model mode constant
	 *
	 * Since both use the same integer values, this is now a direct mapping.
	 * Kept for backward compatibility with existing code.
	 *
	 * @param int $channel Channel type integer.
	 * @return int|null Tracking mode constant or null if not found
	 */
	public static function to_mode( $channel ) {
		// Channel types and tracking modes use identical integers
		// CHANNEL_EMAIL (1) = MODE_EMAIL (1)
		// CHANNEL_SMS (2) = MODE_SMS (2)
		// CHANNEL_WHATSAPP (3) = MODE_WHATSAPP (3)
		return $channel;
	}

	/**
	 * Convert Tracking_Model mode constant to channel type
	 *
	 * Since both use the same integer values, this is now a direct mapping.
	 * Kept for backward compatibility with existing code.
	 *
	 * @param int $mode Tracking mode constant.
	 * @return int|null Channel type or null if not found
	 */
	public static function from_mode( $mode ) {
		// Channel types and tracking modes use identical integers
		return $mode;
	}

	/**
	 * Get channels with labels (for dropdowns/selects)
	 *
	 * @return array Associative array of channel slug => label
	 */
	public static function get_options() {
		$options = array();
		foreach ( self::get_all() as $channel ) {
			$options[ $channel ] = self::get_label( $channel );
		}
		return $options;
	}

	/**
	 * Check if channel requires phone number
	 *
	 * @param int $channel Channel type integer.
	 * @return bool True if channel needs phone number
	 */
	public static function requires_phone( $channel ) {
		$phone_channels = array(
			self::CHANNEL_SMS,
			self::CHANNEL_WHATSAPP,
		);

		// Allow custom channels to specify if they need phone
		$phone_channels = apply_filters( 'quillcrm_campaign_channels_requiring_phone', $phone_channels );

		return in_array( $channel, $phone_channels, true );
	}

	/**
	 * Get recipient field name for channel
	 *
	 * Returns the contact field name needed for this channel type.
	 *
	 * @param int $channel Channel type integer.
	 * @return string Field name ('email' or 'phone')
	 */
	public static function get_recipient_field( $channel ) {
		if ( self::requires_phone( $channel ) ) {
			return 'phone';
		}
		return 'email';
	}
}
