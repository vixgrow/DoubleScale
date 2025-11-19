<?php

/**
 * WooCommerce User Adds Product To Wishlist Trigger
 * This trigger will be fired when a user adds a product to their wishlist.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Wishlist;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * User Adds Product To Wishlist Trigger
 */
class User_Adds_Product_To_Wishlist extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'User Adds Product To Wishlist';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_user_adds_product_to_wishlist';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user adds a product to their wishlist.';

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

Triggers_Manager::instance()->register( new User_Adds_Product_To_Wishlist() );
