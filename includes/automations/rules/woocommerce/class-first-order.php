<?php

namespace QuillCRM\Automations\Rules\WooCommerce;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * First Order class
 */
class First_Order extends Rule {


	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'First Order';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'first_order';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'woocommerce';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'date';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'before'  => __( 'Before', 'quillcrm' ),
			'after'   => __( 'After', 'quillcrm' ),
			'on'      => __( 'On', 'quillcrm' ),
			'between' => __( 'Between', 'quillcrm' ),
		);
	}


	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return string|null
	 */
	public function get_value( $automation_contact ) {
		$contact = $automation_contact->contact;

		if ( ! $contact || empty( $contact->email ) ) {
			return null;
		}

		// Check if WooCommerce functions are available
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return null;
		}

		$query_args = array(
			'limit'   => 1,
			'orderby' => 'date',
			'order'   => 'ASC',
			'status'  => array( 'wc-completed', 'wc-processing', 'wc-on-hold' ),
		);

		// Get user by email
		$user = get_user_by( 'email', $contact->email );

		if ( $user ) {
			$query_args['customer_id'] = $user->ID;
		} else {
			$query_args['billing_email'] = $contact->email;
		}

		$orders = wc_get_orders( $query_args );

		if ( empty( $orders ) ) {
			return null;
		}

		$first_order = $orders[0];
		if ( ! $first_order instanceof \WC_Order ) {
			return null;
		}

		// Return the order date in Y-m-d format
		return $first_order->get_date_created()->date( 'Y-m-d' );
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
		$first_order_date = $this->get_value( $automation_contact );
		$operator         = $rule['operator'];
		$rule_value       = $rule['value'] ?? '';

		// If no first order found, rule cannot be met
		if ( empty( $first_order_date ) ) {
			return false;
		}

		// Convert dates to timestamps for comparison
		$first_order_timestamp = strtotime( $first_order_date );

		switch ( $operator ) {
			case 'before':
				$rule_timestamp = strtotime( $rule_value );
				return $first_order_timestamp < $rule_timestamp;

			case 'after':
				$rule_timestamp = strtotime( $rule_value );
				return $first_order_timestamp > $rule_timestamp;

			case 'on':
				$rule_timestamp = strtotime( $rule_value );
				return date( 'Y-m-d', $first_order_timestamp ) === date( 'Y-m-d', $rule_timestamp );

			case 'between':
				if ( ! is_array( $rule_value ) || count( $rule_value ) < 2 ) {
					return false;
				}
				$start_timestamp = strtotime( $rule_value[0] );
				$end_timestamp   = strtotime( $rule_value[1] );
				return $first_order_timestamp >= $start_timestamp && $first_order_timestamp <= $end_timestamp;

			default:
				return false;
		}
	}
}


add_action(
	'init',
	function () {
		if ( class_exists( 'WooCommerce' ) ) {
			Rules_Manager::instance()->register( new First_Order() );
		} else {
			add_action(
				'woocommerce_loaded',
				function () {
					Rules_Manager::instance()->register( new First_Order() );
				}
			);
		}
	},
	99
);
