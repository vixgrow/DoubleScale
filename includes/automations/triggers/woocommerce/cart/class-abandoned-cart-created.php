<?php

/**
 * WooCommerce Abandoned Cart Created Trigger
 * This trigger will be fired when an abandoned cart is created.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Cart;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Abandoned Cart Created Trigger
 */
class Abandoned_Cart_Created extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Abandoned Cart';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_abandoned_cart_created';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when an abandoned cart is created.';

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
	public $group = 'cart';
}

Triggers_Manager::instance()->register( new Abandoned_Cart_Created() );
