<?php
/**
 * Product Data Fetcher
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails;

/**
 * Fetches live WooCommerce product data for email rendering
 */
class Product_Data_Fetcher {
	/**
	 * Get product data from WooCommerce
	 *
	 * @param int $product_id WooCommerce product ID
	 * @return array|null Product data array or null if not found
	 */
	public static function get_product_data( $product_id ) {
		if ( ! $product_id || ! function_exists( 'wc_get_product' ) ) {
			return null;
		}

		$product = wc_get_product( $product_id );
		if ( ! $product || $product->get_status() !== 'publish' ) {
			return null;
		}

		$image = wp_get_attachment_image_src( $product->get_image_id(), 'full' );

		return array(
			'id'          => $product->get_id(),
			'title'       => $product->get_name(),
			'description' => $product->get_short_description() ?: $product->get_description(),
			'price'       => $product->get_price_html(),
			'imageSrc'    => $image ? $image[0] : '',
			'imageAlt'    => $product->get_name(),
			'buttonLink'  => $product->get_permalink(),
		);
	}
}
