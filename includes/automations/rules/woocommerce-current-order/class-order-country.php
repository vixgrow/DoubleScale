<?php

namespace QuillCRM\Automations\Rules\WooCommerce\Current_Order;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Order Country class
 */
class Order_Country extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Order Country';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'order_country';

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
			'includes_in'     => __( 'includes in', 'quillcrm' ),
			'not_includes_in' => __( 'not includes in', 'quillcrm' ),
			'empty'           => __( 'empty', 'quillcrm' ),
			'not_empty'       => __( 'not empty', 'quillcrm' ),
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
		$countries = new \WC_Countries();
		return $countries->get_countries();
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
			return '';
		}

		$order_id = $automation_contact->get_data( 'order_id' );
		$order    = wc_get_order( $order_id );

		if ( ! $order instanceof \WC_Order ) {
			return '';
		}

		// Get billing country, fallback to shipping country if billing is empty
		$billing_country = $order->get_billing_country();
		if ( ! empty( $billing_country ) ) {
			return $billing_country;
		}

		return $order->get_shipping_country();
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
			case 'includes_in':
				if ( is_array( $rule_value ) ) {
					return in_array( $value, $rule_value );
				}
				return $value === $rule_value;

			case 'not_includes_in':
				if ( is_array( $rule_value ) ) {
					return ! in_array( $value, $rule_value );
				}
				return $value !== $rule_value;

			case 'empty':
				return empty( $value );

			case 'not_empty':
				return ! empty( $value );

			default:
				return false;
		}
	}
}

Rules_Manager::instance()->register( new Order_Country() );
