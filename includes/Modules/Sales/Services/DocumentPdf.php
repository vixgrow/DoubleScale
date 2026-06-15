<?php
/**
 * Shared PDF rendering for proposals and invoices.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use WP_Error;

/**
 * DocumentPdf service.
 */
final class DocumentPdf {

	/**
	 * @param array<string, mixed> $shaped Shaped proposal or invoice data.
	 * @param string               $type Document type: proposal|invoice.
	 * @return string
	 */
	public static function render_html( array $shaped, string $type ): string {
		if ( 'contract' === $type ) {
			$company = array(
				'name'    => (string) \get_bloginfo( 'name' ),
				'url'     => (string) \home_url( '/' ),
				'address' => self::resolved_company_address(),
			);

			ob_start();
			$document = $shaped;
			include __DIR__ . '/templates/contract-pdf.php';
			return (string) ob_get_clean();
		}

		$type = 'invoice' === $type ? 'invoice' : 'proposal';

		$company = array(
			'name'    => (string) \get_bloginfo( 'name' ),
			'url'     => (string) \home_url( '/' ),
			'address' => self::resolved_company_address(),
		);

		ob_start();
		$document = $shaped;
		$doc_type = $type;
		include __DIR__ . '/templates/document-pdf.php';
		return (string) ob_get_clean();
	}

	/**
	 * Company address for PDF/receipt headers (settings + filter).
	 *
	 * @return string
	 */
	public static function resolved_company_address(): string {
		$from_settings = trim( (string) SalesSettings::get( 'pdf_company_address', '' ) );
		$address       = '' !== $from_settings ? $from_settings : '';

		return (string) \apply_filters( 'doublescale_sales_pdf_company_address', $address );
	}

	/**
	 * @param array<string, mixed> $shaped Shaped proposal or invoice data.
	 * @param string               $type Document type: proposal|invoice.
	 * @return string|WP_Error Raw PDF bytes or error.
	 */
	public static function render_pdf( array $shaped, string $type ) {
		if ( ! class_exists( 'DoubleScale\\Vendor\\Dompdf\\Dompdf' ) ) {
			return new WP_Error(
				'pdf_unavailable',
				__( 'PDF export is not available. Rebuild plugin dependencies with composer scope:vendor.', 'doublescale' ),
				array( 'status' => 503 )
			);
		}

		$html = self::render_html( $shaped, $type );

		$dompdf_class  = 'DoubleScale\\Vendor\\Dompdf\\Dompdf';
		$options_class = 'DoubleScale\\Vendor\\Dompdf\\Options';

		$options = new $options_class();
		$options->set( 'isRemoteEnabled', false );
		$options->set( 'defaultFont', 'DejaVu Sans' );

		try {
			$dompdf = new $dompdf_class( $options );
			$dompdf->loadHtml( $html );
			$dompdf->setPaper( 'A4', 'portrait' );
			$dompdf->render();

			return (string) $dompdf->output();
		} catch ( \Throwable $e ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				\error_log( 'DoubleScale PDF generation failed: ' . $e->getMessage() );
			}

			return new WP_Error(
				'pdf_generation_failed',
				__( 'PDF generation failed. Rebuild plugin dependencies with composer scope:vendor.', 'doublescale' ),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Stream a generated PDF to the browser as raw bytes from a REST callback.
	 *
	 * WordPress JSON-encodes any value returned from a REST callback, which
	 * corrupts binary output. We hook `rest_pre_serve_request` to emit the raw
	 * bytes ourselves and short-circuit the default JSON serialization.
	 *
	 * @param array<string, mixed> $shaped   Shaped proposal or invoice data.
	 * @param string               $type     Document type: proposal|invoice.
	 * @param string               $filename Download filename (without extension is fine).
	 * @return \WP_REST_Response|WP_Error Response to return from the callback, or error.
	 */
	public static function rest_response( array $shaped, string $type, string $filename ) {
		$pdf = self::render_pdf( $shaped, $type );
		if ( \is_wp_error( $pdf ) ) {
			return $pdf;
		}

		$download_name = \sanitize_file_name( $filename );
		if ( '' === $download_name ) {
			$download_name = 'document';
		}
		if ( '.pdf' !== strtolower( substr( $download_name, -4 ) ) ) {
			$download_name .= '.pdf';
		}

		\add_filter(
			'rest_pre_serve_request',
			static function ( $served ) use ( $pdf, $download_name ) {
				if ( $served ) {
					return $served;
				}

				if ( ! headers_sent() ) {
					header( 'Content-Type: application/pdf' );
					header( 'Content-Disposition: attachment; filename="' . $download_name . '"' );
					header( 'Content-Length: ' . strlen( $pdf ) );
					header( 'X-Content-Type-Options: nosniff' );
					header( 'Cache-Control: private, no-store, max-age=0' );
				}

				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- raw PDF bytes.
				echo $pdf;

				return true;
			},
			10,
			1
		);

		// Body is ignored because the filter above already emitted the bytes,
		// but we return a 200 response so the REST server proceeds to serve.
		return new \WP_REST_Response( null, 200 );
	}
}
