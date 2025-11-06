<?php

namespace QuillCRM\Automations\Rules\Cart;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Cart Coupon Text class
 */
class Cart_Coupon_Text extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Cart Coupon Text';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'cart_coupon_text';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'cart';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'text';

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return string
	 */
	public function get_value( $automation_contact ) {
		$abandoned_cart_id = $automation_contact->get_data( 'cart_id', 0 );
		if ( ! $abandoned_cart_id ) {
			return '';
		}

		$abandoned_cart = Abandoned_Cart_Model::find( $abandoned_cart_id );
		if ( ! $abandoned_cart || empty( $abandoned_cart->coupons ) ) {
			return '';
		}

		// Get all coupon codes and join them with comma
		$coupon_codes = array();
		if ( is_array( $abandoned_cart->coupons ) ) {
			$coupon_codes = array_keys( $abandoned_cart->coupons );
		}

		return implode( ', ', $coupon_codes );
	}
}

add_action(
	'init',
	function () {
		if ( class_exists( 'WooCommerce' ) ) {
			Rules_Manager::instance()->register( new Cart_Coupon_Text() );
		} else {
			add_action(
				'woocommerce_loaded',
				function () {
					Rules_Manager::instance()->register( new Cart_Coupon_Text() );
				}
			);
		}
	},
	99
);

