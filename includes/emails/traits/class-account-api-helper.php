<?php
/**
 * Account API Helper Trait
 *
 * Provides common functionality for getting QuillSMTP account API instances.
 * Used by both bulk mailers and curl multi mailers to avoid code duplication.
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage Emails\Traits
 */

namespace QuillCRM\Emails\Traits;

/**
 * Account_API_Helper trait
 *
 * @since 1.0.0
 */
trait Account_API_Helper {

	/**
	 * Cached account API instance
	 *
	 * @var object|null
	 */
	private $account_api = null;

	/**
	 * Get the mailer slug (must be implemented by using class)
	 *
	 * @return string
	 */
	abstract public function get_slug();

	/**
	 * Get the QuillSMTP mailer class name
	 *
	 * Override this method if the class name differs from the standard format.
	 *
	 * @return string Fully qualified class name (e.g., '\QuillSMTP\Mailers\Mailgun\Accounts')
	 */
	protected function get_mailer_accounts_class() {
		$slug = $this->get_slug();
		// Convert slug to class name (e.g., 'mailgun' -> 'Mailgun', 'smtp2go' -> 'SMTP2GO')
		$class_name = $this->slug_to_class_name( $slug );
		$namespace  = $this->get_mailer_namespace( $slug );
		return $namespace . '\\Mailers\\' . $class_name . '\\Accounts';
	}

	/**
	 * Get the namespace for the mailer
	 *
	 * Some mailers are in QuillSMTP_PRO namespace instead of QuillSMTP.
	 *
	 * @param string $slug Mailer slug
	 *
	 * @return string Namespace (e.g., '\QuillSMTP' or '\QuillSMTP_PRO')
	 */
	protected function get_mailer_namespace( $slug ) {
		// Mailers that are in the PRO namespace
		$pro_mailers = array( 'aws' );

		if ( in_array( $slug, $pro_mailers, true ) ) {
			return '\\QuillSMTP_PRO';
		}

		return '\\QuillSMTP';
	}

	/**
	 * Convert mailer slug to class name
	 *
	 * @param string $slug Mailer slug (e.g., 'mailgun', 'smtp2go', 'sendgrid')
	 *
	 * @return string Class name (e.g., 'Mailgun', 'SMTP2GO', 'SendGrid')
	 */
	protected function slug_to_class_name( $slug ) {
		// Map of special case slugs that don't follow simple ucfirst pattern
		$special_cases = array(
			'mailgun'      => 'Mailgun',
			'sendgrid'     => 'SendGrid',
			'mailersend'   => 'MailerSend',
			'sendinblue'   => 'SendInBlue',
			'postmark'     => 'PostMark',
			'sparkpost'    => 'SparkPost',
			'mailjet'      => 'Mailjet',
			'elasticemail' => 'ElasticEmail',
			'aws'          => 'Aws',
			'smtp2go'      => 'SMTP2GO',
		);

		return $special_cases[ $slug ] ?? ucfirst( $slug );
	}

	/**
	 * Find account ID for this mailer from QuillSMTP settings
	 *
	 * Checks default_connection first, then fallback_connection.
	 *
	 * @return string|null Account ID or null if not found
	 */
	protected function find_account_id() {
		$settings = get_option( 'quillsmtp_settings', array() );

		// Check if connections exist
		if ( empty( $settings['connections'] ) || ! is_array( $settings['connections'] ) ) {
			return null;
		}

		$connections = $settings['connections'];
		$slug        = $this->get_slug();

		// Check default_connection first
		if ( ! empty( $settings['default_connection'] ) ) {
			$default_connection_id = $settings['default_connection'];

			if ( isset( $connections[ $default_connection_id ] ) ) {
				$connection = $connections[ $default_connection_id ];

				if ( ! empty( $connection['mailer'] ) && $connection['mailer'] === $slug ) {
					return $connection['account_id'] ?? null;
				}
			}
		}

		// Check fallback_connection if default doesn't use this mailer
		if ( ! empty( $settings['fallback_connection'] ) ) {
			$fallback_connection_id = $settings['fallback_connection'];

			if ( isset( $connections[ $fallback_connection_id ] ) ) {
				$connection = $connections[ $fallback_connection_id ];

				if ( ! empty( $connection['mailer'] ) && $connection['mailer'] === $slug ) {
					return $connection['account_id'] ?? null;
				}
			}
		}

		return null;
	}

	/**
	 * Get the account API instance for this mailer
	 *
	 * @return object|null Account API instance or null if not available
	 */
	protected function get_account_api() {
		if ( $this->account_api !== null ) {
			return $this->account_api;
		}

		$accounts_class = $this->get_mailer_accounts_class();

		if ( ! class_exists( $accounts_class ) ) {
			return null;
		}

		$account_id = $this->find_account_id();

		if ( ! $account_id ) {
			return null;
		}

		try {
			$mailers = \QuillSMTP\Mailers\Mailers::instance();
			$mailer  = $mailers->get_mailer( $this->get_slug() );

			if ( ! $mailer || ! isset( $mailer->accounts ) ) {
				return null;
			}

			$account_api = $mailer->accounts->connect( $account_id );

			if ( is_wp_error( $account_api ) ) {
				return null;
			}

			$this->account_api = $account_api;
			return $this->account_api;
		} catch ( \Exception $e ) {
			$this->log_account_api_error( $e->getMessage() );
			return null;
		}
	}

	/**
	 * Log account API error
	 *
	 * @param string $error_message Error message
	 */
	protected function log_account_api_error( $error_message ) {
		quillcrm_get_logger()->error(
			/* translators: %s: mailer name */
			sprintf( __( 'Failed to get %s Account API', 'quillcrm' ), ucfirst( $this->get_slug() ) ),
			array(
				'code'   => 'bulk_email_' . $this->get_slug() . '_api_error',
				'error'  => $error_message,
				'mailer' => $this->get_slug(),
			)
		);
	}

	/**
	 * Get account credentials (for mailers that need direct API access)
	 *
	 * This method gets raw credentials from the mailer account.
	 * Useful for curl multi mailers that need API keys directly.
	 *
	 * @param string $credential_key The key to get from credentials (e.g., 'api_key')
	 *
	 * @return array|null Array with credentials or null if not available
	 */
	protected function get_account_credentials( $credential_key = 'api_key' ) {
		$accounts_class = $this->get_mailer_accounts_class();

		if ( ! class_exists( $accounts_class ) ) {
			return null;
		}

		$account_id = $this->find_account_id();

		if ( ! $account_id ) {
			return null;
		}

		try {
			$mailers = \QuillSMTP\Mailers\Mailers::instance();
			$mailer  = $mailers->get_mailer( $this->get_slug() );

			if ( ! $mailer || ! isset( $mailer->accounts ) ) {
				return null;
			}

			$accounts = $mailer->accounts->get_accounts();

			if ( empty( $accounts[ $account_id ]['credentials'][ $credential_key ] ) ) {
				return null;
			}

			return array(
				$credential_key => $accounts[ $account_id ]['credentials'][ $credential_key ],
				'account_id'    => $account_id,
			);
		} catch ( \Exception $e ) {
			$this->log_account_api_error( $e->getMessage() );
			return null;
		}
	}

	/**
	 * Reset cached account API instance
	 *
	 * Useful when mailer configuration changes.
	 */
	public function reset_account_api() {
		$this->account_api = null;
	}
}
