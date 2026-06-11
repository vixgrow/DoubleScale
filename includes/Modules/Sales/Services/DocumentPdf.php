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
		$type = 'invoice' === $type ? 'invoice' : 'proposal';

		$company = array(
			'name'    => (string) \get_bloginfo( 'name' ),
			'url'     => (string) \home_url( '/' ),
			'address' => (string) \apply_filters( 'doublescale_sales_pdf_company_address', '' ),
		);

		ob_start();
		$document = $shaped;
		$doc_type = $type;
		include __DIR__ . '/templates/document-pdf.php';
		return (string) ob_get_clean();
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
}
