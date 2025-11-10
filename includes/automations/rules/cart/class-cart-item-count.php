<?php

namespace QuillCRM\Automations\Rules\Cart;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Cart Item Count class
 */
class Cart_Item_Count extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Cart Item Count';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'cart_item_count';

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
	public $type = 'number';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'greater_than' => __( 'Greater than', 'quillcrm' ),
			'lower_than'   => __( 'Less than', 'quillcrm' ),
			'equal'        => __( 'Equal', 'quillcrm' ),
			'not_equal'    => __( 'Does not equal', 'quillcrm' ),
		);
	}

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return int
	 */
	public function get_value( $automation_contact ) {
		$abandoned_cart_id = $automation_contact->get_data( 'cart_id', 0 );
		if ( ! $abandoned_cart_id ) {
			return 0;
		}

		$abandoned_cart = Abandoned_Cart_Model::find( $abandoned_cart_id );
		if ( ! $abandoned_cart || empty( $abandoned_cart->items ) ) {
			return 0;
		}

		// Count total quantity of items in cart
		$total_quantity = 0;
		$items          = $abandoned_cart->items;

		foreach ( $items as $item ) {
			$quantity = isset( $item['quantity'] ) ? (int) $item['quantity'] : 0;
			$total_quantity += $quantity;
		}

		return $total_quantity;
	}

	/**
	 * Is met
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param array                    $rule Rule.
	 *
	 * @return bool
	 */
	public function is_met( Automation_Contact_Model $automation_contact, $rule = array() ) {
		$value      = (int) $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = (int) $rule['value'];

		switch ( $operator ) {
			case 'equal':
				return $value === $rule_value;
			case 'not_equal':
				return $value !== $rule_value;
			case 'greater_than':
				return $value > $rule_value;
			case 'lower_than':
				return $value < $rule_value;
			default:
				return false;
		}
	}
}

add_action(
	'init',
	function () {
		if ( class_exists( 'WooCommerce' ) ) {
			Rules_Manager::instance()->register( new Cart_Item_Count() );
		} else {
			add_action(
				'woocommerce_loaded',
				function () {
					Rules_Manager::instance()->register( new Cart_Item_Count() );
				}
			);
		}
	},
	99
);

