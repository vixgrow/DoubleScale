<?php
/**
 * Serves signed support attachment downloads on the front end.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Renderer;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Support\Services\AttachmentService;

/**
 * AttachmentServeHandler class.
 */
final class AttachmentServeHandler {

	/**
	 * Wire the template_redirect listener.
	 */
	public function __construct() {
		add_action( 'template_redirect', array( $this, 'maybe_serve' ), 0 );
	}

	/**
	 * Intercept `?ds_support_file=&ds_support_sign=` download requests.
	 *
	 * @return void
	 */
	public function maybe_serve(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- HMAC-signed public download URL.
		if ( empty( $_GET['ds_support_file'] ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized below.
		$method = isset( $_SERVER['REQUEST_METHOD'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) : 'GET';
		if ( 'GET' !== $method ) {
			wp_die( esc_html__( 'Invalid request method.', 'doublescale' ), esc_html__( 'Method Not Allowed', 'doublescale' ), array( 'response' => 405 ) );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$file_hash = sanitize_text_field( wp_unslash( (string) $_GET['ds_support_file'] ) );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$sign = isset( $_GET['ds_support_sign'] ) ? sanitize_text_field( wp_unslash( (string) $_GET['ds_support_sign'] ) ) : '';

		if ( '' === $file_hash ) {
			wp_die( esc_html__( 'Missing file hash.', 'doublescale' ), esc_html__( 'Bad Request', 'doublescale' ), array( 'response' => 400 ) );
		}

		( new AttachmentService() )->serve( $file_hash, $sign );
	}
}
