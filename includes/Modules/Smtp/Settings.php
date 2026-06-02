<?php
/**
 * Class Settings
 *
 * @since 1.0.0
 * @package smtp
 */

namespace DoubleScale\Modules\Smtp;

defined( 'ABSPATH' ) || exit;

/**
 * Settings Class
 *
 * @since 1.0.0
 */
class Settings {

	/**
	 * Option name where to store all settings
	 *
	 * @since 1.0.0
	 */
	const OPTION_NAME = 'doublescale_smtp_settings';

	/**
	 * Last SMTP send attempt context (for clearer failure messages). Cleared after consume.
	 *
	 * @var array<string, mixed>|null
	 */
	private static $last_smtp_send_attempt = null;

	/**
	 * Record which connection is about to send (primary or fallback) for error diagnostics.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $attempt Keys: connection_id, mailer, reason, message_from, saved_default_id, is_fallback, routing_adjusted.
	 */
	public static function note_smtp_send_attempt( array $attempt ) {
		self::$last_smtp_send_attempt = $attempt;
	}

	/**
	 * Take and clear the last SMTP send attempt snapshot.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, mixed>|null
	 */
	public static function consume_smtp_send_attempt() {
		$out                          = self::$last_smtp_send_attempt;
		self::$last_smtp_send_attempt = null;
		return $out;
	}

	/**
	 * Human-readable line(s) describing the last noted SMTP attempt (connection, mailer, routing).
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $attempt {@see self::note_smtp_send_attempt()}.
	 * @return string
	 */
	public static function format_smtp_send_attempt_for_detail( array $attempt ) {
		$connections = self::get( 'connections', array() );
		if ( ! is_array( $connections ) ) {
			$connections = array();
		}

		$cid   = isset( $attempt['connection_id'] ) ? (string) $attempt['connection_id'] : '';
		$conn  = ( $cid !== '' && isset( $connections[ $cid ] ) ) ? $connections[ $cid ] : array();
		$name  = is_array( $conn ) ? trim( (string) ( $conn['connection_name'] ?? '' ) ) : '';
		$label = $name !== '' ? $name . ' [' . $cid . ']' : ( $cid !== '' ? $cid : __( '(unknown connection)', 'doublescale' ) );

		$mailer = isset( $attempt['mailer'] ) ? (string) $attempt['mailer'] : '';
		$parts  = array(
			sprintf(
				/* translators: 1: connection label, 2: mailer slug */
				__( 'SMTP attempted: %1$s (mailer: %2$s).', 'doublescale' ),
				$label,
				$mailer !== '' ? $mailer : __( 'unknown', 'doublescale' )
			),
		);

		if ( ! empty( $attempt['is_fallback'] ) ) {
			$parts[] = __( 'This was the fallback connection after the primary attempt failed.', 'doublescale' );
		}

		$reason = isset( $attempt['reason'] ) ? (string) $attempt['reason'] : 'default';

		if ( 'explicit' === $reason ) {
			$parts[] = __( 'Connection was selected via the doublescale_smtp_explicit_connection filter.', 'doublescale' );
		}

		if ( ! empty( $attempt['routing_adjusted'] ) ) {
			$parts[] = __( 'Routing was adjusted because the first resolved connection was missing from saved settings.', 'doublescale' );
		}

		return implode( ' ', $parts );
	}

	/**
	 * Get a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $default Default value.
	 * @return mixed
	 */
	public static function get( $key, $default = false ) {
		$settings = self::get_all();
		return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
	}

	/**
	 * Update a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $value Value.
	 * @return boolean
	 */
	public static function update( $key, $value ) {
		return self::update_many( array( $key => $value ) );
	}

	/**
	 * Delete a setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @return boolean
	 */
	public static function delete( $key ) {
		$settings = self::get_all();
		unset( $settings[ $key ] );
		return self::update_all( $settings );
	}

	/**
	 * Get all settings
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_all() {
		do_action( 'doublescale_smtp_before_get_settings' );
		$settings = get_option( self::OPTION_NAME, array() );
		do_action( 'doublescale_smtp_after_get_settings' );

		return $settings;
	}

	/**
	 * Update many settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $new_settings New settings.
	 * @return boolean
	 */
	public static function update_many( $new_settings ) {
		$old_settings = self::get_all();
		$settings     = array_replace( $old_settings, $new_settings );
		return self::update_all( $settings );
	}

	/**
	 * Update all settings
	 *
	 * @since 1.0.0
	 *
	 * @param array $settings Settings.
	 * @return boolean
	 */
	public static function update_all( $settings ) {
		return update_option( self::OPTION_NAME, $settings );
	}

	/**
	 * Delete all settings
	 *
	 * @since 1.0.0
	 *
	 * @return boolean
	 */
	public static function delete_all() {
		return delete_option( self::OPTION_NAME );
	}

	/**
	 * Get the default connection ID
	 *
	 * Returns the configured default connection, or falls back to the first
	 * available connection if no default is set.
	 *
	 * @since 1.0.0
	 *
	 * @return string|null Connection ID if found, null otherwise.
	 */
	public static function get_default_connection() {
		$connections        = self::get( 'connections', array() );
		$default_connection = self::get( 'default_connection' );

		// Only return a key that still exists (avoids stale ids after connection renames/deletes).
		if ( ! empty( $default_connection ) && is_array( $connections ) && isset( $connections[ $default_connection ] ) ) {
			return $default_connection;
		}

		if ( is_array( $connections ) && ! empty( $connections ) ) {
			return array_key_first( $connections );
		}

		return null;
	}

	/**
	 * Get smart route for email sending
	 *
	 * Returns the connection routing information based on smart routing rules:
	 * 1. Explicit connection set via filter (highest priority)
	 * 2. Filtered/default connection
	 * 3. First available connection (fallback)
	 *
	 * @since 1.0.0
	 *
	 * @param string|null $from_email Reserved for future per-from routing; currently unused.
	 * @return array {
	 *     Smart route information.
	 *
	 *     @type string|null $default_connection_id    The primary connection ID to use.
	 *     @type array|null  $default_connection       The primary connection configuration.
	 *     @type string|null $fallback_connection_id   The fallback connection ID.
	 *     @type array|null  $fallback_connection      The fallback connection configuration.
	 *     @type array       $connections                    All available connections.
	 *     @type string      $primary_route_reason           explicit|default — why the primary id was chosen.
	 *     @type string|null $settings_default_connection_id Saved default connection id (UI default), before explicit/from override.
	 *     @type bool        $routing_adjusted               True if primary id was replaced because it was missing/stale.
	 * }
	 */
	public static function get_smart_route( $from_email = null ) {
		$connections           = self::get( 'connections', array() ) ?? array();
		$default_connection_id = null;

		if ( ! is_array( $connections ) ) {
			$connections = array();
		}

		$connection_exists = static function ( $id ) use ( $connections ) {
			return is_string( $id ) && $id !== '' && isset( $connections[ $id ] );
		};

		$first_connection_id = ! empty( $connections ) ? array_key_first( $connections ) : null;

		// Get the default connection (returns configured default or first available connection)
		$settings_default_connection = self::get_default_connection();

		// Track if a filter has modified the connection
		$filter_modified_connection = false;
		$filtered_connection_id     = apply_filters(
			'doublescale_smtp_default_connection',
			$settings_default_connection,
			$filter_modified_connection
		);

		// Use a separate filter to detect if connection was explicitly set
		$explicit_connection = apply_filters( 'doublescale_smtp_explicit_connection', null );

		$primary_route_reason = 'default';
		$routing_adjusted     = false;

		// If explicit connection is set via filter, use it; otherwise use filtered/default connection.
		if ( $explicit_connection ) {
			$default_connection_id = $explicit_connection;
			$primary_route_reason  = 'explicit';
		} else {
			$default_connection_id = $filtered_connection_id;
			$primary_route_reason  = 'default';
		}

		// Final fallback to first connection
		$default_connection_id = $default_connection_id ?: $first_connection_id;

		// If the resolved id does not exist (stale filter/explicit id), recover to a real row.
		if ( ! $connection_exists( $default_connection_id ) ) {
			$routing_adjusted      = true;
			$default_connection_id = $connection_exists( $filtered_connection_id )
				? $filtered_connection_id
				: ( $connection_exists( $settings_default_connection ) ? $settings_default_connection : $first_connection_id );
		}

		$default_connection = $connection_exists( $default_connection_id )
			? $connections[ $default_connection_id ]
			: null;

		$raw_fallback           = self::get( 'fallback_connection' );
		$fallback_connection_id = $connection_exists( $raw_fallback ) ? $raw_fallback : null;
		$fallback_connection    = $fallback_connection_id ? ( $connections[ $fallback_connection_id ] ?? null ) : null;

		return array(
			'default_connection_id'          => $default_connection_id,
			'default_connection'             => $default_connection,
			'fallback_connection_id'         => $fallback_connection_id,
			'fallback_connection'            => $fallback_connection,
			'connections'                    => $connections,
			'primary_route_reason'           => $primary_route_reason,
			'settings_default_connection_id' => $settings_default_connection,
			'routing_adjusted'               => $routing_adjusted,
		);
	}

	/**
	 * Get connection by from email address
	 *
	 * @since 1.0.0
	 *
	 * @param string $from_email From email address.
	 * @return string|null Connection ID if found, null otherwise.
	 */
	public static function get_connection_by_from_email( $from_email ) {
		if ( empty( $from_email ) || ! is_email( $from_email ) ) {
			return null;
		}

		$connections = self::get( 'connections', array() );
		if ( ! is_array( $connections ) || empty( $connections ) ) {
			return null;
		}

		// Normalize email for comparison
		$from_email = strtolower( trim( $from_email ) );

		foreach ( $connections as $connection_id => $connection ) {
			$connection_from_email = $connection['from_email'] ?? '';
			if ( empty( $connection_from_email ) ) {
				continue;
			}

			// Normalize connection email for comparison
			$connection_from_email = strtolower( trim( $connection_from_email ) );

			// Exact match
			if ( $from_email === $connection_from_email ) {
				/**
				 * Filter the matched connection ID
				 *
				 * @param string $connection_id Connection ID that matched.
				 * @param string $from_email From email address.
				 * @param array  $connection Connection configuration.
				 */
				return apply_filters( 'doublescale_smtp_matched_connection', $connection_id, $from_email, $connection );
			}
		}

		return null;
	}

	/**
	 * List the SMTP connections a given user may bind as a sending identity.
	 *
	 * Used by the Support mailbox "Sender identity" picker. Every CRM sending
	 * identity — the shared/team email and each user's personal connected email
	 * — is stored as an SMTP connection; a personal connection carries the owning
	 * `user_id`, an org/shared connection does not (`0`/absent). The visibility
	 * rule:
	 *
	 *   - CRM Manager / Administrator → every connection (org-shared + everyone's
	 *     personal). They configure the whole CRM, so any identity is bindable.
	 *   - Everyone else (Sales Manager / Sales Rep) → only connections they own
	 *     (`connection['user_id'] === $user_id`). A rep can route a mailbox only
	 *     through their *own* address, never an org address or a colleague's.
	 *
	 * This is the single source of truth for both the picker list and the
	 * save-time validation in {@see RestMailboxController}, so the two can never
	 * disagree (a user can only persist a connection_id this method would show
	 * them).
	 *
	 * @since 1.0.0
	 *
	 * @param int $user_id WP user whose visibility to compute.
	 * @return array<int, array{connection_id:string, name:string, from_email:string, from_name:string, is_personal:bool}>
	 *               Zero-indexed list of bindable connections (id + display fields).
	 */
	public static function get_visible_connections_for_user( $user_id ) {
		$user_id     = (int) $user_id;
		$connections = self::get( 'connections', array() );
		if ( ! is_array( $connections ) || empty( $connections ) ) {
			return array();
		}

		$is_manager = \DoubleScale\Core\UserRoles\Permissions::has_crm_manager_access( $user_id );

		$out = array();
		foreach ( $connections as $connection_id => $connection ) {
			if ( ! is_array( $connection ) ) {
				continue;
			}

			$owner_id    = (int) ( $connection['user_id'] ?? 0 );
			$is_personal = $owner_id > 0;

			// Non-managers only see connections they personally own.
			if ( ! $is_manager && $owner_id !== $user_id ) {
				continue;
			}

			$from_email = trim( (string) ( $connection['from_email'] ?? '' ) );
			if ( '' === $from_email ) {
				continue; // A connection with no From address can't be a sending identity.
			}

			$out[] = array(
				'connection_id' => (string) $connection_id,
				'name'          => (string) ( $connection['name'] ?? $connection['connection_name'] ?? $from_email ),
				'from_email'    => $from_email,
				'from_name'     => (string) ( $connection['from_name'] ?? '' ),
				'is_personal'   => $is_personal,
			);
		}

		return $out;
	}

	/**
	 * Resolve a connection id to its sending-identity fields, regardless of who
	 * is asking (no capability filter — this is the *send-time* lookup, where the
	 * mailbox already holds a validated connection_id).
	 *
	 * @since 1.0.0
	 *
	 * @param string $connection_id Connection id stored on the mailbox.
	 * @return array{from_email:string, from_name:string}|null Identity, or null
	 *               when the id no longer maps to a connection with a From address.
	 */
	public static function get_identity_for_connection( $connection_id ) {
		$connection_id = (string) $connection_id;
		if ( '' === $connection_id ) {
			return null;
		}

		$connections = self::get( 'connections', array() );
		if ( ! is_array( $connections ) || ! isset( $connections[ $connection_id ] ) || ! is_array( $connections[ $connection_id ] ) ) {
			return null;
		}

		$connection = $connections[ $connection_id ];
		$from_email = trim( (string) ( $connection['from_email'] ?? '' ) );
		if ( '' === $from_email ) {
			return null;
		}

		return array(
			'from_email' => $from_email,
			'from_name'  => (string) ( $connection['from_name'] ?? '' ),
		);
	}

	/**
	 * Whether the current user may access built-in SMTP REST routes (settings, logs, tests).
	 *
	 * @return bool
	 */
	public static function user_can_manage_smtp_rest() {
		return current_user_can( 'manage_options' ) || current_user_can( 'doublescale_crm_manager' );
	}

	/**
	 * Copy OAuth client credentials from bundled connection rows into legacy mailer option keys
	 * (`doublescale_smtp_{mailer}_settings['app']`). Gmail/Outlook/Zoho admin OAuth handlers
	 * (`admin.php?smtp-gmail=authorize`, etc.) read credentials only from those options, not from
	 * {@see self::OPTION_NAME} connection payloads.
	 *
	 * Preference when multiple connections use one mailer: default_connection if it matches that
	 * mailer and has oauth_app; otherwise the first matching connection with oauth_app keys set.
	 *
	 * @since 1.0.0
	 *
	 * @param array $bundle Full SMTP settings (connections, default_connection, …).
	 * @return void
	 */
	public static function sync_oauth_apps_from_bundle( array $bundle ) {
		$connections = isset( $bundle['connections'] ) && is_array( $bundle['connections'] )
			? $bundle['connections']
			: array();

		foreach ( array( 'gmail', 'outlook', 'zoho' ) as $slug ) {
			$oauth = self::extract_oauth_app_for_mailer(
				$connections,
				isset( $bundle['default_connection'] ) ? (string) $bundle['default_connection'] : '',
				$slug
			);
			// Connection JSON may omit client_secret; reuse the secret already stored for this client_id.
			if ( ! empty( $oauth['client_id'] ) && empty( $oauth['client_secret'] ) ) {
				$opt_key   = 'doublescale_smtp_' . $slug . '_settings';
				$prev_mail = get_option( $opt_key, array() );
				$pre_app   = ( is_array( $prev_mail ) && isset( $prev_mail['app'] ) && is_array( $prev_mail['app'] ) )
					? $prev_mail['app']
					: array();
				$pre_id    = isset( $pre_app['client_id'] ) ? (string) $pre_app['client_id'] : '';
				$pre_cs    = isset( $pre_app['client_secret'] ) ? trim( (string) $pre_app['client_secret'] ) : '';
				if ( $pre_cs !== '' && $pre_id === (string) $oauth['client_id'] ) {
					$oauth['client_secret'] = (string) $pre_app['client_secret'];
				}
			}
			if ( empty( $oauth['client_id'] ) || empty( $oauth['client_secret'] ) ) {
				continue;
			}

			$option_key = 'doublescale_smtp_' . $slug . '_settings';
			$prev       = get_option( $option_key, array() );
			if ( ! is_array( $prev ) ) {
				$prev = array();
			}

			$app = array(
				'client_id'     => (string) $oauth['client_id'],
				'client_secret' => (string) $oauth['client_secret'],
			);

			if ( 'zoho' === $slug ) {
				$region        = isset( $oauth['region'] ) ? (string) $oauth['region'] : '';
				$app['region'] = '' !== $region ? $region : 'com';
			}

			$existing = isset( $prev['app'] ) && is_array( $prev['app'] ) ? $prev['app'] : array();
			if ( wp_json_encode( $existing ) === wp_json_encode( $app ) ) {
				continue;
			}

			$prev['app'] = $app;
			update_option( $option_key, $prev );
		}
	}

	/**
	 * Pick oauth_app array from connections for a mailer slug.
	 *
	 * @param array  $connections           Connection id => row.
	 * @param string $default_connection_id Default routing connection key.
	 * @param string $mailer_slug           gmail|outlook|zoho.
	 * @return array{client_id?:string,client_secret?:string,region?:string}
	 */
	private static function extract_oauth_app_for_mailer( array $connections, string $default_connection_id, string $mailer_slug ) {
		if ( '' !== $default_connection_id && isset( $connections[ $default_connection_id ] ) ) {
			$row = $connections[ $default_connection_id ];
			if ( is_array( $row ) && self::connection_has_oauth_app_for_mailer( $row, $mailer_slug ) ) {
				return self::normalize_oauth_app_row( $row['oauth_app'] );
			}
		}

		foreach ( $connections as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			if ( self::connection_has_oauth_app_for_mailer( $row, $mailer_slug ) ) {
				return self::normalize_oauth_app_row( $row['oauth_app'] );
			}
		}

		return array();
	}

	/**
	 * @param array  $connection Connection row.
	 * @param string $mailer_slug gmail|outlook|zoho.
	 */
	private static function connection_has_oauth_app_for_mailer( array $connection, string $mailer_slug ) {
		if ( ( $connection['mailer'] ?? '' ) !== $mailer_slug ) {
			return false;
		}
		$app = $connection['oauth_app'] ?? array();
		if ( ! is_array( $app ) ) {
			return false;
		}
		// client_secret is often omitted in stored bundles (masked); sync backfills from mailer options.
		return ! empty( $app['client_id'] );
	}

	/**
	 * @param mixed $oauth_app Raw oauth_app from JSON.
	 * @return array{client_id?:string,client_secret?:string,region?:string}
	 */
	private static function normalize_oauth_app_row( $oauth_app ) {
		if ( ! is_array( $oauth_app ) ) {
			return array();
		}
		$out = array(
			'client_id'     => isset( $oauth_app['client_id'] ) ? (string) $oauth_app['client_id'] : '',
			'client_secret' => isset( $oauth_app['client_secret'] ) ? (string) $oauth_app['client_secret'] : '',
		);
		if ( isset( $oauth_app['region'] ) ) {
			$out['region'] = (string) $oauth_app['region'];
		}
		return $out;
	}
}
