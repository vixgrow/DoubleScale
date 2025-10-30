<?php

/**
 * WooCommerce Subscription Before End Trigger
 * This trigger will be fired before a subscription reaches its end date.
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
 * Subscription Before End Trigger
 */
class Subscription_Before_End extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Before End';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_subscription_before_end';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired before a subscription reaches its end date.';

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
		add_action( 'woocommerce_subscription_status_pending-cancel', array( $this, 'subscription_before_end' ) );
		add_action( 'woocommerce_subscription_status_cancelled', array( $this, 'subscription_before_end' ) );
	}

	/**
	 * Subscription Before End
	 *
	 * @since 1.0.0
	 *
	 * @param WC_Subscription $subscription Subscription object.
	 * @return void
	 */
	public function subscription_before_end( $subscription ) {
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
			'end_date'        => $subscription->get_date( 'end' ),
			'cancelled_date'  => $subscription->get_date( 'cancelled' ),
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
			'end_date' => array(
				'label' => __( 'End Date', 'quillcrm' ),
				'type'  => 'date',
			),
		);
	}
}

Triggers_Manager::instance()->register( new Subscription_Before_End() );
