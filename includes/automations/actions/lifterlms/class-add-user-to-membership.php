<?php

/**
 * Class Add User To Membership (Pro Placeholder)
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\LifterLMS;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Add User To Membership
 */
class Add_User_To_Membership extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add User To Membership';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'lifterlms_add_user_to_membership';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a user to a LifterLMS membership.';

	/**
	 * Action Attributes
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

Add_User_To_Membership::instance();
