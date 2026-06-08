<?php
/**
 * Attachment upload, linking, signed download, and temp cleanup.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Support\Models\AttachmentModel;
use DoubleScale\Modules\Support\Models\TicketModel;
use WP_Error;

/**
 * AttachmentService class.
 */
class AttachmentService {

	/**
	 * Default allowed MIME types when no filter overrides.
	 *
	 * @var string[]
	 */
	private const DEFAULT_MIMES = array(
		'image/jpeg',
		'image/png',
		'image/gif',
		'image/webp',
		'application/pdf',
		'text/plain',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/zip',
	);

	/**
	 * Accepted MIME types for ticket uploads.
	 *
	 * @return string[]
	 */
	public static function accepted_mimes(): array {
		$mimes = apply_filters( 'doublescale_support_accepted_ticket_mimes', self::DEFAULT_MIMES );
		return is_array( $mimes ) ? array_values( array_filter( array_map( 'strval', $mimes ) ) ) : self::DEFAULT_MIMES;
	}

	/**
	 * Store an uploaded file as a temp attachment row.
	 *
	 * `$ticket_id` may be 0 to upload before the ticket exists (the
	 * compose-a-new-ticket flow). The row is then created with `ticket_id = NULL`
	 * and back-filled when {@see link_to_activity()} runs at ticket-create time.
	 *
	 * @param array<string, mixed> $file      PHP upload array (`name`, `tmp_name`, `size`, `type`).
	 * @param int                  $ticket_id Parent ticket id, or 0 for a ticketless temp upload.
	 * @param array<string, mixed> $uploader  `user_id` and/or `contact_id`.
	 * @return AttachmentModel|WP_Error
	 */
	public function store_upload( array $file, int $ticket_id, array $uploader ) {
		if ( empty( $file['tmp_name'] ) || ! is_uploaded_file( $file['tmp_name'] ) ) {
			return new WP_Error( 'invalid_upload', __( 'No file was uploaded.', 'doublescale' ), array( 'status' => 400 ) );
		}

		// A ticket id of 0 means "uploaded before the ticket exists" — the row is
		// created unticketed and linked at create time. A non-zero id must resolve.
		if ( $ticket_id > 0 && ! TicketModel::find( $ticket_id ) ) {
			return new WP_Error( 'ticket_not_found', __( 'Ticket not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$max_size  = wp_max_upload_size();
		$file_size = isset( $file['size'] ) ? (int) $file['size'] : 0;
		if ( $max_size > 0 && $file_size > $max_size ) {
			return new WP_Error(
				'file_too_large',
				sprintf(
					/* translators: %s: maximum upload size */
					__( 'File exceeds the maximum upload size of %s.', 'doublescale' ),
					size_format( $max_size )
				),
				array( 'status' => 400 )
			);
		}

		$original_name = sanitize_file_name( (string) ( $file['name'] ?? 'file' ) );

		$mime = $this->detect_mime( (string) $file['tmp_name'], (string) ( $file['type'] ?? '' ) );
		if ( ! in_array( $mime, self::accepted_mimes(), true ) ) {
			return new WP_Error( 'invalid_mime', __( 'This file type is not allowed.', 'doublescale' ), array( 'status' => 400 ) );
		}

		// Belt-and-braces over the MIME check: reject a file whose extension is not
		// one WordPress maps to an accepted MIME (e.g. a `.php` renamed to sneak
		// past content sniffing). Serve-side `X-Content-Type-Options: nosniff` is
		// the second line; this is the first.
		if ( ! $this->extension_is_allowed( $original_name ) ) {
			return new WP_Error( 'invalid_extension', __( 'This file type is not allowed.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$upload_dir = wp_upload_dir( null, false, false );
		if ( ! is_array( $upload_dir ) || empty( $upload_dir['basedir'] ) ) {
			return new WP_Error( 'upload_dir_unavailable', __( 'Upload directory is unavailable.', 'doublescale' ), array( 'status' => 500 ) );
		}

		$subdir     = 'doublescale-support/' . gmdate( 'Y' ) . '/' . gmdate( 'm' );
		$target_dir = trailingslashit( $upload_dir['basedir'] ) . $subdir;
		if ( ! wp_mkdir_p( $target_dir ) ) {
			$this->log_storage_failure( 'Could not create the support upload directory', $target_dir );
			return new WP_Error( 'mkdir_failed', __( 'Could not create upload directory.', 'doublescale' ), array( 'status' => 500 ) );
		}
		$this->ensure_protected_dir( (string) $upload_dir['basedir'] );

		$stored_name = wp_unique_filename( $target_dir, $original_name );
		$absolute    = trailingslashit( $target_dir ) . $stored_name;
		$relative    = $subdir . '/' . $stored_name;

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_uploaded_file,WordPress.WP.AlternativeFunctions.file_system_operations_move_uploaded_file -- validated via is_uploaded_file above.
		if ( ! move_uploaded_file( $file['tmp_name'], $absolute ) ) {
			// Almost always a permissions problem: the web-server user can't write
			// into the target dir (e.g. the dir was created by a different user).
			// Log the dir + its writability so it's diagnosable from the logger
			// table rather than only PHP's debug.log.
			$this->log_storage_failure( 'Failed to move the uploaded support file into place', $target_dir );
			return new WP_Error( 'move_failed', __( 'Failed to store the uploaded file.', 'doublescale' ), array( 'status' => 500 ) );
		}

		$attachment = AttachmentModel::create(
			array(
				'ticket_id'   => $ticket_id > 0 ? $ticket_id : null,
				'activity_id' => null,
				'user_id'     => ! empty( $uploader['user_id'] ) ? (int) $uploader['user_id'] : null,
				'contact_id'  => ! empty( $uploader['contact_id'] ) ? (int) $uploader['contact_id'] : null,
				'file_name'   => $original_name,
				'file_path'   => $relative,
				'file_type'   => $mime,
				'file_size'   => $file_size > 0 ? $file_size : (int) filesize( $absolute ),
				'driver'      => 'local',
				'status'      => 'temp',
			)
		);

		return $attachment;
	}

	/**
	 * Activate temp attachments and link them to a conversation activity.
	 *
	 * @param int      $activity_id Activity row id.
	 * @param int      $ticket_id   Parent ticket id.
	 * @param string[] $file_hashes Temp attachment hashes from the client.
	 * @return void
	 */
	public function link_to_activity( int $activity_id, int $ticket_id, array $file_hashes ): void {
		$hashes = array_values( array_filter( array_map( 'strval', $file_hashes ) ) );
		if ( empty( $hashes ) ) {
			return;
		}

		// Accept rows that were uploaded against this ticket (reply composer) OR
		// uploaded before any ticket existed (compose-a-new-ticket flow, where the
		// temp row carries `ticket_id = NULL`). The nested closure keeps the OR
		// scoped to the ticket clause so it can't widen past the status/hash guards.
		$rows = AttachmentModel::query()
			->where( 'status', 'temp' )
			->whereIn( 'file_hash', $hashes )
			->where(
				function ( $query ) use ( $ticket_id ) {
					$query->where( 'ticket_id', $ticket_id )->orWhereNull( 'ticket_id' );
				}
			)
			->get();

		foreach ( $rows as $attachment ) {
			$attachment->ticket_id   = $ticket_id;
			$attachment->activity_id = $activity_id;
			$attachment->status      = 'active';
			$attachment->save();
		}
	}

	/**
	 * Verify signature and stream a local attachment file.
	 *
	 * @param string $file_hash File hash query arg.
	 * @param string $sign      HMAC signature query arg.
	 * @return void
	 */
	public function serve( string $file_hash, string $sign ): void {
		$attachment = AttachmentModel::get_by_hash( $file_hash );
		if ( ! $attachment || 'active' !== (string) $attachment->status ) {
			wp_die( esc_html__( 'File not found.', 'doublescale' ), esc_html__( 'Not Found', 'doublescale' ), array( 'response' => 404 ) );
		}

		if ( ! $this->verify_signature( (int) $attachment->id, $sign ) ) {
			wp_die(
				esc_html__( 'Invalid or expired download link. Please reload the page and try again.', 'doublescale' ),
				esc_html__( 'Forbidden', 'doublescale' ),
				array( 'response' => 403 )
			);
		}

		$absolute = AttachmentModel::resolve_absolute_path( (string) $attachment->file_path );
		if ( '' === $absolute || ! is_file( $absolute ) ) {
			wp_die( esc_html__( 'File not found.', 'doublescale' ), esc_html__( 'Not Found', 'doublescale' ), array( 'response' => 404 ) );
		}

		$filename = (string) $attachment->file_name;
		$mime     = (string) $attachment->file_type;

		// Images are served inline so the conversation thread can render them as
		// <img src="signed-url"> thumbnails/previews; every other type is forced
		// to download. `X-Content-Type-Options: nosniff` below stops the browser
		// from re-interpreting a non-image as something executable, so serving a
		// validated image inline is safe.
		$disposition = $this->is_inline_displayable( $mime ) ? 'inline' : 'attachment';

		header( 'Content-Type: ' . $mime );
		header( 'Content-Disposition: ' . $disposition . '; filename="' . rawurlencode( $filename ) . '"' );
		header( 'Content-Length: ' . (string) filesize( $absolute ) );
		header( 'X-Content-Type-Options: nosniff' );
		$this->stream_file_chunked( $absolute );
		exit;
	}

	/**
	 * Stream a file to the browser in 1 MB chunks.
	 *
	 * Reading the whole file into memory (`readfile()` buffers internally on some
	 * SAPIs) can exhaust `memory_limit` on a large attachment. Chunked `fread` +
	 * `flush` keeps the footprint flat regardless of file size, so a 50 MB upload
	 * downloads fine on a memory-constrained host. Caller is responsible for
	 * headers and for having validated the path.
	 *
	 * @param string $absolute Absolute path to a verified, existing file.
	 * @return void
	 */
	private function stream_file_chunked( string $absolute ): void {
		$chunk_size = 1024 * 1024;

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- streaming a verified local file to the browser; WP_Filesystem cannot stream.
		$handle = fopen( $absolute, 'rb' );
		if ( false === $handle ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile -- fallback for the rare case fopen fails.
			readfile( $absolute );
			return;
		}

		// Drop any buffering so chunks flush straight to the client rather than
		// re-accumulating in an output buffer (which would defeat the point).
		while ( ob_get_level() > 0 ) {
			ob_end_flush();
		}

		while ( ! feof( $handle ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fread -- streaming a verified local file to the browser.
			$buffer = fread( $handle, $chunk_size );
			if ( false === $buffer ) {
				break;
			}
			echo $buffer; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- raw binary file bytes; escaping would corrupt the download.
			flush();
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- closing the stream handle opened above.
		fclose( $handle );
	}

	/**
	 * Build a signed download URL for an attachment.
	 *
	 * @param AttachmentModel $attachment Attachment model.
	 * @return string
	 */
	public function signed_url( AttachmentModel $attachment ): string {
		$sign = $this->generate_signature( (int) $attachment->id );
		return add_query_arg(
			array(
				'ds_support_file' => (string) $attachment->file_hash,
				'ds_support_sign' => $sign,
			),
			home_url( '/' )
		);
	}

	/**
	 * Shape attachments for REST conversation payloads.
	 *
	 * @param AttachmentModel $attachment Attachment model.
	 * @return array{file_name: string, file_size: int, file_type: string, url: string}
	 */
	public function shape_for_api( AttachmentModel $attachment ): array {
		return array(
			'file_name' => (string) $attachment->file_name,
			'file_size' => (int) $attachment->file_size,
			'file_type' => (string) $attachment->file_type,
			'url'       => $this->signed_url( $attachment ),
		);
	}

	/**
	 * Eager-load active attachments keyed by activity id.
	 *
	 * @param int[] $activity_ids Activity ids.
	 * @return array<int, array<int, array<string, mixed>>>
	 */
	public function map_for_activities( array $activity_ids ): array {
		$ids = array_values( array_filter( array_map( 'intval', $activity_ids ) ) );
		if ( empty( $ids ) ) {
			return array();
		}

		$rows = AttachmentModel::query()
			->whereIn( 'activity_id', $ids )
			->where( 'status', 'active' )
			->get();

		$map = array();
		foreach ( $rows as $attachment ) {
			$aid = (int) $attachment->activity_id;
			if ( ! isset( $map[ $aid ] ) ) {
				$map[ $aid ] = array();
			}
			$map[ $aid ][] = $this->shape_for_api( $attachment );
		}
		return $map;
	}

	/**
	 * Delete temp attachments older than 24 hours.
	 *
	 * @return int Number of rows deleted.
	 */
	public function cleanup_stale_temp(): int {
		$cutoff = gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS );
		$rows   = AttachmentModel::query()
			->where( 'status', 'temp' )
			->where( 'created_at', '<', $cutoff )
			->get();

		$count = 0;
		foreach ( $rows as $row ) {
			$row->delete();
			++$count;
		}
		return $count;
	}

	/**
	 * Resolve absolute paths for active attachments on an activity (email).
	 *
	 * @param int $activity_id Activity id.
	 * @return string[]
	 */
	public function absolute_paths_for_activity( int $activity_id ): array {
		$rows = AttachmentModel::query()
			->where( 'activity_id', $activity_id )
			->where( 'status', 'active' )
			->get();

		$paths = array();
		foreach ( $rows as $attachment ) {
			$absolute = AttachmentModel::resolve_absolute_path( (string) $attachment->file_path );
			if ( '' !== $absolute && is_file( $absolute ) ) {
				$paths[] = $absolute;
			}
		}
		return $paths;
	}

	/**
	 * Verify a download signature against the current OR previous hour bucket.
	 *
	 * The signature embeds `gmdate('YmdH')`, so it rotates hourly. Accepting the
	 * previous bucket too gives a download link emailed to a customer a grace
	 * window across the hour boundary — without it, a link clicked at 11:01 that
	 * was signed at 10:59 would 403.
	 *
	 * @param int    $attachment_id Attachment row id.
	 * @param string $sign          Client-provided signature.
	 * @return bool
	 */
	private function verify_signature( int $attachment_id, string $sign ): bool {
		if ( '' === $sign ) {
			return false;
		}
		foreach ( array( gmdate( 'YmdH' ), gmdate( 'YmdH', time() - HOUR_IN_SECONDS ) ) as $bucket ) {
			if ( hash_equals( $this->generate_signature( $attachment_id, $bucket ), $sign ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @param int         $attachment_id Attachment row id.
	 * @param string|null $bucket        Hour bucket (`YmdH`); defaults to the current hour.
	 * @return string
	 */
	private function generate_signature( int $attachment_id, ?string $bucket = null ): string {
		$bucket = null === $bucket ? gmdate( 'YmdH' ) : $bucket;
		return hash_hmac( 'sha256', $attachment_id . '|' . $bucket, wp_salt( 'secure_auth' ) );
	}

	/**
	 * Log a file-storage failure with the directory and its writability.
	 *
	 * The common cause is a permissions/ownership mismatch — the web-server user
	 * cannot write into `uploads/doublescale-support/...` (e.g. the dir was first
	 * created by a CLI/other user). Recording `dir_exists` / `dir_writable` makes
	 * that obvious without shelling into the box.
	 *
	 * @param string $message    Human-readable summary.
	 * @param string $target_dir Absolute target directory.
	 * @return void
	 */
	private function log_storage_failure( string $message, string $target_dir ): void {
		if ( ! function_exists( 'doublescale_get_logger' ) ) {
			return;
		}
		doublescale_get_logger()->error(
			$message,
			array(
				'source'       => 'support-attachment-service',
				'target_dir'   => $target_dir,
				'dir_exists'   => is_dir( $target_dir ),
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable -- read-only diagnostic for the log; WP_Filesystem is unavailable on the REST/IMAP path and adds no value for a writability probe.
				'dir_writable' => is_writable( $target_dir ),
			)
		);
	}

	/**
	 * Whether a MIME type is safe to serve with `Content-Disposition: inline`
	 * (i.e. the browser should render it in-place rather than download it). Only
	 * raster image types the conversation UI previews as thumbnails — paired with
	 * `X-Content-Type-Options: nosniff` so a mislabeled file can't be reinterpreted.
	 *
	 * @param string $mime MIME type from the stored attachment row.
	 * @return bool
	 */
	private function is_inline_displayable( string $mime ): bool {
		$inline = array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp' );
		return in_array( strtolower( $mime ), $inline, true );
	}

	/**
	 * @param string $path         Temp file path.
	 * @param string $declared_mime Declared MIME from the client.
	 * @return string
	 */
	private function detect_mime( string $path, string $declared_mime ): string {
		$detected = '';
		if ( function_exists( 'wp_check_filetype_and_ext' ) ) {
			$checked = wp_check_filetype_and_ext( $path, basename( $path ) );
			if ( is_array( $checked ) && ! empty( $checked['type'] ) ) {
				$detected = (string) $checked['type'];
			}
		}
		if ( '' === $detected && function_exists( 'mime_content_type' ) ) {
			$detected = (string) mime_content_type( $path );
		}
		if ( '' === $detected ) {
			$detected = sanitize_mime_type( $declared_mime );
		}
		return $detected;
	}

	/**
	 * Whether a filename's extension maps (via WordPress) to one of the accepted
	 * MIME types. Extension-less names are allowed (the MIME check still gates
	 * them); a name WHOSE extension WP knows but isn't in our accepted set is
	 * rejected.
	 *
	 * @param string $file_name Original (sanitized) filename.
	 * @return bool
	 */
	private function extension_is_allowed( string $file_name ): bool {
		$check = wp_check_filetype( $file_name );
		$type  = isset( $check['type'] ) ? (string) $check['type'] : '';
		if ( '' === $type ) {
			// WP doesn't recognise the extension (or there is none). Let the MIME
			// detection in store_upload() be the gate rather than blocking outright.
			return true;
		}
		return in_array( $type, self::accepted_mimes(), true );
	}

	/**
	 * Drop a `.htaccess` (deny + no PHP execution) and an `index.html` into the
	 * support uploads BASE dir so the private files cannot be fetched directly by
	 * guessing the path (which would bypass the signed-URL handler) on Apache, and
	 * the directory cannot be listed. Idempotent — skips when the files exist.
	 *
	 * @param string $basedir WordPress uploads basedir (absolute).
	 * @return void
	 */
	private function ensure_protected_dir( string $basedir ): void {
		if ( '' === $basedir ) {
			return;
		}
		$base = trailingslashit( $basedir ) . 'doublescale-support';
		if ( ! is_dir( $base ) ) {
			return;
		}

		$htaccess = $base . '/.htaccess';
		if ( ! file_exists( $htaccess ) ) {
			$rules = "# Generated by DoubleScale Support. Do not edit.\n"
				. "Deny from all\n"
				. "Options -Indexes\n"
				. "<IfModule mod_php5.c>\n  php_flag engine off\n</IfModule>\n"
				. "<IfModule mod_php7.c>\n  php_flag engine off\n</IfModule>\n"
				. "<Files *>\n  SetHandler none\n  RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .pl .py .cgi\n</Files>\n";
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents,WordPress.PHP.NoSilencedErrors.Discouraged -- WP_Filesystem is unavailable on this REST/IMAP path; writing one hardening file into this plugin's own private uploads dir.
			@file_put_contents( $htaccess, $rules );
		}

		$index = $base . '/index.html';
		if ( ! file_exists( $index ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents,WordPress.PHP.NoSilencedErrors.Discouraged -- see above; a blank directory-listing guard.
			@file_put_contents( $index, '' );
		}
	}

	/**
	 * Store an email attachment (raw bytes, not a `$_FILES` upload) and link it to
	 * an existing conversation activity in one step.
	 *
	 * Used by the inbound email pipeline: by the time a message is parsed the
	 * ticket and its opening/reply activity already exist, so the file is written
	 * straight as `active` (no temp phase). MIME + extension are validated the same
	 * way as a web upload; anything not allowed is skipped (returns WP_Error) so a
	 * hostile attachment can't be stored.
	 *
	 * @param array<string, mixed> $file        `filename`, `mime`, `content` (decoded bytes), optional `content_id` (inline images).
	 * @param int                  $ticket_id   Parent ticket id.
	 * @param int                  $activity_id Conversation activity id to link to.
	 * @param array<string, mixed> $uploader    Optional `user_id`/`contact_id` (empty for customer email).
	 * @return AttachmentModel|WP_Error
	 */
	public function store_email_attachment( array $file, int $ticket_id, int $activity_id, array $uploader = array() ) {
		$content = isset( $file['content'] ) ? (string) $file['content'] : '';
		if ( '' === $content ) {
			return new WP_Error( 'empty_attachment', __( 'Empty attachment.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$original_name = sanitize_file_name( (string) ( $file['filename'] ?? 'file' ) );
		if ( '' === $original_name ) {
			$original_name = 'file';
		}

		if ( ! $this->extension_is_allowed( $original_name ) ) {
			return new WP_Error( 'invalid_extension', __( 'This file type is not allowed.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$upload_dir = wp_upload_dir( null, false, false );
		if ( ! is_array( $upload_dir ) || empty( $upload_dir['basedir'] ) ) {
			return new WP_Error( 'upload_dir_unavailable', __( 'Upload directory is unavailable.', 'doublescale' ), array( 'status' => 500 ) );
		}

		$subdir     = 'doublescale-support/' . gmdate( 'Y' ) . '/' . gmdate( 'm' );
		$target_dir = trailingslashit( $upload_dir['basedir'] ) . $subdir;
		if ( ! wp_mkdir_p( $target_dir ) ) {
			$this->log_storage_failure( 'Could not create the support upload directory (email attachment)', $target_dir );
			return new WP_Error( 'mkdir_failed', __( 'Could not create upload directory.', 'doublescale' ), array( 'status' => 500 ) );
		}
		$this->ensure_protected_dir( (string) $upload_dir['basedir'] );

		$stored_name = wp_unique_filename( $target_dir, $original_name );
		$absolute    = trailingslashit( $target_dir ) . $stored_name;
		$relative    = $subdir . '/' . $stored_name;

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- WP_Filesystem is unavailable on the IMAP poll path; writing decoded email-attachment bytes into this plugin's private uploads dir.
		if ( false === file_put_contents( $absolute, $content ) ) {
			$this->log_storage_failure( 'Failed to write the email attachment to disk', $target_dir );
			return new WP_Error( 'write_failed', __( 'Failed to store the email attachment.', 'doublescale' ), array( 'status' => 500 ) );
		}

		// Validate the MIME from the bytes now on disk (don't trust the header).
		$mime = $this->detect_mime( $absolute, isset( $file['mime'] ) ? (string) $file['mime'] : '' );
		if ( ! in_array( $mime, self::accepted_mimes(), true ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink,WordPress.PHP.NoSilencedErrors.Discouraged -- clean up the rejected file we just wrote.
			@unlink( $absolute );
			return new WP_Error( 'invalid_mime', __( 'This file type is not allowed.', 'doublescale' ), array( 'status' => 400 ) );
		}

		return AttachmentModel::create(
			array(
				'ticket_id'   => $ticket_id,
				'activity_id' => $activity_id,
				'user_id'     => ! empty( $uploader['user_id'] ) ? (int) $uploader['user_id'] : null,
				'contact_id'  => ! empty( $uploader['contact_id'] ) ? (int) $uploader['contact_id'] : null,
				'file_name'   => $original_name,
				'file_path'   => $relative,
				'file_type'   => $mime,
				'file_size'   => strlen( $content ),
				'content_id'  => isset( $file['content_id'] ) && '' !== (string) $file['content_id']
					? trim( (string) $file['content_id'], " <>\t\r\n" )
					: null,
				'driver'      => 'local',
				'status'      => 'active',
			)
		);
	}

	/**
	 * Rewrite inline-image references in an email body to served attachment URLs.
	 *
	 * An inbound HTML email references its inline images by Content-ID, e.g.
	 * `<img src="cid:ii_abc123">`. The matching bytes are stored as `active`
	 * attachments carrying that `content_id`. This swaps each `cid:` (or the bare
	 * Content-ID that {@see wp_kses_post()} leaves behind once it strips the
	 * unknown `cid:` scheme) for the attachment's signed download URL so the image
	 * renders in the conversation thread instead of breaking.
	 *
	 * Returns the body unchanged when the activity has no Content-ID-bearing
	 * attachments (the common case), so it is cheap to call on every inbound
	 * message.
	 *
	 * @param string $body        Email body HTML (already sanitized or raw).
	 * @param int    $activity_id Conversation activity the attachments are linked to.
	 * @return string Body with inline image src attributes rewritten.
	 */
	public function rewrite_inline_image_srcs( string $body, int $activity_id ): string {
		if ( '' === $body || $activity_id <= 0 ) {
			return $body;
		}

		$rows = AttachmentModel::query()
			->where( 'activity_id', $activity_id )
			->where( 'status', 'active' )
			->whereNotNull( 'content_id' )
			->get();

		if ( $rows->isEmpty() ) {
			return $body;
		}

		$map = array();
		foreach ( $rows as $attachment ) {
			$cid = trim( (string) $attachment->content_id, " <>\t\r\n" );
			if ( '' !== $cid ) {
				$map[ $cid ] = $this->signed_url( $attachment );
			}
		}
		if ( empty( $map ) ) {
			return $body;
		}

		// Match the `src` value of an <img> whether it still carries the `cid:`
		// scheme (raw inbound HTML) or just the bare Content-ID (after kses has
		// stripped the unknown scheme). Capture the quote char so we re-emit it.
		return (string) preg_replace_callback(
			'/(<img\b[^>]*?\bsrc=)(["\'])(?:cid:)?([^"\']+)\2/i',
			static function ( $matches ) use ( $map ) {
				$ref = trim( $matches[3], " <>\t\r\n" );
				if ( isset( $map[ $ref ] ) ) {
					return $matches[1] . $matches[2] . esc_url( $map[ $ref ] ) . $matches[2];
				}
				return $matches[0];
			},
			$body
		);
	}
}
