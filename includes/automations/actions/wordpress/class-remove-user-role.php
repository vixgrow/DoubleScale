<?php

/**
 * Remove User Role Action
 * This action will remove a user role.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Wordpress\Actions;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Remove User Role Action
 */
class Remove_User_Role extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove User Role';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'remove_user_role';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove a user role.';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'wp';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'user';
}

Remove_User_Role::instance();
