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
	 * @param array<string, mixed> $file      PHP upload array (`name`, `tmp_name`, `size`, `type`).
	 * @param int                  $ticket_id Parent ticket id.
	 * @param array<string, mixed> $uploader  `user_id` and/or `contact_id`.
	 * @return AttachmentModel|WP_Error
	 */
	public function store_upload( array $file, int $ticket_id, array $uploader ) {
		if ( empty( $file['tmp_name'] ) || ! is_uploaded_file( $file['tmp_name'] ) ) {
			return new WP_Error( 'invalid_upload', __( 'No file was uploaded.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$ticket = TicketModel::find( $ticket_id );
		if ( ! $ticket ) {
			return new WP_Error( 'ticket_not_found', __( 'Ticket not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$max_size = wp_max_upload_size();
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

		$mime = $this->detect_mime( (string) $file['tmp_name'], (string) ( $file['type'] ?? '' ) );
		if ( ! in_array( $mime, self::accepted_mimes(), true ) ) {
			return new WP_Error( 'invalid_mime', __( 'This file type is not allowed.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$upload_dir = wp_upload_dir( null, false, false );
		if ( ! is_array( $upload_dir ) || empty( $upload_dir['basedir'] ) ) {
			return new WP_Error( 'upload_dir_unavailable', __( 'Upload directory is unavailable.', 'doublescale' ), array( 'status' => 500 ) );
		}

		$subdir    = 'doublescale-support/' . gmdate( 'Y' ) . '/' . gmdate( 'm' );
		$target_dir = trailingslashit( $upload_dir['basedir'] ) . $subdir;
		if ( ! wp_mkdir_p( $target_dir ) ) {
			return new WP_Error( 'mkdir_failed', __( 'Could not create upload directory.', 'doublescale' ), array( 'status' => 500 ) );
		}

		$original_name = sanitize_file_name( (string) ( $file['name'] ?? 'file' ) );
		$stored_name   = wp_unique_filename( $target_dir, $original_name );
		$absolute      = trailingslashit( $target_dir ) . $stored_name;
		$relative      = $subdir . '/' . $stored_name;

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_uploaded_file,WordPress.WP.AlternativeFunctions.file_system_operations_move_uploaded_file -- validated via is_uploaded_file above.
		if ( ! move_uploaded_file( $file['tmp_name'], $absolute ) ) {
			return new WP_Error( 'move_failed', __( 'Failed to store the uploaded file.', 'doublescale' ), array( 'status' => 500 ) );
		}

		$attachment = AttachmentModel::create(
			array(
				'ticket_id'   => $ticket_id,
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

		$rows = AttachmentModel::query()
			->where( 'ticket_id', $ticket_id )
			->where( 'status', 'temp' )
			->whereIn( 'file_hash', $hashes )
			->get();

		foreach ( $rows as $attachment ) {
			$attachment->activity_id = $activity_id;
			$attachment->status        = 'active';
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

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile -- streaming a verified local file.
		header( 'Content-Type: ' . $mime );
		header( 'Content-Disposition: attachment; filename="' . rawurlencode( $filename ) . '"' );
		header( 'Content-Length: ' . (string) filesize( $absolute ) );
		header( 'X-Content-Type-Options: nosniff' );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile
		readfile( $absolute );
		exit;
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
	 * @param int    $attachment_id Attachment row id.
	 * @param string $sign          Client-provided signature.
	 * @return bool
	 */
	private function verify_signature( int $attachment_id, string $sign ): bool {
		if ( '' === $sign ) {
			return false;
		}
		$expected = $this->generate_signature( $attachment_id );
		return hash_equals( $expected, $sign );
	}

	/**
	 * @param int $attachment_id Attachment row id.
	 * @return string
	 */
	private function generate_signature( int $attachment_id ): string {
		return hash_hmac( 'sha256', $attachment_id . '|' . gmdate( 'YmdH' ), wp_salt( 'secure_auth' ) );
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
}
