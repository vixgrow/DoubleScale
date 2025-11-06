<?php

/**
 * Class Subscription Total
 *
 * This class is responsible for handling the subscription total rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\WooCommerce_Subscription;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Subscription Total class
 */
class Subscription_Total extends Rule {


	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Subscription Total';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'subscription_total';

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
			'is_equal_to'                 => __( 'is equal to', 'quillcrm' ),
			'is_not_equal_to'             => __( 'is not equal to', 'quillcrm' ),
			'is_greater_than'             => __( 'is greater than', 'quillcrm' ),
			'is_less_than'                => __( 'is less than', 'quillcrm' ),
			'is_greater_than_or_equal_to' => __( 'is greater than or equal to', 'quillcrm' ),
			'is_less_than_or_equal_to'    => __( 'is less than or equal to', 'quillcrm' ),
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
		$status = $automation_contact->get_data( 'subscription_id' );
		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return '';
		}

		$subscription = wcs_get_subscription( $status );
		if ( ! $subscription instanceof \WC_Subscription ) {
			return '';
		}

		$price = $subscription instanceof WC_Subscription ? (float) $subscription->get_total() : 0;

		return $price;
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
			case 'is_equal_to':
				return $value == $rule_value;
			case 'is_not_equal_to':
				return $value != $rule_value;
			case 'is_greater_than':
				return $value > $rule_value;
			case 'is_less_than':
				return $value < $rule_value;
			case 'is_greater_than_or_equal_to':
				return $value >= $rule_value;
			case 'is_less_than_or_equal_to':
				return $value <= $rule_value;
			default:
				return false;
		};
	}
}


add_action(
	'init',
	function () {
		if ( class_exists( 'WC_Subscriptions' ) ) {
			Rules_Manager::instance()->register( new Subscription_Total() );
		} else {
			add_action(
				'woocommerce_subscriptions_loaded',
				function () {
					Rules_Manager::instance()->register( new Subscription_Total() );
				}
			);
		}
	},
	99
);
