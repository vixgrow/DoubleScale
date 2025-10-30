<?php

/**
 * WooCommerce Subscription Before Renewal Trigger
 * This trigger will be fired before a subscription renewal payment is processed.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Subscription;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Automation_Model;
use WC_Subscription;

/**
 * Subscription Before Renewal Trigger
 */
class Subscription_Before_Renewal extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Before Renewal';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_subscription_before_renewal';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired before a subscription renewal payment is processed.';

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
		add_action( 'woocommerce_scheduled_subscription_payment', array( $this, 'subscription_before_renewal' ) );
	}

	/**
	 * Subscription Before Renewal
	 *
	 * @since 1.0.0
	 *
	 * @param int $subscription_id Subscription ID.
	 * @return void
	 */
	public function subscription_before_renewal( $subscription_id ) {
		$subscription = wcs_get_subscription( $subscription_id );
		
		if ( ! $subscription instanceof WC_Subscription ) {
			return;
		}

		$data = array(
			'subscription_id' => $subscription->get_id(),
			'subscription'    => $subscription,
			'customer_id'     => $subscription->get_customer_id(),
			'customer_email'  => $subscription->get_billing_email(),
			'status'          => $subscription->get_status(),
			'total'           => $subscription->get_total(),
			'currency'        => $subscription->get_currency(),
			'next_payment'    => $subscription->get_date( 'next_payment' ),
			'renewal_amount'  => $subscription->get_total(),
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
			'subscription_id' => array(
				'label' => __( 'Subscription ID', 'quillcrm' ),
				'type'  => 'number',
			),
			'customer_id' => array(
				'label' => __( 'Customer ID', 'quillcrm' ),
				'type'  => 'number',
			),
			'customer_email' => array(
				'label' => __( 'Customer Email', 'quillcrm' ),
				'type'  => 'email',
			),
			'status' => array(
				'label' => __( 'Subscription Status', 'quillcrm' ),
				'type'  => 'text',
			),
			'total' => array(
				'label' => __( 'Subscription Total', 'quillcrm' ),
				'type'  => 'number',
			),
			'currency' => array(
				'label' => __( 'Currency', 'quillcrm' ),
				'type'  => 'text',
			),
			'renewal_amount' => array(
				'label' => __( 'Renewal Amount', 'quillcrm' ),
				'type'  => 'number',
			),
		);
	}
}

Triggers_Manager::instance()->register( new Subscription_Before_Renewal() );
