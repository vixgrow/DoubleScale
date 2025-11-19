<?php

/**
 * LearnDash Trigger for Course Enrolled
 * This trigger will be fired when a user enrolls in a course.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\LearnDash;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Course Enrolled Trigger
 */
class User_Enrolled_In_Course extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'User Enrolled in Course';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_user_enrolled_course';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user enrolls in a course.';

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

Triggers_Manager::instance()->register( new User_Enrolled_In_Course() );
