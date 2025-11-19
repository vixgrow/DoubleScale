<?php

/**
 * WooCommerce Subscription Note Added Trigger
 * This trigger will be fired when a note is added to a subscription.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Subscription;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;


/**
 * Subscription Note Added Trigger
 */
class Subscription_Note_Added extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Note Added';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_subscription_note_added';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a note is added to a subscription.';

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

Triggers_Manager::instance()->register( new Subscription_Note_Added() );
