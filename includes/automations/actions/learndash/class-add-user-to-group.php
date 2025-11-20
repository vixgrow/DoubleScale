<?php

/**
 * Class Add User To Group
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\LearnDash;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Add User To Group
 */
class Add_User_To_Group extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add User To Group';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_add_user_to_group';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a user to a group.';

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
	public $group = 'learndash';
}

Add_User_To_Group::instance();
