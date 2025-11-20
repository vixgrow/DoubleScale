<?php

/**
 * Update User Meta Action
 *
 * This action will update the user meta.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Wordpress\Actions;


use QuillCRM\Abstracts\Action_Pro;

/**
 * Update User Meta Action
 */
class Update_User_Meta extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update User Meta';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_user_meta';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the user meta.';


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

Update_User_Meta::instance();
