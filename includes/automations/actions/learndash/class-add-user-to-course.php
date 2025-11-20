<?php

/**
 * Class Add User To Course
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\LearnDash;

use QuillCRM\Abstracts\Action_Pro;


/**
 * Add User To Course
 */
class Add_User_To_Course extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add User To Course';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_add_user_to_course';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a user to a course.';

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

Add_User_To_Course::instance();
