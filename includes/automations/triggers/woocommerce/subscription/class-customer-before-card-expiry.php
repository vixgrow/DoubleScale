<?php

/**
 * WooCommerce Customer Before Card Expiry Trigger
 * This trigger will be fired before a customer's saved payment card expires.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Subscription;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Automation_Model;
use WC_Customer;

/**
 * Customer Before Card Expiry Trigger
 */
class Customer_Before_Card_Expiry extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Customer Before Card Expiry';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_customer_before_card_expiry';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired before a customer\'s saved payment card expires.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'woocommerce';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'subscription';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'woocommerce_subscriptions_before_customer_payment_method_expiry', array( $this, 'customer_before_card_expiry' ) );
	}

	/**
	 * Customer Before Card Expiry
	 *
	 * @since 1.0.0
	 *
	 * @param int $customer_id Customer ID.
	 * @return void
	 */
	public function customer_before_card_expiry( $customer_id ) {
		$customer = new WC_Customer( $customer_id );
		
		if ( ! $customer->get_id() ) {
			return;
		}

		// Get customer's active subscriptions
		$subscriptions = wcs_get_users_subscriptions( $customer_id );
		$active_subscriptions = array();
		
		foreach ( $subscriptions as $subscription ) {
			if ( $subscription->has_status( array( 'active', 'on-hold' ) ) ) {
				$active_subscriptions[] = $subscription->get_id();
			}
		}

		$data = array(
			'customer_id'          => $customer_id,
			'customer'             => $customer,
			'customer_email'       => $customer->get_email(),
			'customer_first_name'  => $customer->get_first_name(),
			'customer_last_name'   => $customer->get_last_name(),
			'active_subscriptions' => $active_subscriptions,
			'subscription_count'   => count( $active_subscriptions ),
		);

		$this->process( $data );
	}

	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'customer_id' => array(
				'label' => __( 'Customer ID', 'quillcrm' ),
				'type'  => 'number',
			),
			'customer_email' => array(
				'label' => __( 'Customer Email', 'quillcrm' ),
				'type'  => 'email',
			),
			'customer_first_name' => array(
				'label' => __( 'Customer First Name', 'quillcrm' ),
				'type'  => 'text',
			),
			'customer_last_name' => array(
				'label' => __( 'Customer Last Name', 'quillcrm' ),
				'type'  => 'text',
			),
			'subscription_count' => array(
				'label' => __( 'Active Subscription Count', 'quillcrm' ),
				'type'  => 'number',
			),
		);
	}
}

Triggers_Manager::instance()->register( new Customer_Before_Card_Expiry() );
