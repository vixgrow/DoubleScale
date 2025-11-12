<?php

namespace QuillCRM\Automations\Rules\Cart;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Cart Contains Any Coupon class
 */
class Cart_Contains_Any_Coupon extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Cart Contains Any Coupon';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'cart_contains_any_coupon';

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
	public $type = 'select';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'     => __( 'Is', 'quillcrm' ),
			'is_not' => __( 'Is not', 'quillcrm' ),
		);
	}

	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		return array(
			'yes' => __( 'Yes', 'quillcrm' ),
			'no'  => __( 'No', 'quillcrm' ),
		);
	}

	/**
	 * Has options
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function has_options() {
		return true;
	}

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
			return 'no';
		}

		$abandoned_cart = Abandoned_Cart_Model::find( $abandoned_cart_id );
		if ( ! $abandoned_cart || empty( $abandoned_cart->coupons ) ) {
			return 'no';
		}

		// Check if coupons array has any items
		if ( is_array( $abandoned_cart->coupons ) && ! empty( $abandoned_cart->coupons ) ) {
			return 'yes';
		}

		return 'no';
	}
}

add_action(
	'init',
	function () {
		if ( class_exists( 'WooCommerce' ) ) {
			Rules_Manager::instance()->register( new Cart_Contains_Any_Coupon() );
		} else {
			add_action(
				'woocommerce_loaded',
				function () {
					Rules_Manager::instance()->register( new Cart_Contains_Any_Coupon() );
				}
			);
		}
	},
	99
);

