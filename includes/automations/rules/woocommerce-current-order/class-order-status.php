<?php

/**
 * Class Order Status
 *
 * This class is responsible for handling the order status rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\WooCommerce\Current_Order;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;
use QuillCRM\Constants\Order_Status as Order_Status_Constant;

/**
 * Order Status class
 */
class Order_Status extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Order Status';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'order_status';

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
			'equal'     => __( 'Equal', 'quillcrm' ),
			'not_equal' => __( 'Not equal', 'quillcrm' ),
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
		 return Order_Status_Constant::get_all();
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

		// WooCommerce get_status() returns status without 'wc-' prefix
		// Add 'wc-' prefix to match our constants
		return 'wc-' . $order->get_status();
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
		$rule_value = $rule['value'];

		switch ( $operator ) {
			case 'equal':
				return $value === $rule_value;
			case 'not_equal':
				return $value !== $rule_value;
			default:
				return false;
		};
	}
}

Rules_Manager::instance()->register( new Order_Status() );
