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

use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Abstracts\Trigger_Pro;

/**
 * Subscription Before End Trigger
 */
class Subscription_Before_End extends Trigger_Pro {

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
}

Triggers_Manager::instance()->register( new Subscription_Before_End() );
