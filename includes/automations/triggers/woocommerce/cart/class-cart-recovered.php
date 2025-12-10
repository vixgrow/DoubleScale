<?php

/**
 * WooCommerce Cart Recovered Trigger
 * This trigger will be fired when an abandoned cart is recovered (customer completes purchase).
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Cart;


use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;


/**
 * Cart Recovered Trigger
 */
class Cart_Recovered extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Cart Recovered';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_cart_recovered';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when an abandoned cart is recovered (customer completes purchase).';

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

Triggers_Manager::instance()->register( new Cart_Recovered() );
