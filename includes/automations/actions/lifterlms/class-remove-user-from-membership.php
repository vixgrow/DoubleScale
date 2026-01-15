<?php

/**
 * Class Remove User From Membership (Pro Placeholder)
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\LifterLMS;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Remove User From Membership
 */
class Remove_User_From_Membership extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove User From Membership';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'lifterlms_remove_user_from_membership';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove a user from a LifterLMS membership.';

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

Remove_User_From_Membership::instance();
