<?php
/**
 * GoHighLevel OAuth Handler
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\GoHighLevel;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use QuillCRM\Settings;

/**
 * GoHighLevel OAuth Handler
 */
class GoHighLevel_OAuth {

	/**
	 * OAuth provider name
	 */
	const PROVIDER = 'gohighlevel';

	/**
	 * GoHighLevel OAuth URLs
	 */
	const AUTHORIZE_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation';
	const TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token';
	const API_BASE = 'https://services.leadconnectorhq.com';

	/**
	 * Class constructor - Initialize admin hooks
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'maybe_authorize' ) );
		add_action( 'admin_init', array( $this, 'maybe_add_account' ) );
	}

	/**
	 * Initialize OAuth handling (for static access)
	 */
	public static function init() {
		new self();
	}

	/**
	 * Get redirect URI
	 *
	 * @return string
	 */
	public static function get_redirect_uri() {
		return admin_url('admin.php');
	}

	/**
	 * Get OAuth authorization URL
	 *
	 * @param string $client_id The client ID from session credentials
	 * @return string Authorization URL
	 */
	public static function get_authorization_url($client_id) {
		// Store client_id temporarily for later use
		set_transient('quillcrm_ghl_temp_client_id', $client_id, 600); // 10 minutes

		return add_query_arg([
			'response_type' => 'code',
			'client_id' => $client_id,
			'scope' => 'contacts.readonly',
			'redirect_uri' => urlencode(self::get_redirect_uri()),
			'state' => 'quillcrm-ghl'
		], self::AUTHORIZE_URL);
	}

	/**
	 * Redirect the user to authorization page
	 *
	 * @return void
	 */
	public function maybe_authorize() {
		$action = $_GET['quillcrm-ghl'] ?? null;
		if ( $action !== 'authorize' ) {
			return;
		}

		$client_id = $_GET['client_id'] ?? '';
		$client_secret = $_GET['client_secret'] ?? '';
		
		if ( empty( $client_id ) || empty( $client_secret ) ) {
			echo esc_html__( 'Cannot find client credentials!', 'quill-crm' );
			exit;
		}

		// Store client_secret temporarily for the OAuth flow
		set_transient('quillcrm_ghl_temp_client_secret', $client_secret, 600); // 10 minutes

		$auth_url = self::get_authorization_url( $client_id );
		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Redirect to external OAuth provider
		wp_redirect( esc_url_raw( $auth_url ) );
		exit;
	}

	/**
	 * Add account after authorization
	 *
	 * @return void
	 */
	public function maybe_add_account() {
		$state = $_GET['state'] ?? '';
		if ( $state !== 'quillcrm-ghl' ) {
			return;
		}

		// ensure authorize code.
		$code = $_GET['code'] ?? null;
		if ( empty( $code ) ) {
			echo esc_html__( 'Error, There is no authorize code passed!', 'quill-crm' );
			exit;
		}

		// Get stored credentials
		$client_id = get_transient('quillcrm_ghl_temp_client_id');
		$client_secret = get_transient('quillcrm_ghl_temp_client_secret');

		if ( ! $client_id || ! $client_secret ) {
			echo esc_html__( 'Error, OAuth session expired!', 'quill-crm' );
			exit;
		}

		// Exchange code for tokens
		$response = wp_remote_post( self::TOKEN_URL, [
			'headers' => [
				'Content-Type' => 'application/x-www-form-urlencoded',
			],
			'body' => http_build_query([
				'grant_type' => 'authorization_code',
				'code' => $code,
				'client_id' => $client_id,
				'client_secret' => $client_secret,
				'redirect_uri' => self::get_redirect_uri(),
			])
		]);

		if ( is_wp_error( $response ) ) {
			echo esc_html__( 'Error, Cannot exchange code for tokens!', 'quill-crm' );
			exit;
		}

		$tokens = json_decode( wp_remote_retrieve_body( $response ), true );
		
		if ( empty( $tokens['access_token'] ) ) {
			echo esc_html__( 'Error, Invalid token response!', 'quill-crm' );
			exit;
		}

		// Store tokens without location info
		$token_data = [
			'access_token' => $tokens['access_token'],
			'created_at' => time(),
			'expires_at' => time() + 600, // 15 minutes
		];

		self::store_tokens( $token_data );

		// Clean up temporary credentials
		delete_transient('quillcrm_ghl_temp_client_id');
		delete_transient('quillcrm_ghl_temp_client_secret');

		// Successfully added - close popup
		?>
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Authorization Complete</title>
		</head>
		<body>
			<p><?php echo esc_html__( "The account is added successfully. If this window isn't closed automatically. Please close it and refresh your accounts select menu.", 'quill-crm' ); ?></p>
			<script>
				if ( window.opener ) {
					// Fallback: just close and refresh parent
					try {
						window.opener.location.reload();
						window.close();
					} catch(e) {
						console.log('Could not communicate with parent window');
					}
				}
			</script>
		</body>
		</html>
		<?php
		exit;
	}

	/**
	 * Store OAuth tokens in session
	 *
	 * @param array $token_data Token data to store
	 * @return bool
	 */
	public static function store_tokens($token_data) {
		$session_key = 'quillcrm_ghl_tokens_' . get_current_user_id();
		return set_transient($session_key, $token_data, 600); // 15 minutes
	}

	/**
	 * Get stored OAuth tokens
	 *
	 * @return array|false
	 */
	public static function get_stored_tokens() {
		$session_key = 'quillcrm_ghl_tokens_' . get_current_user_id();
		return get_transient($session_key);
	}

	/**
	 * Clear stored OAuth tokens
	 *
	 * @return bool
	 */
	public static function clear_stored_tokens() {
		$session_key = 'quillcrm_ghl_tokens_' . get_current_user_id();
		return delete_transient($session_key);
	}
}