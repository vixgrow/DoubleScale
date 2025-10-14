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
 */
class Campaign_Channel {

	/**
	 * Email channel constant
	 */
	const CHANNEL_EMAIL = 'email';

	/**
	 * SMS channel constant
	 */
	const CHANNEL_SMS = 'sms';

	/**
	 * WhatsApp channel constant
	 */
	const CHANNEL_WHATSAPP = 'whatsapp';

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
	 * Get channel label (human-readable name)
	 *
	 * @param string $channel Channel slug.
	 * @return string Channel label
	 */
	public static function get_label( $channel ) {
		$labels = array(
			self::CHANNEL_EMAIL    => __( 'Email', 'quillcrm' ),
			self::CHANNEL_SMS      => __( 'SMS', 'quillcrm' ),
			self::CHANNEL_WHATSAPP => __( 'WhatsApp', 'quillcrm' ),
		);

		// Allow custom channels to define labels via filter
		$labels = apply_filters( 'quillcrm_campaign_channel_labels', $labels );

		return $labels[ $channel ] ?? ucfirst( $channel );
	}

	/**
	 * Convert channel to Tracking_Model mode constant
	 *
	 * Maps campaign channel slugs to tracking mode integers.
	 * Used when creating tracking records for campaign messages.
	 *
	 * @param string $channel Channel slug.
	 * @return int|null Tracking mode constant or null if not found
	 */
	public static function to_mode( $channel ) {
		$mode_map = array(
			self::CHANNEL_EMAIL    => Tracking_Model::MODE_EMAIL,
			self::CHANNEL_SMS      => Tracking_Model::MODE_SMS,
			self::CHANNEL_WHATSAPP => Tracking_Model::MODE_WHATSAPP,
		);

		// Allow custom channels to define their mode mappings
		$mode_map = apply_filters( 'quillcrm_campaign_channel_to_mode', $mode_map );

		return $mode_map[ $channel ] ?? null;
	}

	/**
	 * Convert Tracking_Model mode constant to channel slug
	 *
	 * Reverse mapping of to_mode(). Used for analytics and filtering.
	 *
	 * @param int $mode Tracking mode constant.
	 * @return string|null Channel slug or null if not found
	 */
	public static function from_mode( $mode ) {
		$channel_map = array(
			Tracking_Model::MODE_EMAIL    => self::CHANNEL_EMAIL,
			Tracking_Model::MODE_SMS      => self::CHANNEL_SMS,
			Tracking_Model::MODE_WHATSAPP => self::CHANNEL_WHATSAPP,
		);

		// Allow custom channels to define their mode mappings
		$channel_map = apply_filters( 'quillcrm_campaign_mode_to_channel', $channel_map );

		return $channel_map[ $mode ] ?? null;
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
	 * @param string $channel Channel slug.
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
	 * @param string $channel Channel slug.
	 * @return string Field name ('email' or 'phone')
	 */
	public static function get_recipient_field( $channel ) {
		if ( self::requires_phone( $channel ) ) {
			return 'phone';
		}
		return 'email';
	}
}
