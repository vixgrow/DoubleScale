<?php

/**
 * Create User Action
 * This action will create a new user.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Wordpress\Actions;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Create User Action
 */
class Create_User extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Create User';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'create_user';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will create a new user.';

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

Create_User::instance();
