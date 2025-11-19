<?php

/**
 * WooCommerce Membership Status Changed Trigger
 * This trigger will be fired when a membership status changes.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Membership;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;


/**
 * Membership Status Changed Trigger
 */
class Membership_Status_Changed extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Membership Status Changed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_membership_status_changed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a membership status changes in WooCommerce Memberships.';

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
	public $group = 'membership';
}

Triggers_Manager::instance()->register( new Membership_Status_Changed() );
