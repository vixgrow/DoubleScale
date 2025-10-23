<?php

namespace QuillCRM\Automations\Rules\WooCommerce_Current_Order;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Products In Order class
 */
class Products_In_Order extends Rule {








	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Products in Order';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'products_in_order';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'woocommerce_current_order';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'multiselect';

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
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'includes'         => __( 'includes', 'quillcrm' ),
			'not_includes_in'  => __( 'Does not include (in any)', 'quillcrm' ),
			'includes_all'     => __( 'includes all', 'quillcrm' ),
			'not_includes_all' => __( 'includes none of (match all)', 'quillcrm' ),
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
		 // Check if WooCommerce is available
		if ( ! function_exists( 'wc_get_products' ) ) {
			return array();
		}

		$products = wc_get_products(
			array(
				'limit'  => -1,
				'status' => 'publish',
			)
		);

		$options = array();
		if ( ! empty( $products ) ) {
			foreach ( $products as $product ) {
				$options[ $product->id ] = $product->name;
			}
		}
		return $options;
	}

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return mixed
	 */
	public function get_value( $automation_contact ) {
		// Check if WooCommerce functions are available
		if ( ! function_exists( 'wc_get_order' ) ) {
			return array();
		}

		$order_id = $automation_contact->get_data( 'order_id' );
		$order    = wc_get_order( $order_id );

		if ( ! $order instanceof \WC_Order ) {
			return array();
		}

		$product_ids = array();
		$items       = $order->get_items();

		foreach ( $items as $item ) {
			$product_id = $item->get_product_id();
			$product    = wc_get_product( $product_id );

			if ( $product ) {
				$product_ids[] = $product_id;

				// Also include variation parent ID if this is a variation
				if ( $product->is_type( 'variation' ) ) {
					$parent_id = $product->get_parent_id();
					if ( $parent_id ) {
						$product_ids[] = $parent_id;
					}
				}
			}
		}

		// Remove duplicates and return unique product IDs
		return array_unique( $product_ids );
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
		$value      = $this->get_value( $automation_contact ); // Array of product IDs
		$operator   = $rule['operator'];
		$rule_value = $rule['value'] ?? array();

		// Ensure rule_value is an array (for multiselect compatibility)
		if ( ! is_array( $rule_value ) ) {
			$rule_value = array( $rule_value );
		}

		// Ensure value is an array
		if ( ! is_array( $value ) ) {
			$value = array();
		}

		// Convert to integers for proper comparison
		$value      = array_map( 'intval', $value );
		$rule_value = array_map( 'intval', $rule_value );

		switch ( $operator ) {
			case 'includes':
				// Check if any of the rule products are in the order products
				return ! empty( array_intersect( $value, $rule_value ) );

			case 'not_includes_in':
				// Check if none of the rule products are in the order products
				return empty( array_intersect( $value, $rule_value ) );

			case 'includes_all':
				// Check if all rule products are in the order products
				return empty( array_diff( $rule_value, $value ) );

			case 'not_includes_all':
				// Check if not all rule products are in the order products (includes none)
				return empty( array_intersect( $value, $rule_value ) );

			default:
				return false;
		}
	}
}

add_action(
	'init',
	function () {
		if ( class_exists( 'WooCommerce' ) ) {
			Rules_Manager::instance()->register( new Products_In_Order() );
		} else {
			add_action(
				'woocommerce_loaded',
				function () {
					Rules_Manager::instance()->register( new Products_In_Order() );
				}
			);
		}
	},
	99
);
