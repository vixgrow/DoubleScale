<?php
/**
 * Mailjet Bulk Mailer
 *
 * Handles bulk email sending via Mailjet's Send API v3.1.
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage Emails\BulkMailers
 */

namespace QuillCRM\Emails\BulkMailers;

use WP_Error;

/**
 * Mailjet_Bulk_Mailer class
 *
 * @since 1.0.0
 */
class Mailjet_Bulk_Mailer extends Abstract_Bulk_Mailer {

	/**
	 * Mailer slug identifier
	 *
	 * @var string
	 */
	protected $slug = 'mailjet';

	/**
	 * Maximum recipients per batch (Mailjet limit: 50 messages per request)
	 *
	 * @var int
	 */
	protected $max_batch_size = 50;

	/**
	 * Whether this mailer supports tracking
	 *
	 * @var bool
	 */
	protected $supports_tracking = true;

	/**
	 * Cached account API instance
	 *
	 * @var object|null
	 */
	private $account_api = null;

	/**
	 * Convert QuillCRM merge tags to Mailjet variable format
	 *
	 * Mailjet uses {{var:key}} syntax for variables.
	 * Converts {{contact:first_name}} to {{var:first_name}}
	 *
	 * @param string $content Content with QuillCRM merge tags
	 *
	 * @return string Content with Mailjet variables
	 */
	public function convert_merge_tags( $content ) {
		// Convert {{group:field_name}} to {{var:field_name}} for all groups
		$content = preg_replace(
			'/\{\{([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)\}\}/',
			'{{var:$2}}',
			$content
		);

		return $content;
	}

	/**
	 * Check if Mailjet is properly configured and available
	 *
	 * @return bool
	 */
	public function is_available() {
		return $this->get_account_api() !== null;
	}

	/**
	 * Send a batch of emails via Mailjet
	 *
	 * @param array $batch_data Batch email data
	 *
	 * @return array|WP_Error Result array or WP_Error on failure
	 */
	public function send_batch( $batch_data ) {
		// Validate batch data
		$validation = $this->validate_batch_data( $batch_data );
		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		// Get Mailjet Account API
		$account_api = $this->get_account_api();

		if ( ! $account_api ) {
			return new WP_Error(
				'mailjet_not_configured',
				__( 'Mailjet is not properly configured.', 'quillcrm' )
			);
		}

		// Check if send_batch method exists
		if ( ! method_exists( $account_api, 'send_batch' ) ) {
			return new WP_Error(
				'mailjet_batch_not_supported',
				__( 'Mailjet batch sending is not available. Please update QuillSMTP.', 'quillcrm' )
			);
		}

		// Build headers
		$headers = $this->build_headers( $batch_data );

		// Prepare batch args for Mailjet
		$mailjet_args = array(
			'from_email'          => $batch_data['from_email'] ?? get_option( 'admin_email' ),
			'from_name'           => $batch_data['from_name'] ?? get_bloginfo( 'name' ),
			'to'                  => $batch_data['recipients'],
			'subject'             => $batch_data['subject'],
			'html'                => $batch_data['html'],
			'recipient_variables' => $batch_data['recipient_variables'] ?? array(),
			'headers'             => $headers,
		);

		// Add plain text version if provided
		if ( ! empty( $batch_data['text'] ) ) {
			$mailjet_args['text'] = $batch_data['text'];
		}

		// Add reply-to
		if ( ! empty( $batch_data['reply_to'] ) ) {
			$mailjet_args['reply_to'] = $batch_data['reply_to'];
		}

		// Add tags for campaign tracking
		if ( ! empty( $batch_data['tags'] ) ) {
			$mailjet_args['tags'] = $batch_data['tags'];
		} elseif ( ! empty( $batch_data['campaign_id'] ) ) {
			$mailjet_args['tags'] = array( 'campaign-' . $batch_data['campaign_id'] );
		}

		// Log attempt
		$this->log_send_attempt( $batch_data );

		// Send via Mailjet
		$result = $account_api->send_batch( $mailjet_args );

		if ( is_wp_error( $result ) ) {
			$this->log_send_failure( $batch_data, $result );
			return $result;
		}

		// Log success
		$message_id = $result['id'] ?? '';
		$this->log_send_success( $batch_data, $message_id );

		return array(
			'success'    => true,
			'message_id' => $message_id,
			'message'    => $result['message'] ?? __( 'Batch sent successfully', 'quillcrm' ),
			'sent_count' => $result['sent_count'] ?? count( $batch_data['recipients'] ),
			'failed'     => $result['failed'] ?? array(),
		);
	}

	/**
	 * Build headers for Mailjet request
	 *
	 * @param array $batch_data Batch email data
	 *
	 * @return array Headers array
	 */
	private function build_headers( $batch_data ) {
		$headers = array();

		// List-Unsubscribe headers (one-click unsubscribe for Gmail/Yahoo compliance)
		if ( ! empty( $batch_data['recipient_variables'] ) ) {
			$first_email = reset( $batch_data['recipients'] );
			if ( ! empty( $batch_data['recipient_variables'][ $first_email ]['unsubscribe_url'] ) ) {
				$headers['List-Unsubscribe']      = '{{var:unsubscribe_url}}';
				$headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
			}
		}

		return $headers;
	}

	/**
	 * Get the Mailjet Account API instance
	 *
	 * @return object|null Account API instance or null
	 */
	private function get_account_api() {
		if ( $this->account_api !== null ) {
			return $this->account_api;
		}

		if ( ! class_exists( '\\QuillSMTP\\Mailers\\Mailjet\\Accounts' ) ) {
			return null;
		}

		$settings = get_option( 'quillsmtp_settings', array() );

		if ( empty( $settings['connections'] ) || ! is_array( $settings['connections'] ) ) {
			return null;
		}

		$connections = $settings['connections'];
		$account_id  = null;

		// Check default_connection first
		if ( ! empty( $settings['default_connection'] ) ) {
			$default_connection_id = $settings['default_connection'];

			if ( isset( $connections[ $default_connection_id ] ) ) {
				$connection = $connections[ $default_connection_id ];

				if ( ! empty( $connection['mailer'] ) && $connection['mailer'] === 'mailjet' ) {
					$account_id = $connection['account_id'] ?? null;
				}
			}
		}

		// Check fallback_connection if default is not Mailjet
		if ( ! $account_id && ! empty( $settings['fallback_connection'] ) ) {
			$fallback_connection_id = $settings['fallback_connection'];

			if ( isset( $connections[ $fallback_connection_id ] ) ) {
				$connection = $connections[ $fallback_connection_id ];

				if ( ! empty( $connection['mailer'] ) && $connection['mailer'] === 'mailjet' ) {
					$account_id = $connection['account_id'] ?? null;
				}
			}
		}

		if ( ! $account_id ) {
			return null;
		}

		try {
			$mailers = \QuillSMTP\Mailers\Mailers::instance();
			$mailjet = $mailers->get_mailer( 'mailjet' );

			if ( ! $mailjet || ! isset( $mailjet->accounts ) ) {
				return null;
			}

			$account_api = $mailjet->accounts->connect( $account_id );

			if ( is_wp_error( $account_api ) ) {
				return null;
			}

			$this->account_api = $account_api;
			return $this->account_api;
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Failed to get Mailjet Account API', 'quillcrm' ),
				array(
					'code'  => 'bulk_email_mailjet_api_error',
					'error' => $e->getMessage(),
				)
			);
			return null;
		}
	}
}
