<?php

/**
 * Class Order Total Value
 *
 * This class is responsible for handling the order total value rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\WooCommerce_Current_Order;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Order Total Value class
 */
class Order_Total_Value extends Rule {





	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Total Order Value';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'order_total_value';

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
			'less_than'    => __( 'Less than', 'quillcrm' ),
			'equal'        => __( 'equal', 'quillcrm' ),
			'not_equal'    => __( 'does not equal', 'quillcrm' ),
		);
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

		return $order->get_total();
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
		$value      = (float) $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = (float) $rule['value'];

		switch ( $operator ) {
			case 'equal':
				return $value === $rule_value;
			case 'not_equal':
				return $value !== $rule_value;
			case 'greater_than':
				return $value > $rule_value;
			case 'less_than':
				return $value < $rule_value;
			default:
				return false;
		};
	}
}


add_action(
	'init',
	function () {
		if ( class_exists( 'WooCommerce' ) ) {
			Rules_Manager::instance()->register( new Order_Total_Value() );
		} else {
			add_action(
				'woocommerce_loaded',
				function () {
					Rules_Manager::instance()->register( new Order_Total_Value() );
				}
			);
		}
	},
	99
);
