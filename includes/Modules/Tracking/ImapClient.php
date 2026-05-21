<?php
/**
 * IMAP Client
 * Thin wrapper around php-imap2 (javanile/php-imap2) for email polling.
 * Supports both basic login and OAuth (XOAUTH2) authentication.
 * No ext-imap required — php-imap2 is pure PHP, but falls back to native
 * ext-imap automatically for non-OAuth connections when the extension is present.
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Tracking;

defined( 'ABSPATH' ) || exit;

/**
 * ImapClient class
 *
 * Connects to an IMAP mailbox, fetches unseen emails, and marks them as seen.
 * Used by EmailIncoming for polling-based email ingestion.
 */
class ImapClient {

	/**
	 * IMAP host
	 *
	 * @var string
	 */
	private $host;

	/**
	 * IMAP port
	 *
	 * @var int
	 */
	private $port;

	/**
	 * IMAP username
	 *
	 * @var string
	 */
	private $username;

	/**
	 * IMAP password (or OAuth access token when authentication is 'oauth')
	 *
	 * @var string
	 */
	private $password;

	/**
	 * Encryption type (ssl, tls, none)
	 *
	 * @var string
	 */
	private $encryption;

	/**
	 * Authentication type ('login' for basic auth, 'oauth' for XOAUTH2)
	 *
	 * @var string
	 */
	private $authentication;

	/**
	 * Whether to skip SSL certificate validation.
	 *
	 * Defaults to true for backward compatibility (many self-signed certs in use).
	 * Can be disabled via set_novalidate_cert(false) for stricter security.
	 *
	 * @var bool
	 */
	private $novalidate_cert = true;

	/**
	 * IMAP connection (Connection object from php-imap2, or native resource)
	 *
	 * @var \Javanile\Imap2\Connection|resource|false
	 */
	private $connection = false;

	/**
	 * Constructor
	 *
	 * @param string $host           IMAP server hostname.
	 * @param int    $port           IMAP port (default 993).
	 * @param string $username       IMAP username/email.
	 * @param string $password       IMAP password or OAuth access token.
	 * @param string $encryption     Encryption type: ssl, tls, or none.
	 * @param string $authentication Authentication type: 'login' or 'oauth'.
	 */
	public function __construct( $host, $port = 993, $username = '', $password = '', $encryption = 'ssl', $authentication = 'login' ) {
		$this->host           = $host;
		$this->port           = $port;
		$this->username       = $username;
		$this->password       = $password;
		$this->encryption     = $encryption;
		$this->authentication = $authentication;
	}

	/**
	 * Set whether to skip SSL certificate validation.
	 *
	 * @since 1.0.0
	 *
	 * @param bool $novalidate True to skip validation (less secure), false to enforce.
	 * @return $this
	 */
	public function set_novalidate_cert( $novalidate ) {
		$this->novalidate_cert = (bool) $novalidate;
		return $this;
	}

	/**
	 * Connect to the IMAP server
	 *
	 * @throws \RuntimeException If connection fails.
	 */
	public function connect() {
		$mailbox = $this->build_mailbox_string();
		$flags   = ( 'oauth' === $this->authentication ) ? OP_XOAUTH2 : 0;

		// Capture PHP warnings emitted by imap2_open (php-imap2 delegates to
		// native ext-imap when available, which reports errors as warnings).
		$captured_warnings = array();
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler
		set_error_handler(
			function ( $errno, $errstr ) use ( &$captured_warnings ) {
				$captured_warnings[] = $errstr;
				return true;
			}
		);

		$this->connection = imap2_open( $mailbox, $this->username, $this->password, $flags );

		restore_error_handler();

		if ( ! $this->connection ) {
			// Try imap2_errors() first, then fall back to captured PHP warnings.
			$errors = imap2_errors();

			if ( $errors && is_array( $errors ) ) {
				$error_message = implode( '; ', $errors );
			} elseif ( ! empty( $captured_warnings ) ) {
				// Clean up warning messages (remove function prefix for readability).
				$error_message = implode(
					'; ',
					array_map(
						function ( $w ) {
							// Strip "imap_open(): " or "imap2_open(): " prefix.
							return preg_replace( '/^imap2?_open\(\):\s*/i', '', $w );
						},
						$captured_warnings
					)
				);
			} else {
				$error_message = __( 'Unknown error — check server hostname, port, and encryption settings.', 'doublescale' );
			}

			throw new \RuntimeException(
				esc_html(
					sprintf(
					/* translators: %s: IMAP error message */
						__( 'Failed to connect to IMAP server: %s', 'doublescale' ),
						$error_message
					)
				)
			);
		}
	}

	/**
	 * Build the IMAP server reference string (without folder).
	 *
	 * @return string Server string like {imap.gmail.com:993/imap/ssl}
	 */
	private function build_server_string() {
		$flags = '/imap';

		switch ( $this->encryption ) {
			case 'ssl':
				$flags .= '/ssl';
				break;
			case 'tls':
				$flags .= '/tls';
				break;
			case 'none':
			default:
				$flags .= '/notls';
				break;
		}

		if ( $this->novalidate_cert ) {
			$flags .= '/novalidate-cert';
		}

		return '{' . $this->host . ':' . $this->port . $flags . '}';
	}

	/**
	 * Build the IMAP mailbox connection string
	 *
	 * @return string Mailbox string like {imap.gmail.com:993/imap/ssl}INBOX
	 */
	private function build_mailbox_string() {
		return $this->build_server_string() . 'INBOX';
	}

	/**
	 * Switch to a different mailbox folder on the existing connection.
	 *
	 * @since 1.0.0
	 *
	 * @param string $folder Folder name (e.g. '[Gmail]/Sent Mail', 'Sent Items').
	 * @return bool True on success, false on failure.
	 */
	public function open_folder( $folder ) {
		if ( ! $this->connection ) {
			return false;
		}

		$mailbox = $this->build_server_string() . $folder;

		// Suppress warnings — imap2_reopen emits them on invalid folder names.
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler
		set_error_handler( '__return_true' );
		$result = imap2_reopen( $this->connection, $mailbox );
		restore_error_handler();

		return (bool) $result;
	}

	/**
	 * List available mailbox folders.
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of folder name strings, or empty array on failure.
	 */
	public function list_folders() {
		if ( ! $this->connection ) {
			return array();
		}

		$server  = $this->build_server_string();
		$folders = imap2_list( $this->connection, $server, '*' );

		if ( ! $folders || ! is_array( $folders ) ) {
			return array();
		}

		// Strip the server prefix to return clean folder names.
		return array_map(
			function ( $folder ) use ( $server ) {
				return str_replace( $server, '', $folder );
			},
			$folders
		);
	}

	/**
	 * Decode a MIME-encoded header string
	 *
	 * Falls back to mb_decode_mimeheader() when the native imap_utf8() is unavailable.
	 *
	 * @param string $str MIME-encoded string.
	 * @return string Decoded string.
	 */
	private function decode_mime_header( $str ) {
		if ( function_exists( 'imap_utf8' ) ) {
			return imap_utf8( $str );
		}
		if ( function_exists( 'mb_decode_mimeheader' ) ) {
			return mb_decode_mimeheader( $str );
		}

		return $str;
	}

	/**
	 * Fetch unseen (unread) emails
	 *
	 * Processes up to $limit emails per call to avoid PHP timeouts
	 * when the mailbox contains many unread messages.
	 *
	 * @param int $limit Maximum number of emails to fetch per batch. Default 20.
	 * @return array Array of normalized email data arrays.
	 */
	public function fetch_unseen( $limit = 20 ) {
		if ( ! $this->connection ) {
			return array();
		}

		$emails = array();

		// Search for unseen messages by message number (not UID).
		// php-imap2 has bugs with FT_UID/SE_UID in several functions
		// (fetchbody, msgno, fetch_overview), so we work with message
		// numbers throughout and only resolve UIDs via imap2_uid().
		$msgnos = imap2_search( $this->connection, 'UNSEEN' );

		if ( ! $msgnos || ! is_array( $msgnos ) ) {
			return array();
		}

		// Process newest emails first (highest msgno) and cap at $limit
		// to avoid timeouts on large mailboxes.
		rsort( $msgnos );
		$msgnos = array_slice( $msgnos, 0, $limit );

		foreach ( $msgnos as $msgno ) {
			$email = $this->parse_email( $msgno );
			if ( $email ) {
				$emails[] = $email;
			}
		}

		return $emails;
	}

	/**
	 * Fetch recent emails regardless of seen/unseen status
	 *
	 * Searches for ALL emails since the given date. This catches emails
	 * that were marked as read by another client (e.g., Gmail web UI)
	 * before the poll could process them.
	 *
	 * Uses message numbers throughout due to php-imap2 UID bugs.
	 *
	 * @param string $since_date Date string parseable by strtotime (e.g., '-1 day').
	 * @param int    $limit      Maximum number of emails to fetch. Default 20.
	 * @return array Array of normalized email data arrays.
	 */
	public function fetch_recent( $since_date, $limit = 20 ) {
		if ( ! $this->connection ) {
			return array();
		}

		// IMAP SINCE uses date-only format: d-M-Y (e.g., "16-Feb-2026").
		$imap_date = gmdate( 'd-M-Y', strtotime( $since_date ) );
		$msgnos    = imap2_search( $this->connection, 'SINCE "' . $imap_date . '"' );

		if ( ! $msgnos || ! is_array( $msgnos ) ) {
			return array();
		}

		rsort( $msgnos );
		$msgnos = array_slice( $msgnos, 0, $limit );

		$emails = array();
		foreach ( $msgnos as $msgno ) {
			$email = $this->parse_email( $msgno );
			if ( $email ) {
				$emails[] = $email;
			}
		}

		return $emails;
	}

	/**
	 * Parse a single email by message number
	 *
	 * Uses message numbers throughout because php-imap2's FT_UID flag is
	 * broken for fetchbody/fetchstructure. Resolves the UID via imap2_uid()
	 * for the return value (needed by mark_as_seen).
	 *
	 * @param int $msgno IMAP message number.
	 * @return array|null Normalized email data or null on failure.
	 */
	private function parse_email( $msgno ) {
		$header_info = imap2_headerinfo( $this->connection, $msgno );
		if ( ! $header_info ) {
			return null;
		}

		// Parse From.
		$from_email = '';
		$from_name  = '';
		if ( ! empty( $header_info->from ) ) {
			$from       = $header_info->from[0];
			$from_email = $from->mailbox . '@' . $from->host;
			$from_name  = isset( $from->personal ) ? $this->decode_mime_header( $from->personal ) : '';
		}

		if ( empty( $from_email ) ) {
			return null;
		}

		// Parse To (primary recipient).
		$to_email = '';
		if ( ! empty( $header_info->to ) ) {
			$to       = $header_info->to[0];
			$to_email = $to->mailbox . '@' . $to->host;
		}

		// Parse all To + CC recipients for sent-folder sync (catches CC'd contacts).
		$all_recipients = array();
		if ( ! empty( $header_info->to ) ) {
			foreach ( $header_info->to as $recipient ) {
				if ( ! empty( $recipient->mailbox ) && ! empty( $recipient->host ) ) {
					$all_recipients[] = $recipient->mailbox . '@' . $recipient->host;
				}
			}
		}
		if ( ! empty( $header_info->cc ) ) {
			foreach ( $header_info->cc as $recipient ) {
				if ( ! empty( $recipient->mailbox ) && ! empty( $recipient->host ) ) {
					$all_recipients[] = $recipient->mailbox . '@' . $recipient->host;
				}
			}
		}

		// Parse Subject.
		$subject = isset( $header_info->subject ) ? $this->decode_mime_header( $header_info->subject ) : '';

		// Parse Message-ID and In-Reply-To from raw headers.
		// Use message number — php-imap2 fetchheader works reliably with FT_UID,
		// but use msgno for consistency with body fetching.
		$raw_header  = imap2_fetchheader( $this->connection, $msgno );
		$message_id  = '';
		$in_reply_to = '';

		if ( preg_match( '/^Message-ID:\s*(.+)$/mi', $raw_header, $m ) ) {
			$message_id = trim( $m[1] );
		}
		if ( preg_match( '/^In-Reply-To:\s*(.+)$/mi', $raw_header, $m ) ) {
			$in_reply_to = trim( $m[1] );
		}

		// Detect CRM-originated emails via the X-Plugin-Sent stamp.
		$crm_sent = (bool) preg_match( '/^X-Plugin-Sent:\s*/mi', $raw_header );

		// Resolve UID from message number (for mark_as_seen and deduplication).
		$uid = imap2_uid( $this->connection, $msgno );

		// Fallback: generate Message-ID if not present.
		// Use extra entropy (msgno + date) when imap2_uid returns false to
		// avoid collisions for same-sender, same-subject emails.
		if ( empty( $message_id ) ) {
			$header_date = isset( $header_info->date ) ? $header_info->date : '';
			$entropy     = ( false !== $uid ) ? $uid : ( $msgno . $header_date );
			$message_id  = '<imap-' . md5( $entropy . $from_email . $subject ) . '@' . wp_parse_url( home_url(), PHP_URL_HOST ) . '>';
		}

		// Parse body: prefer HTML, fall back to plain text.
		// Use message number — php-imap2's fetchbody does not work with FT_UID.
		$body = $this->get_email_body( $msgno );

		// Parse date.
		$date = isset( $header_info->date ) ? $header_info->date : '';

		return array(
			'uid'            => $uid,
			'from_email'     => $from_email,
			'from_name'      => $from_name,
			'to_email'       => $to_email,
			'all_recipients' => $all_recipients,
			'subject'        => $subject,
			'body'           => $body,
			'message_id'     => $message_id,
			'in_reply_to'    => $in_reply_to,
			'date'           => $date,
			'crm_sent'       => $crm_sent,
		);
	}

	/**
	 * Get email body content
	 *
	 * Recursively walks the MIME structure to find text/html or text/plain parts.
	 * Prefers HTML, falls back to plain text.
	 *
	 * Uses message number (not UID) because php-imap2's fetchbody does not
	 * work correctly with FT_UID flag.
	 *
	 * @param int $msgno IMAP message number.
	 * @return string Email body content.
	 */
	private function get_email_body( $msgno ) {
		$structure = imap2_fetchstructure( $this->connection, $msgno );

		if ( ! $structure ) {
			return '';
		}

		// Simple (non-multipart) message.
		if ( empty( $structure->parts ) ) {
			$body = imap2_fetchbody( $this->connection, $msgno, '1' );
			return $this->decode_body( $body, $structure->encoding ?? 0 );
		}

		// Multipart message — recursively find HTML or plain text part.
		$html_body  = '';
		$plain_body = '';

		$this->walk_parts( $msgno, $structure->parts, '', $html_body, $plain_body );

		// Prefer HTML body, fall back to plain text.
		return ! empty( $html_body ) ? $html_body : nl2br( esc_html( $plain_body ) );
	}

	/**
	 * Recursively walk MIME parts to extract text content
	 *
	 * Handles arbitrarily nested multipart structures (e.g.,
	 * multipart/mixed → multipart/alternative → text/html).
	 *
	 * @param int    $msgno       IMAP message number.
	 * @param array  $parts       Array of MIME part objects.
	 * @param string $prefix      Section prefix for nested parts (e.g., "1" for sub-parts of part 1).
	 * @param string &$html_body  Collected HTML body (by reference).
	 * @param string &$plain_body Collected plain text body (by reference).
	 */
	private function walk_parts( $msgno, $parts, $prefix, &$html_body, &$plain_body ) {
		foreach ( $parts as $index => $part ) {
			$section = $prefix ? $prefix . '.' . ( $index + 1 ) : (string) ( $index + 1 );
			$type    = $part->type ?? 0; // 0 = TEXT, 1 = MULTIPART
			$subtype = strtoupper( $part->subtype ?? '' );

			if ( 1 === $type && ! empty( $part->parts ) ) {
				// Multipart container — recurse into sub-parts.
				$this->walk_parts( $msgno, $part->parts, $section, $html_body, $plain_body );
				continue;
			}

			// Only interested in text parts.
			if ( 0 !== $type ) {
				continue;
			}

			$body    = imap2_fetchbody( $this->connection, $msgno, $section );
			$decoded = $this->decode_body( $body, $part->encoding ?? 0 );

			if ( 'HTML' === $subtype && empty( $html_body ) ) {
				$html_body = $decoded;
			} elseif ( 'PLAIN' === $subtype && empty( $plain_body ) ) {
				$plain_body = $decoded;
			}
		}
	}

	/**
	 * Decode email body based on encoding
	 *
	 * @param string $body     Encoded body content.
	 * @param int    $encoding IMAP encoding constant.
	 * @return string Decoded body.
	 */
	private function decode_body( $body, $encoding ) {
		switch ( $encoding ) {
			case 3: // BASE64
				$decoded = base64_decode( $body ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
				return false !== $decoded ? $decoded : $body;
			case 4: // QUOTED-PRINTABLE
				return quoted_printable_decode( $body );
			default:
				return $body;
		}
	}

	/**
	 * Count unseen (unread) emails in the mailbox
	 *
	 * @return int Number of unseen emails.
	 */
	public function count_unseen() {
		if ( ! $this->connection ) {
			return 0;
		}

		// Use message numbers (not SE_UID) for consistency with fetch_unseen(),
		// as php-imap2 has known bugs with UID-based flags.
		$msgnos = imap2_search( $this->connection, 'UNSEEN' );

		return $msgnos && is_array( $msgnos ) ? count( $msgnos ) : 0;
	}

	/**
	 * Mark an email as seen/read
	 *
	 * @param int $uid IMAP message UID.
	 * @return bool True on success.
	 */
	public function mark_as_seen( $uid ) {
		if ( ! $this->connection ) {
			return false;
		}

		return imap2_setflag_full( $this->connection, (string) $uid, '\\Seen', ST_UID );
	}

	/**
	 * Disconnect from the IMAP server
	 */
	public function disconnect() {
		if ( $this->connection ) {
			imap2_close( $this->connection );
			$this->connection = false;
		}
	}
}
