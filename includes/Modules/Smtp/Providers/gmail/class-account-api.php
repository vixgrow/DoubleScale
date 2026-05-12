<?php
/**
 * Account_API class.
 *
 * @since 1.0.0
 * @package smtp
 * @subpackage mailers
 */

namespace DoubleScale\Modules\Smtp\Providers\Gmail;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Pro\Modules\Inbox\Oauth\EmailOauth;

use WP_Error;

/**
 * Account_API class.
 *
 * OAuth token lifecycle and profile via Google HTTPS APIs (no google/apiclient).
 *
 * @since 1.0.0
 */
class Account_API {

	/**
	 * Provider
	 *
	 * @var App
	 */
	private $app;

	/**
	 * OAuth token payload (access_token, refresh_token, expires_in, created, etc.)
	 *
	 * @var array<string, mixed>
	 */
	private $credentials;

	/**
	 * Account ID
	 *
	 * @var string
	 */
	private $account_id;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param App    $app Provider.
	 * @param string $account_id Account id.
	 * @param array  $account_data Account data.
	 */
	public function __construct( $app, $account_id, $account_data ) {
		$this->app         = $app;
		$this->account_id  = $account_id;
		$creds             = $account_data['credentials'] ?? array();
		$this->credentials = is_array( $creds ) ? $creds : array();
	}

	/**
	 * Whether the stored access token should be refreshed before use.
	 *
	 * @param array<string, mixed> $creds Credentials array.
	 */
	private function is_access_token_expired( array $creds ): bool {
		$access = isset( $creds['access_token'] ) ? (string) $creds['access_token'] : '';
		if ( $access === '' ) {
			return true;
		}
		$expires_in = isset( $creds['expires_in'] ) ? (int) $creds['expires_in'] : 0;
		$created    = isset( $creds['created'] ) ? (int) $creds['created'] : 0;
		if ( $expires_in <= 0 || $created <= 0 ) {
			return true;
		}
		$leeway = 60;
		return ( $created + $expires_in ) <= ( time() + $leeway );
	}

	/**
	 * Valid access token for Gmail / userinfo REST calls.
	 *
	 * @since 1.0.0
	 *
	 * @return string|WP_Error
	 */
	public function get_access_token() {
		try {
			if ( class_exists( EmailOauth::class ) ) {
				$this->credentials = EmailOauth::normalize_gmail_oauth_credentials_for_smtp( $this->credentials );
			}

			$app_credentials = $this->app->get_app_credentials();
			if ( empty( $app_credentials ) ) {
				throw new \Exception( esc_html__( 'Cannot find app credentials', 'doublescale' ) );
			}

			if ( $this->is_access_token_expired( $this->credentials ) ) {
				$refresh = $this->credentials['refresh_token'] ?? '';
				if ( ! empty( $this->account_id ) ) {
					$tokens = $this->app->refresh_tokens( $this->account_id, $refresh );
					if ( ! is_array( $tokens ) || empty( $tokens['access_token'] ) ) {
						throw new \Exception( 'Could not refresh tokens.' );
					}
					$this->credentials = array_merge( $this->credentials, $tokens );
				} else {
					if ( empty( $refresh ) ) {
						throw new \Exception( esc_html__( 'Missing refresh token from Google. Try revoking app access in your Google account, then authorize again.', 'doublescale' ) );
					}
					$refreshed = $this->app->get_tokens(
						array(
							'grant_type'    => 'refresh_token',
							'refresh_token' => $refresh,
							'client_id'     => $app_credentials['client_id'],
							'client_secret' => $app_credentials['client_secret'],
						)
					);
					if ( ! is_array( $refreshed ) || empty( $refreshed['access_token'] ) ) {
						$msg  = is_array( $refreshed ) && isset( $refreshed['error'] ) ? (string) $refreshed['error'] : 'token_refresh';
						$desc = is_array( $refreshed ) && isset( $refreshed['error_description'] ) ? ' ' . (string) $refreshed['error_description'] : '';
						throw new \Exception( $msg . $desc );
					}
					if ( empty( $refreshed['refresh_token'] ) ) {
						$refreshed['refresh_token'] = $refresh;
					}
					$this->credentials = array_merge( $this->credentials, $refreshed );
				}
			}

			$access = isset( $this->credentials['access_token'] ) ? (string) $this->credentials['access_token'] : '';
			if ( $access === '' ) {
				throw new \Exception( esc_html__( 'Unable to get access token', 'doublescale' ) );
			}

			return $access;
		} catch ( \Exception $e ) {
			return new WP_Error( 'get_access_token_error', $e->getMessage() );
		}
	}

	/**
	 * Get user profile
	 *
	 * @return object|WP_Error
	 */
	public function get_profile() {
		try {
			$access_token = $this->get_access_token();
			if ( is_wp_error( $access_token ) ) {
				throw new \Exception( $access_token->get_error_message() );
			}

			$response = wp_remote_get(
				'https://www.googleapis.com/oauth2/v3/userinfo',
				array(
					'headers'   => array(
						'Authorization' => 'Bearer ' . trim( $access_token ),
						'Accept'        => 'application/json',
					),
					'timeout'   => 30,
					'sslverify' => false,
				)
			);

			if ( is_wp_error( $response ) ) {
				throw new \Exception( $response->get_error_message() );
			}

			$body = wp_remote_retrieve_body( $response );
			$data = json_decode( $body );

			if ( empty( $data ) || ! isset( $data->email ) ) {
				throw new \Exception( 'Failed to retrieve user info from Google API.' );
			}

			return (object) array(
				'emailAddress' => $data->email,
				'name'         => isset( $data->name ) ? $data->name : '',
				'picture'      => isset( $data->picture ) ? $data->picture : '',
			);

		} catch ( \Exception $e ) {
			return new WP_Error( 'get_profile_error', $e->getMessage() );
		}
	}
}
