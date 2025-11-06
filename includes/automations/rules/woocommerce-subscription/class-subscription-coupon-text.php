<?php

/**
 * Class Subscription Coupon Text
 *
 * This class is responsible for handling the subscription coupon text rule
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
 * Subscription Coupon Text class
 */
class Subscription_Coupon_Text extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Subscription Coupon Text';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'subscription_coupon_text';

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
	public $type = 'text';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'starts_with'        => \__( 'Starts with', 'quillcrm' ),
			'ends_with'          => \__( 'Ends with', 'quillcrm' ),
			'any_contains'       => \__( 'Any contains', 'quillcrm' ),
			'any_matches_exactly' => \__( 'Any matches exactly', 'quillcrm' ),
		);
	}

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return array
	 */
	public function get_value( $automation_contact ) {
		$subscription_id = $automation_contact->get_data( 'subscription_id' );
		
		if ( ! \function_exists( 'wcs_get_subscription' ) ) {
			return array();
		}

		$subscription = \wcs_get_subscription( $subscription_id );
		if ( ! $subscription instanceof \WC_Subscription ) {
			return array();
		}

		// Get used coupons from subscription
		$used_coupons = array();
		if ( \method_exists( $subscription, 'get_used_coupons' ) ) {
			$used_coupons = $subscription->get_used_coupons();
		} elseif ( \method_exists( $subscription, 'get_coupon_codes' ) ) {
			$used_coupons = $subscription->get_coupon_codes();
		}

		return is_array( $used_coupons ) ? $used_coupons : array();
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
		$coupons    = $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = $rule['value'] ?? '';

		if ( ! is_array( $coupons ) || empty( $coupons ) ) {
			return false;
		}

		// Convert rule value to lowercase for case-insensitive comparison
		$rule_value = \strtolower( $rule_value );

		switch ( $operator ) {
			case 'starts_with':
				foreach ( $coupons as $coupon ) {
					if ( \strpos( \strtolower( $coupon ), $rule_value ) === 0 ) {
						return true;
					}
				}
				return false;

			case 'ends_with':
				foreach ( $coupons as $coupon ) {
					$coupon_lower = \strtolower( $coupon );
					if ( \substr( $coupon_lower, -\strlen( $rule_value ) ) === $rule_value ) {
						return true;
					}
				}
				return false;

			case 'any_contains':
				foreach ( $coupons as $coupon ) {
					if ( \strpos( \strtolower( $coupon ), $rule_value ) !== false ) {
						return true;
					}
				}
				return false;

			case 'any_matches_exactly':
				foreach ( $coupons as $coupon ) {
					if ( \strtolower( $coupon ) === $rule_value ) {
						return true;
					}
				}
				return false;

			default:
				return false;
		}
	}
}

\add_action(
	'init',
	function () {
		if ( \class_exists( 'WC_Subscriptions' ) ) {
			Rules_Manager::instance()->register( new Subscription_Coupon_Text() );
		} else {
			\add_action(
				'woocommerce_subscriptions_loaded',
				function () {
					Rules_Manager::instance()->register( new Subscription_Coupon_Text() );
				}
			);
		}
	},
	99
);
