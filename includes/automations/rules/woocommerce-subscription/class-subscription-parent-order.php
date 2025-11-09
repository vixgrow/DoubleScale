<?php

/**
 * Class Subscription Parent Order Status
 *
 * This class is responsible for handling the subscription parent order status rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\WooCommerce_Subscription;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;
use QuillCRM\Constants\Order_Status;

/**
 * Subscription Parent Order Status class
 */
class Subscription_Parent_Order extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Subscription Parent Order Status';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'subscription_parent_order_status';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'woocommerce_subscription';

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
			'is'     => \__( 'Is', 'quillcrm' ),
			'is_not' => \__( 'Is not', 'quillcrm' ),
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

		$options = Order_Status::get_all();
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
		$subscription_id = $automation_contact->get_data( 'subscription_id' );

		if ( ! \function_exists( 'wcs_get_subscription' ) ) {
			return '';
		}

		$subscription = \wcs_get_subscription( $subscription_id );
		if ( ! $subscription instanceof \WC_Subscription ) {
			return '';
		}

		// Get the parent order
		$parent_order = $subscription->get_parent();
		if ( ! $parent_order instanceof \WC_Order ) {
			return '';
		}

		// Return the parent order status with 'wc-' prefix
		$parent_order_status = 'wc-' . $parent_order->get_status();

		return $parent_order_status ? $parent_order_status : '';
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

		if ( ! is_array( $rule_value ) ) {
			$rule_value = array( $rule_value );
		}

		switch ( $operator ) {
			case 'is':
				return in_array( $value, $rule_value, true );
			case 'is_not':
				return ! in_array( $value, $rule_value, true );
			default:
				return false;
		}
	}
}

\add_action(
	'init',
	function () {
		if ( \class_exists( 'WC_Subscriptions' ) ) {
			Rules_Manager::instance()->register( new Subscription_Parent_Order() );
		} else {
			\add_action(
				'woocommerce_subscriptions_loaded',
				function () {
					Rules_Manager::instance()->register( new Subscription_Parent_Order() );
				}
			);
		}
	},
	99
);
