<?php

/**
 * LearnDash Trigger for User Added to Group
 * This trigger will be fired when a user is added to a group.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\LearnDash;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * User Added to Group Trigger
 */
class User_Added_To_Group extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'User Added to Group';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_user_added_group';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user is added to a group.';

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
	public $group = 'learndash';
}

Triggers_Manager::instance()->register( new User_Added_To_Group() );
