<?php
/**
 * WooCommerce Abandoned Cart Total
 *
 * This class is responsible for handling the Abandoned Cart Total Value
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\WooCommerce\Abandoned_Cart;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Abandoned Cart Total Merge Tag
 */
class Cart_Total extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Cart Total';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'total';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Abandoned Cart Total Value';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'abandoned_cart';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$abandoned_cart_id = $contact->get_data( 'cart_id', 0 );
		$abandoned_cart    = Abandoned_Cart_Model::find( $abandoned_cart_id );
		if ( ! $abandoned_cart ) {
			return '';
		}

		$total    = $abandoned_cart->total ?? 0;
		$currency = $abandoned_cart->currency ?? get_woocommerce_currency();

		// Format the total with currency
		if ( function_exists( 'wc_price' ) ) {
			return wp_strip_all_tags( wc_price( $total, array( 'currency' => $currency ) ) );
		}

		return $total . ' ' . $currency;
	}
}

Merge_Tags_Manager::instance()->register( new Cart_Total() );
