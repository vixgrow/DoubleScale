<?php

/**
 * WooCommerce Wishlist Reminder Trigger
 * This trigger will be fired to remind users about items in their wishlist.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Wishlist;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Wishlist Reminder Trigger
 */
class Wishlist_Reminder extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Wishlist Reminder';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_wishlist_reminder';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired to remind users about items in their wishlist after a specified period.';

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

Triggers_Manager::instance()->register( new Wishlist_Reminder() );
