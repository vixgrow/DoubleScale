<?php

/**
 * MemberPress Trigger for Membership Level Expiry
 *
 * This trigger will be fired when a user's membership level expires.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\MemberPress;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Membership Level Expiry Trigger
 */
class Membership_Level_Expiry extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Membership Level Expiry';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'memberpress_membership_level_expiry';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user\'s membership level expires.';

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
	public $source = 'memberpress';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'memberpress';
}

Triggers_Manager::instance()->register( new Membership_Level_Expiry() );
