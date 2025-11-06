<?php

/**
 * Class Subscription Items
 *
 * This class is responsible for handling the subscription items rule
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
 * Subscription Items class
 */
class Subscription_Items extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Subscription Items';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'subscription_items';

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
			'matches_any_of'  => __( 'Matches any of', 'quillcrm' ),
			'matches_none_of' => __( 'Matches none of', 'quillcrm' ),
			'matches_all_of'  => __( 'Matches all of', 'quillcrm' ),
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
		if ( ! \function_exists( 'wc_get_products' ) ) {
			return array();
		}

		$products = \wc_get_products(
			array(
				'limit'  => -1,
				'status' => 'publish',
			)
		);

		$options = array();
		if ( ! empty( $products ) ) {
			foreach ( $products as $product ) {
				$options[ $product->get_id() ] = $product->get_name();
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
		$subscription_id = $automation_contact->get_data( 'subscription_id' );

		if ( ! \function_exists( 'wcs_get_subscription' ) ) {
			return array();
		}

		$subscription = \wcs_get_subscription( $subscription_id );
		if ( ! $subscription instanceof \WC_Subscription ) {
			return array();
		}

		// Get subscription items
		$items = $subscription->get_items();
		if ( empty( $items ) ) {
			return array();
		}

		$product_ids = array();

		foreach ( $items as $item ) {
			$product_id = $item->get_product_id();
			$product    = \wc_get_product( $product_id );

			if ( $product ) {
				$product_ids[] = $product_id;

				// Include parent product ID for variations
				if ( $product->is_type( 'variation' ) ) {
					$parent_id = $product->get_parent_id();
					if ( $parent_id ) {
						$product_ids[] = $parent_id;
					}
				}
			}
		}

		return array_values( array_unique( $product_ids ) );
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
		$rule_value = $rule['value'] ?? array();

		if ( ! is_array( $rule_value ) ) {
			$rule_value = array( $rule_value );
		}

		if ( ! is_array( $value ) ) {
			$value = array();
		}

		$value      = array_map( 'intval', $value );
		$rule_value = array_map( 'intval', $rule_value );

		switch ( $operator ) {
			case 'matches_any_of':
				return ! empty( array_intersect( $value, $rule_value ) );
			case 'matches_none_of':
				return empty( array_intersect( $value, $rule_value ) );
			case 'matches_all_of':
				return empty( array_diff( $rule_value, $value ) );
			default:
				return false;
		}
	}
}

\add_action(
	'init',
	function () {
		if ( \class_exists( 'WC_Subscriptions' ) ) {
			Rules_Manager::instance()->register( new Subscription_Items() );
		} else {
			\add_action(
				'woocommerce_subscriptions_loaded',
				function () {
					Rules_Manager::instance()->register( new Subscription_Items() );
				}
			);
		}
	},
	99
);
