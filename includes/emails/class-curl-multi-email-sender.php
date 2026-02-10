<?php
/**
 * Curl Multi Email Sender
 *
 * Handles sending emails in parallel via cURL Multi for mailers that don't have
 * native bulk API support but do have HTTP API (e.g., SMTP2GO).
 *
 * This significantly improves performance compared to sending one email at a time
 * by sending multiple concurrent HTTP requests.
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage Emails
 */

namespace QuillCRM\Emails;

use QuillCRM\Emails\CurlMulti\Abstract_Curl_Multi_Mailer;
use QuillCRM\Emails\CurlMulti\SMTP2GO_Curl_Multi_Mailer;
use WP_Error;

/**
 * Curl_Multi_Email_Sender class
 *
 * @since 1.0.0
 */
class Curl_Multi_Email_Sender {

	/**
	 * Registered curl multi mailer classes
	 *
	 * @var array
	 */
	private static $mailer_classes = array(
		'smtp2go' => SMTP2GO_Curl_Multi_Mailer::class,
	);

	/**
	 * Cached mailer instance
	 *
	 * @var Abstract_Curl_Multi_Mailer|null
	 */
	private static $mailer_instance = null;

	/**
	 * Check if curl multi sending is available
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if a curl multi-capable mailer is active
	 */
	public static function is_available() {
		// Check if QuillSMTP is active
		if ( ! class_exists( '\\QuillSMTP\\QuillSMTP' ) ) {
			return false;
		}

		// Check if cURL extension is available
		if ( ! function_exists( 'curl_multi_init' ) ) {
			return false;
		}

		$mailer = self::get_mailer_instance();
		return $mailer !== null && $mailer->is_available();
	}

	/**
	 * Get the active curl multi-capable mailer slug
	 *
	 * Checks only the default_connection and fallback_connection.
	 *
	 * @since 1.0.0
	 *
	 * @return string|null Mailer slug or null if not available
	 */
	public static function get_active_mailer_slug() {
		if ( ! class_exists( '\\QuillSMTP\\QuillSMTP' ) ) {
			return null;
		}

		// Get QuillSMTP settings
		$settings = get_option( 'quillsmtp_settings', array() );

		// Check if connections exist
		if ( empty( $settings['connections'] ) || ! is_array( $settings['connections'] ) ) {
			return null;
		}

		$connections = $settings['connections'];

		// Check default_connection first
		if ( ! empty( $settings['default_connection'] ) ) {
			$default_connection_id = $settings['default_connection'];

			if ( isset( $connections[ $default_connection_id ] ) ) {
				$connection = $connections[ $default_connection_id ];

				if ( ! empty( $connection['mailer'] ) && isset( self::$mailer_classes[ $connection['mailer'] ] ) ) {
					return $connection['mailer'];
				}
			}
		}

		// Check fallback_connection if default is not curl multi-capable
		if ( ! empty( $settings['fallback_connection'] ) ) {
			$fallback_connection_id = $settings['fallback_connection'];

			if ( isset( $connections[ $fallback_connection_id ] ) ) {
				$connection = $connections[ $fallback_connection_id ];

				if ( ! empty( $connection['mailer'] ) && isset( self::$mailer_classes[ $connection['mailer'] ] ) ) {
					return $connection['mailer'];
				}
			}
		}

		return null;
	}

	/**
	 * Get the active curl multi mailer instance
	 *
	 * @since 1.0.0
	 *
	 * @return Abstract_Curl_Multi_Mailer|null Mailer instance or null if not available
	 */
	public static function get_mailer_instance() {
		if ( self::$mailer_instance !== null ) {
			return self::$mailer_instance;
		}

		$mailer_slug = self::get_active_mailer_slug();

		if ( ! $mailer_slug || ! isset( self::$mailer_classes[ $mailer_slug ] ) ) {
			return null;
		}

		$mailer_class          = self::$mailer_classes[ $mailer_slug ];
		self::$mailer_instance = new $mailer_class();

		return self::$mailer_instance;
	}

	/**
	 * Get curl multi mailer information
	 *
	 * @since 1.0.0
	 *
	 * @return array|null Mailer info array or null if not available
	 */
	public static function get_curl_multi_mailer_info() {
		$mailer = self::get_mailer_instance();

		if ( ! $mailer ) {
			return null;
		}

		return array(
			'slug'              => $mailer->get_slug(),
			'max_batch_size'    => $mailer->get_max_batch_size(),
			'max_concurrent'    => $mailer->get_max_concurrent(),
			'supports_tracking' => $mailer->supports_tracking(),
		);
	}

	/**
	 * Get maximum batch size for current mailer
	 *
	 * @since 1.0.0
	 *
	 * @return int Maximum batch size (default 100 if unknown)
	 */
	public static function get_max_batch_size() {
		$mailer = self::get_mailer_instance();

		if ( ! $mailer ) {
			return 100; // Safe default
		}

		return $mailer->get_max_batch_size();
	}

	/**
	 * Get maximum concurrent requests for current mailer
	 *
	 * @since 1.0.0
	 *
	 * @return int Maximum concurrent requests (default 10 if unknown)
	 */
	public static function get_max_concurrent() {
		$mailer = self::get_mailer_instance();

		if ( ! $mailer ) {
			return 10; // Safe default
		}

		return $mailer->get_max_concurrent();
	}

	/**
	 * Process merge tags for curl multi (personalize content)
	 *
	 * Unlike Bulk_Email_Sender which converts merge tags to mailer format,
	 * curl multi processes merge tags by replacing them with actual values
	 * since each email is personalized individually.
	 *
	 * @since 1.0.0
	 *
	 * @param string $content   Content with QuillCRM merge tags
	 * @param array  $variables Variables to replace
	 *
	 * @return string Content with replaced variables
	 */
	public static function process_merge_tags( $content, $variables ) {
		$mailer = self::get_mailer_instance();

		if ( ! $mailer ) {
			return $content;
		}

		return $mailer->process_merge_tags( $content, $variables );
	}

	/**
	 * Send batch of emails
	 *
	 * @since 1.0.0
	 *
	 * @param array $batch_data {
	 *     Batch email data.
	 *
	 *     @type string $subject             Email subject (with merge tags)
	 *     @type string $html                HTML body (with merge tags)
	 *     @type string $text                Plain text body (optional)
	 *     @type string $from_email          Sender email address
	 *     @type string $from_name           Sender name
	 *     @type string $reply_to            Reply-to address (optional)
	 *     @type array  $recipients          Array of recipient email addresses
	 *     @type array  $recipient_variables Associative array keyed by email with variable values
	 *     @type array  $tags                Tags for tracking (optional)
	 *     @type int    $campaign_id         Campaign ID for logging (optional)
	 * }
	 *
	 * @return array|WP_Error {
	 *     Result array or WP_Error on failure.
	 *
	 *     @type bool   $success      Whether all emails were sent successfully
	 *     @type int    $sent_count   Number of successfully sent emails
	 *     @type array  $failed       Array of failed recipients with errors
	 *     @type array  $message_ids  Array of message IDs (email => id)
	 * }
	 */
	public static function send_batch( $batch_data ) {
		$mailer = self::get_mailer_instance();

		if ( ! $mailer ) {
			return new WP_Error(
				'no_curl_multi_mailer',
				__( 'No cURL Multi-capable email mailer is configured.', 'quillcrm' )
			);
		}

		if ( ! $mailer->is_available() ) {
			return new WP_Error(
				'mailer_not_available',
				sprintf(
					/* translators: %s: mailer name */
					__( '%s is not properly configured.', 'quillcrm' ),
					ucfirst( $mailer->get_slug() )
				)
			);
		}

		return $mailer->send_batch( $batch_data );
	}

	/**
	 * Register a custom curl multi mailer class
	 *
	 * Allows third-party plugins to register their own curl multi mailers.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug        Mailer slug identifier
	 * @param string $class_name  Fully qualified class name (must extend Abstract_Curl_Multi_Mailer)
	 *
	 * @return bool True if registered successfully, false if slug already exists
	 */
	public static function register_mailer( $slug, $class_name ) {
		if ( isset( self::$mailer_classes[ $slug ] ) ) {
			return false;
		}

		self::$mailer_classes[ $slug ] = $class_name;

		// Clear cached instance if we're registering a new mailer
		self::$mailer_instance = null;

		return true;
	}

	/**
	 * Get list of supported mailer slugs
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of mailer slugs
	 */
	public static function get_supported_mailers() {
		return array_keys( self::$mailer_classes );
	}

	/**
	 * Reset cached mailer instance
	 *
	 * Useful for testing or when mailer configuration changes.
	 *
	 * @since 1.0.0
	 */
	public static function reset() {
		self::$mailer_instance = null;
	}
}
