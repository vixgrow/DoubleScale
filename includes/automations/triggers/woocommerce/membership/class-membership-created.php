<?php

/**
 * WooCommerce Membership Created Trigger
 * This trigger will be fired when a new membership is created.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Membership;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Membership Created Trigger
 */
class Membership_Created extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Membership Created';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_membership_created';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a new membership is created in WooCommerce Memberships.';

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

Triggers_Manager::instance()->register( new Membership_Created() );
