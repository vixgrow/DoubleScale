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

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;


/**
 * Customer Before Card Expiry Trigger
 */
class Customer_Before_Card_Expiry extends Trigger_Pro {

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
}

Triggers_Manager::instance()->register( new Customer_Before_Card_Expiry() );
