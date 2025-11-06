<?php

namespace QuillCRM\Automations\Rules\Cart;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * All Cart Items Purchased (in past) class
 */
class All_Cart_Items_Purchased extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'All Cart Items Purchased (in past)';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'all_cart_items_purchased';

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
		if ( ! $abandoned_cart || empty( $abandoned_cart->items ) ) {
			return 'no';
		}

		$contact = $automation_contact->contact;
		if ( ! $contact || empty( $contact->email ) ) {
			return 'no';
		}

		if ( ! function_exists( 'wc_get_orders' ) ) {
			return 'no';
		}

		// Get all product IDs from the cart
		$cart_product_ids = array();
		$items           = $abandoned_cart->items;

		foreach ( $items as $item ) {
			$product_id = isset( $item['product_id'] ) ? $item['product_id'] : 0;
			if ( $product_id ) {
				$cart_product_ids[] = $product_id;
			}
		}

		if ( empty( $cart_product_ids ) ) {
			return 'no';
		}

		// Get customer orders
		$query_args = array(
			'limit'  => -1,
			'status' => array( 'wc-completed', 'wc-processing', 'wc-on-hold' ),
		);

		$user = get_user_by( 'email', $contact->email );
		if ( $user ) {
			$query_args['customer_id'] = $user->ID;
		} else {
			$query_args['billing_email'] = $contact->email;
		}

		$orders = wc_get_orders( $query_args );

		if ( empty( $orders ) ) {
			return 'no';
		}

		// Get all product IDs from past orders
		$purchased_product_ids = array();
		foreach ( $orders as $order ) {
			if ( ! $order instanceof \WC_Order ) {
				continue;
			}

			$order_items = $order->get_items();
			foreach ( $order_items as $order_item ) {
				$product_id = $order_item->get_product_id();
				if ( $product_id ) {
					$purchased_product_ids[] = $product_id;
				}
			}
		}

		// Check if all cart items were purchased in the past
		$cart_product_ids = array_unique( $cart_product_ids );
		$purchased_product_ids = array_unique( $purchased_product_ids );

		// Check if all cart products are in purchased products
		$all_purchased = empty( array_diff( $cart_product_ids, $purchased_product_ids ) );

		return $all_purchased ? 'yes' : 'no';
	}
}

add_action(
	'init',
	function () {
		if ( class_exists( 'WooCommerce' ) ) {
			Rules_Manager::instance()->register( new All_Cart_Items_Purchased() );
		} else {
			add_action(
				'woocommerce_loaded',
				function () {
					Rules_Manager::instance()->register( new All_Cart_Items_Purchased() );
				}
			);
		}
	},
	99
);

