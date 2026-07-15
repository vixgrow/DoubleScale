<?php
/**
 * Shared PDF rendering for proposals and invoices.
 *
 * @package DoubleScale\Modules\Documents
 */

namespace DoubleScale\Modules\Documents\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Documents\Constants\DocumentTemplate;
use DoubleScale\Modules\Sales\Services\SalesSettings;
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
		$type = 'invoice' === $type ? 'invoice' : 'proposal';

		$company = self::resolved_company_block();

		ob_start();
		$document = $shaped;
		$doc_type = $type;
		$design   = DocumentTemplate::normalize( $shaped['template'] ?? DocumentTemplate::DEFAULT );
		include __DIR__ . '/templates/document-pdf.php';
		return (string) ob_get_clean();
	}

	/**
	 * Business branding from core settings.
	 *
	 * @return array{business_name: string, business_address: string, business_logo: string}
	 */
	public static function resolved_business_settings(): array {
		$business = Settings::get( 'business', array() );
		if ( ! is_array( $business ) ) {
			$business = array();
		}

		return array(
			'business_name'    => trim( (string) ( $business['business_name'] ?? '' ) ),
			'business_address' => trim( (string) ( $business['business_address'] ?? '' ) ),
			'business_logo'    => esc_url_raw( (string) ( $business['business_logo'] ?? '' ) ),
		);
	}

	/**
	 * Company block for PDF and receipt headers.
	 *
	 * @return array{name: string, url: string, address: string, logo: string, logo_data_uri: string}
	 */
	public static function resolved_company_block(): array {
		$business = self::resolved_business_settings();
		$name     = $business['business_name'];
		if ( '' === $name ) {
			$name = (string) \get_bloginfo( 'name' );
		}

		$address = self::resolved_company_address();
		if ( '' === $address ) {
			$address = $business['business_address'];
		}

		$logo = $business['business_logo'];

		return array(
			'name'          => $name,
			'url'           => (string) \home_url( '/' ),
			'address'       => $address,
			'logo'          => $logo,
			'logo_data_uri' => self::resolved_company_logo_data_uri( $logo ),
		);
	}

	/**
	 * Embed a local media-library logo as a data URI for Dompdf.
	 *
	 * @param string $logo_url Logo URL from settings.
	 * @return string
	 */
	public static function resolved_company_logo_data_uri( string $logo_url = '' ): string {
		$logo_url = trim( $logo_url );
		if ( '' === $logo_url ) {
			$logo_url = self::resolved_business_settings()['business_logo'];
		}
		if ( '' === $logo_url ) {
			return '';
		}

		$path = '';
		$attachment_id = \attachment_url_to_postid( $logo_url );
		if ( $attachment_id ) {
			$path = (string) \get_attached_file( $attachment_id );
		} else {
			$upload_dir = \wp_upload_dir();
			if ( ! empty( $upload_dir['baseurl'] ) && ! empty( $upload_dir['basedir'] ) ) {
				if ( 0 === strpos( $logo_url, $upload_dir['baseurl'] ) ) {
					$path = str_replace( $upload_dir['baseurl'], $upload_dir['basedir'], $logo_url );
				}
			}
		}

		if ( '' === $path || ! is_readable( $path ) ) {
			return '';
		}

		$filetype = \wp_check_filetype( $path );
		$mime     = ! empty( $filetype['type'] ) ? (string) $filetype['type'] : 'image/png';
		$contents = \file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( false === $contents ) {
			return '';
		}

		return 'data:' . $mime . ';base64,' . base64_encode( $contents ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
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
