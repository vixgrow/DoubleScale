<?php
/**
 * Bulk Email Sender
 *
 * Handles sending emails in bulk via QuillSMTP bulk-capable mailers (e.g., Mailgun, SendGrid).
 * This significantly improves performance by sending multiple emails in a single API call.
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage Emails
 */

namespace QuillCRM\Emails;

use QuillCRM\Emails\BulkMailers\Abstract_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Mailgun_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Mailersend_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Sendinblue_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Sendgrid_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Postmark_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Sparkpost_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Mailjet_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Elasticemail_Bulk_Mailer;
use QuillCRM\Emails\BulkMailers\Aws_Bulk_Mailer;
use QuillCRM\Emails\Traits\SMTP_Plugin_Active;
use WP_Error;

/**
 * Bulk_Email_Sender class
 *
 * @since 1.0.0
 */
class Bulk_Email_Sender {

	use SMTP_Plugin_Active;

	/**
	 * Registered bulk mailer classes
	 *
	 * @var array
	 */
	private static $mailer_classes = array(
		'mailgun'      => Mailgun_Bulk_Mailer::class,
		'mailersend'   => Mailersend_Bulk_Mailer::class,
		'sendinblue'   => Sendinblue_Bulk_Mailer::class,
		'sendgrid'     => Sendgrid_Bulk_Mailer::class,
		'postmark'     => Postmark_Bulk_Mailer::class,
		'sparkpost'    => Sparkpost_Bulk_Mailer::class,
		'mailjet'      => Mailjet_Bulk_Mailer::class,
		'elasticemail' => Elasticemail_Bulk_Mailer::class,
		'aws'          => Aws_Bulk_Mailer::class,
	);

	/**
	 * Cached mailer instance
	 *
	 * @var Abstract_Bulk_Mailer|null
	 */
	private static $mailer_instance = null;

	/**
	 * Check if bulk sending is available
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if a bulk-capable mailer is active
	 */
	public static function is_available() {
		if ( ! self::is_quillsmtp_plugin_active() ) {
			return false;
		}

		if ( ! self::is_quillsmtp_plugin_accepting_version() ) {
			return false;
		}

		$mailer = self::get_mailer_instance();
		return $mailer !== null && $mailer->is_available();
	}

	/**
	 * Get the active bulk-capable mailer slug
	 *
	 * Uses QuillSMTP smart routing to get the appropriate connection.
	 *
	 * @since 1.0.0
	 *
	 * @return string|null Mailer slug or null if not available
	 */
	public static function get_active_mailer_slug() {

		if ( ! self::is_quillsmtp_plugin_active() ) {
			return null;
		}

		if ( ! self::is_quillsmtp_plugin_accepting_version() ) {
			return null;
		}

		if ( ! class_exists( '\\QuillSMTP\\Settings' ) ) {
			return null;
		}

		// Use QuillSMTP smart routing
		$route = \QuillSMTP\Settings::get_smart_route();

		// Check default connection from smart route
		if ( ! empty( $route['default_connection'] ) ) {
			$connection = $route['default_connection'];

			if ( ! empty( $connection['mailer'] ) && isset( self::$mailer_classes[ $connection['mailer'] ] ) ) {
				return $connection['mailer'];
			}
		}

		// Check fallback connection if default is not bulk-capable
		if ( ! empty( $route['fallback_connection'] ) ) {
			$connection = $route['fallback_connection'];

			if ( ! empty( $connection['mailer'] ) && isset( self::$mailer_classes[ $connection['mailer'] ] ) ) {
				return $connection['mailer'];
			}
		}

		return null;
	}

	/**
	 * Get the active bulk mailer instance
	 *
	 * @since 1.0.0
	 *
	 * @return Abstract_Bulk_Mailer|null Mailer instance or null if not available
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
	 * Get bulk mailer information
	 *
	 * @since 1.0.0
	 *
	 * @return array|null Mailer info array or null if not available
	 */
	public static function get_bulk_mailer_info() {
		$mailer = self::get_mailer_instance();

		if ( ! $mailer ) {
			return null;
		}

		return array(
			'slug'              => $mailer->get_slug(),
			'max_batch_size'    => $mailer->get_max_batch_size(),
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
	 * Convert QuillCRM merge tags to mailer-specific recipient variable format
	 *
	 * This method auto-detects the active mailer and converts merge tags accordingly:
	 * - Mailgun: {{contact:first_name}} -> %recipient.first_name%
	 * - MailerSend: {{contact:first_name}} -> {{first_name}}
	 * - Sendinblue/Brevo: {{contact:first_name}} -> {{params.first_name}}
	 * - SendGrid: {{contact:first_name}} -> {{first_name}}
	 * - Postmark: {{contact:first_name}} -> {{first_name}}
	 * - SparkPost: {{contact:first_name}} -> {{first_name}}
	 * - Mailjet: {{contact:first_name}} -> {{var:first_name}}
	 * - ElasticEmail: {{contact:first_name}} -> {first_name}
	 * - AWS SES: {{contact:first_name}} -> {{first_name}}
	 *
	 * @since 1.0.0
	 *
	 * @param string $content Content with QuillCRM merge tags
	 *
	 * @return string Content with mailer-specific recipient variables
	 */
	public static function convert_merge_tags_to_recipient_variables( $content ) {
		$mailer = self::get_mailer_instance();

		if ( ! $mailer ) {
			return $content;
		}

		return $mailer->convert_merge_tags( $content );
	}

	/**
	 * Send batch of emails
	 *
	 * @since 1.0.0
	 *
	 * @param array $batch_data {
	 *     Batch email data.
	 *
	 *     @type string $subject             Email subject (with merge tags or recipient variables)
	 *     @type string $html                HTML body (with merge tags or recipient variables)
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
	 *     @type bool   $success      Whether the batch was sent successfully
	 *     @type string $message_id   Message ID from the mailer
	 *     @type int    $sent_count   Number of recipients in the batch
	 *     @type array  $failed       Array of failed recipients (if any)
	 * }
	 */
	public static function send_batch( $batch_data ) {
		$mailer = self::get_mailer_instance();

		if ( ! $mailer ) {
			return new WP_Error(
				'no_bulk_mailer',
				__( 'No bulk-capable email mailer is configured.', 'quillcrm' )
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
	 * Register a custom bulk mailer class
	 *
	 * Allows third-party plugins to register their own bulk mailers.
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug        Mailer slug identifier
	 * @param string $class_name  Fully qualified class name (must extend Abstract_Bulk_Mailer)
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
