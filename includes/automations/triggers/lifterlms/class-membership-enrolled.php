<?php

/**
 * LifterLMS Trigger for Membership Enrolled (Pro Placeholder)
 * This trigger will be fired when a user is added to a membership level.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\LifterLMS;

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
	public $slug = 'lifterlms_membership_enrolled';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user is added to a LifterLMS membership level.';

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
	public $source = 'lms';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'lifterlms';
}

Triggers_Manager::instance()->register( new Membership_Enrolled() );
