<?php
/**
 * Contract file upload and download helpers.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Models\ContractAttachmentModel;
use DoubleScale\Modules\Sales\Models\ContractModel;
use WP_Error;

/**
 * ContractAttachmentService class.
 */
final class ContractAttachmentService {

	/**
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
	 * @return string[]
	 */
	public static function accepted_mimes(): array {
		$mimes = apply_filters( 'doublescale_sales_contract_attachment_mimes', self::DEFAULT_MIMES );
		return is_array( $mimes ) ? array_values( array_filter( array_map( 'strval', $mimes ) ) ) : self::DEFAULT_MIMES;
	}

	/**
	 * @return int
	 */
	public static function max_file_size_bytes(): int {
		$max = (int) apply_filters( 'doublescale_sales_contract_attachment_max_bytes', 10 * 1024 * 1024 );
		return max( 0, $max );
	}

	/**
	 * @return int
	 */
	public static function max_files_per_contract(): int {
		$max = (int) apply_filters( 'doublescale_sales_contract_attachment_max_count', 20 );
		return max( 1, $max );
	}

	/**
	 * Limits surfaced to the admin uploader (mirrors support attachment caps).
	 *
	 * @return array{max_file_size_mb:int, max_file_size_bytes:int, max_file_count:int}
	 */
	public static function limits_payload(): array {
		$max_bytes  = self::max_file_size_bytes();
		$server_max = function_exists( 'wp_max_upload_size' ) ? (int) wp_max_upload_size() : 0;
		if ( $server_max > 0 && $max_bytes > $server_max ) {
			$max_bytes = $server_max;
		}

		return array(
			'max_file_size_mb'    => max( 1, (int) round( $max_bytes / ( 1024 * 1024 ) ) ),
			'max_file_size_bytes' => $max_bytes,
			'max_file_count'      => self::max_files_per_contract(),
		);
	}

	/**
	 * @param ContractModel $contract Contract.
	 * @return WP_Error|null
	 */
	public function guard_contract_file_count( ContractModel $contract ): ?WP_Error {
		$count = (int) ContractAttachmentModel::query()
			->where( 'contract_id', (int) $contract->id )
			->count();
		if ( $count >= self::max_files_per_contract() ) {
			return new WP_Error(
				'too_many_files',
				sprintf(
					/* translators: %d: maximum number of files */
					_n(
						'You can attach at most %d file to this contract.',
						'You can attach at most %d files to this contract.',
						self::max_files_per_contract(),
						'doublescale'
					),
					self::max_files_per_contract()
				),
				array( 'status' => 400 )
			);
		}
		return null;
	}

	/**
	 * @param array<string, mixed> $file     PHP upload array.
	 * @param ContractModel        $contract Contract.
	 * @param array<string, mixed> $uploader user_id and/or contact_id.
	 * @return ContractAttachmentModel|WP_Error
	 */
	public function store_upload( array $file, ContractModel $contract, array $uploader ) {
		if ( empty( $file['tmp_name'] ) || ! is_uploaded_file( $file['tmp_name'] ) ) {
			return new WP_Error( 'invalid_upload', __( 'No file was uploaded.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$too_many = $this->guard_contract_file_count( $contract );
		if ( $too_many ) {
			return $too_many;
		}

		$max_size  = self::max_file_size_bytes();
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
		$mime          = $this->detect_mime( (string) $file['tmp_name'], (string) ( $file['type'] ?? '' ) );
		if ( ! in_array( $mime, self::accepted_mimes(), true ) ) {
			return new WP_Error( 'invalid_mime', __( 'This file type is not allowed.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$upload_dir = wp_upload_dir( null, false, false );
		if ( ! is_array( $upload_dir ) || empty( $upload_dir['basedir'] ) ) {
			return new WP_Error( 'upload_dir_unavailable', __( 'Upload directory is unavailable.', 'doublescale' ), array( 'status' => 500 ) );
		}

		$subdir     = 'doublescale-sales/contracts/' . gmdate( 'Y' ) . '/' . gmdate( 'm' );
		$target_dir = trailingslashit( $upload_dir['basedir'] ) . $subdir;
		if ( ! wp_mkdir_p( $target_dir ) ) {
			return new WP_Error( 'mkdir_failed', __( 'Could not create upload directory.', 'doublescale' ), array( 'status' => 500 ) );
		}

		$stored_name = wp_unique_filename( $target_dir, $original_name );
		$absolute    = trailingslashit( $target_dir ) . $stored_name;
		$relative    = $subdir . '/' . $stored_name;

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_move_uploaded_file -- validated via is_uploaded_file.
		if ( ! move_uploaded_file( $file['tmp_name'], $absolute ) ) {
			return new WP_Error( 'move_failed', __( 'Failed to store the uploaded file.', 'doublescale' ), array( 'status' => 500 ) );
		}

		return ContractAttachmentModel::create(
			array(
				'contract_id' => (int) $contract->id,
				'user_id'     => ! empty( $uploader['user_id'] ) ? (int) $uploader['user_id'] : null,
				'contact_id'  => ! empty( $uploader['contact_id'] ) ? (int) $uploader['contact_id'] : null,
				'file_name'   => $original_name,
				'file_path'   => $relative,
				'file_type'   => $mime,
				'file_size'   => $file_size > 0 ? $file_size : (int) filesize( $absolute ),
			)
		);
	}

	/**
	 * @param ContractAttachmentModel $attachment Attachment.
	 * @param string                  $download_path REST download path without namespace.
	 * @return array<string, mixed>
	 */
	public function shape_for_api( ContractAttachmentModel $attachment, string $download_path ): array {
		return array(
			'id'          => (int) $attachment->id,
			'file_hash'   => (string) $attachment->file_hash,
			'file_name'   => (string) $attachment->file_name,
			'file_size'   => (int) $attachment->file_size,
			'file_type'   => (string) $attachment->file_type,
			'created_at'  => $attachment->created_at ? (string) $attachment->created_at : null,
			'uploaded_by' => $this->resolve_uploader_name( $attachment ),
			'url'         => rest_url( 'doublescale/v1/' . ltrim( $download_path, '/' ) ),
		);
	}

	/**
	 * @param ContractAttachmentModel $attachment Attachment.
	 * @return string|null
	 */
	public function resolve_uploader_name( ContractAttachmentModel $attachment ): ?string {
		if ( ! empty( $attachment->user_id ) ) {
			if ( $attachment->relationLoaded( 'user' ) && $attachment->user ) {
				$name = trim( (string) $attachment->user->display_name );
				if ( '' !== $name ) {
					return $name;
				}
			}

			$user = get_userdata( (int) $attachment->user_id );
			if ( $user && $user->exists() ) {
				$name = trim( (string) $user->display_name );
				return '' !== $name ? $name : __( 'Staff', 'doublescale' );
			}

			return __( 'Staff', 'doublescale' );
		}

		if ( ! empty( $attachment->contact_id ) ) {
			if ( $attachment->relationLoaded( 'contact' ) && $attachment->contact ) {
				$contact = $attachment->contact;
				$name    = trim( (string) ( $contact->first_name ?? '' ) . ' ' . (string) ( $contact->last_name ?? '' ) );
				if ( '' !== $name ) {
					return $name;
				}
				$email = trim( (string) ( $contact->email ?? '' ) );
				if ( '' !== $email ) {
					return $email;
				}
			}

			return __( 'Customer', 'doublescale' );
		}

		return null;
	}

	/**
	 * Stream attachment bytes to the browser.
	 *
	 * @param ContractAttachmentModel $attachment Attachment.
	 * @return WP_Error|null
	 */
	public function stream_download( ContractAttachmentModel $attachment ): ?WP_Error {
		$absolute = ContractAttachmentModel::resolve_absolute_path( (string) $attachment->file_path );
		if ( '' === $absolute || ! is_file( $absolute ) ) {
			return new WP_Error( 'not_found', __( 'File not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$filename = sanitize_file_name( (string) $attachment->file_name );
		if ( '' === $filename ) {
			$filename = 'attachment';
		}

		add_filter(
			'rest_pre_serve_request',
			static function ( $served ) use ( $absolute, $attachment, $filename ) {
				if ( $served ) {
					return $served;
				}
				if ( ! headers_sent() ) {
					header( 'Content-Type: ' . (string) $attachment->file_type );
					header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
					header( 'Content-Length: ' . (string) filesize( $absolute ) );
					header( 'X-Content-Type-Options: nosniff' );
					header( 'Cache-Control: private, no-store, max-age=0' );
				}
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile
				readfile( $absolute );
				return true;
			},
			10,
			1
		);

		return null;
	}

	/**
	 * @param string $absolute Absolute file path.
	 * @param string $fallback Fallback MIME.
	 * @return string
	 */
	private function detect_mime( string $absolute, string $fallback ): string {
		if ( function_exists( 'wp_check_filetype_and_ext' ) ) {
			$checked = wp_check_filetype_and_ext( $absolute, basename( $absolute ) );
			if ( ! empty( $checked['type'] ) ) {
				return (string) $checked['type'];
			}
		}
		return '' !== $fallback ? $fallback : 'application/octet-stream';
	}
}
