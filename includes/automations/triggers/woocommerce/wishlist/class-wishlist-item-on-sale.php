<?php

/**
 * WooCommerce Wishlist Item on Sale Trigger
 * This trigger will be fired when a product in a user's wishlist goes on sale.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Wishlist;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Wishlist Item on Sale Trigger
 */
class Wishlist_Item_On_Sale extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Wishlist Item on Sale';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_wishlist_item_on_sale';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a product in a user\'s wishlist goes on sale.';

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
	public $group = 'wishlist';
}

Triggers_Manager::instance()->register( new Wishlist_Item_On_Sale() );
