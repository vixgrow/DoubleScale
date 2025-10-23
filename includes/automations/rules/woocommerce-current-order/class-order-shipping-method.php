<?php

/**
 * Class Order Shipping Method
 *
 * This class is responsible for handling the order shipping method rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\WooCommerce\Current_Order;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Order Shipping Method class
 */
class Order_Shipping_Method extends Rule {


	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Shipping Method';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'order_shipping_method';

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
			'equal' => __( 'Equal', 'quillcrm' ),
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
		 $methods = \WC()->shipping()->get_shipping_methods();
		$options  = array();
		foreach ( $methods as $method ) {
			$options[ $method->id ] = $method->method_title;
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
		$order_id = $automation_contact->get_data( 'order_id' );
		$order    = wc_get_order( $order_id );

		if ( ! $order instanceof \WC_Order ) {
			return '';
		}

		$shipping_items = $order->get_items( 'shipping' );

		if ( empty( $shipping_items ) ) {
			return '';
		}

		/** @var \WC_Order_Item_Shipping $item */
		$item = reset( $shipping_items );

		return $item->get_method_id();
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
		$value      = $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = $rule['value'] ?? '';

		switch ( $operator ) {
			case 'equal':
				return $value === $rule_value;
			default:
				return false;
		};
	}
}

Rules_Manager::instance()->register( new Order_Shipping_Method() );
