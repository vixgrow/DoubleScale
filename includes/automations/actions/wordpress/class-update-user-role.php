<?php

/**
 * Update User Role Action
 * This action will update the user role.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Wordpress\Actions;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Update User Role Action
 */
class Update_User_Role extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update User Role';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_user_role';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the user role.';

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
	public $source = 'wp';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'user';
}

Update_User_Role::instance();
