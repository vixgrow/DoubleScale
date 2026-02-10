<?php
/**
 * Abstract Bulk Mailer
 *
 * Base class for bulk email mailers. Each mailer (Mailgun, SendGrid, etc.)
 * should extend this class and implement the required methods.
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage Emails\BulkMailers
 */

namespace QuillCRM\Emails\BulkMailers;

use QuillCRM\Emails\Traits\Account_API_Helper;
use WP_Error;

/**
 * Abstract_Bulk_Mailer class
 *
 * @since 1.0.0
 */
abstract class Abstract_Bulk_Mailer {

	use Account_API_Helper;

	/**
	 * Mailer slug identifier
	 *
	 * @var string
	 */
	protected $slug = '';

	/**
	 * Maximum recipients per batch
	 *
	 * @var int
	 */
	protected $max_batch_size = 100;

	/**
	 * Whether this mailer supports tracking
	 *
	 * @var bool
	 */
	protected $supports_tracking = true;

	/**
	 * Get mailer slug
	 *
	 * @return string
	 */
	public function get_slug() {
		return $this->slug;
	}

	/**
	 * Get maximum batch size
	 *
	 * @return int
	 */
	public function get_max_batch_size() {
		return apply_filters(
			'quillcrm_bulk_email_max_batch_size',
			$this->max_batch_size,
			$this->slug
		);
	}

	/**
	 * Check if this mailer supports tracking
	 *
	 * @return bool
	 */
	public function supports_tracking() {
		return $this->supports_tracking;
	}

	/**
	 * Convert QuillCRM merge tags to mailer-specific format
	 *
	 * @param string $content Content with QuillCRM merge tags (e.g., {{contact:first_name}})
	 *
	 * @return string Content with mailer-specific recipient variables
	 */
	abstract public function convert_merge_tags( $content );

	/**
	 * Check if this mailer is properly configured and available
	 *
	 * @return bool
	 */
	abstract public function is_available();

	/**
	 * Send a batch of emails
	 *
	 * @param array $batch_data {
	 *     Batch email data.
	 *
	 *     @type string $subject             Email subject
	 *     @type string $html                HTML body
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
	 * @return array|WP_Error Result array or WP_Error on failure
	 */
	abstract public function send_batch( $batch_data );

	/**
	 * Validate batch data before sending
	 *
	 * @param array $batch_data Batch email data
	 *
	 * @return true|WP_Error True if valid, WP_Error if invalid
	 */
	protected function validate_batch_data( $batch_data ) {
		if ( empty( $batch_data['recipients'] ) || ! is_array( $batch_data['recipients'] ) ) {
			return new WP_Error(
				'invalid_recipients',
				__( 'Recipients array is required.', 'quillcrm' )
			);
		}

		if ( empty( $batch_data['subject'] ) ) {
			return new WP_Error(
				'missing_subject',
				__( 'Email subject is required.', 'quillcrm' )
			);
		}

		if ( empty( $batch_data['html'] ) ) {
			return new WP_Error(
				'missing_body',
				__( 'Email body is required.', 'quillcrm' )
			);
		}

		$max_batch_size = $this->get_max_batch_size();
		if ( count( $batch_data['recipients'] ) > $max_batch_size ) {
			return new WP_Error(
				'batch_too_large',
				sprintf(
					__( 'Batch size exceeds maximum of %d recipients.', 'quillcrm' ),
					$max_batch_size
				)
			);
		}

		return true;
	}

	/**
	 * Build the from address string
	 *
	 * @param array $batch_data Batch email data
	 *
	 * @return string Formatted from address (e.g., "Name <email@domain.com>")
	 */
	protected function build_from_address( $batch_data ) {
		$from_name  = $batch_data['from_name'] ?? get_bloginfo( 'name' );
		$from_email = $batch_data['from_email'] ?? get_option( 'admin_email' );

		return sprintf( '%s <%s>', $from_name, $from_email );
	}

	/**
	 * Log batch send attempt
	 *
	 * @param array $batch_data Batch email data
	 */
	protected function log_send_attempt( $batch_data ) {
		quillcrm_get_logger()->info(
			/* translators: %s: mailer name */
			sprintf( __( 'Sending bulk email via %s', 'quillcrm' ), ucfirst( $this->slug ) ),
			array(
				'code'            => 'bulk_email_send_attempt',
				'mailer'          => $this->slug,
				'recipient_count' => count( $batch_data['recipients'] ),
				'campaign_id'     => $batch_data['campaign_id'] ?? null,
				'subject'         => substr( $batch_data['subject'], 0, 50 ),
			)
		);
	}

	/**
	 * Log batch send success
	 *
	 * @param array  $batch_data Batch email data
	 * @param string $message_id Message ID from the mailer
	 */
	protected function log_send_success( $batch_data, $message_id ) {
		quillcrm_get_logger()->info(
			__( 'Bulk email sent successfully', 'quillcrm' ),
			array(
				'code'            => 'bulk_email_send_success',
				'mailer'          => $this->slug,
				'message_id'      => $message_id,
				'recipient_count' => count( $batch_data['recipients'] ),
				'campaign_id'     => $batch_data['campaign_id'] ?? null,
			)
		);
	}

	/**
	 * Log batch send failure
	 *
	 * @param array    $batch_data Batch email data
	 * @param WP_Error $error      Error object
	 */
	protected function log_send_failure( $batch_data, $error ) {
		quillcrm_get_logger()->error(
			__( 'Bulk email send failed', 'quillcrm' ),
			array(
				'code'            => 'bulk_email_send_error',
				'mailer'          => $this->slug,
				'error'           => $error->get_error_message(),
				'recipient_count' => count( $batch_data['recipients'] ),
				'campaign_id'     => $batch_data['campaign_id'] ?? null,
			)
		);
	}
}
