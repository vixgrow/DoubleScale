<?php

/**
 * MemberPress Trigger for Membership Enrolled
 *
 * This trigger will be fired when a user enrolls in a membership.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\MemberPress;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Membership Enrolled Trigger
 */
class Membership_Enrolled extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Membership Enrolled';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'memberpress_membership_enrolled';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user enrolls in a membership.';

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

Triggers_Manager::instance()->register( new Membership_Enrolled() );
