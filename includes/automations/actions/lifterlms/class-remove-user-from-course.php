<?php

/**
 * Class Remove User From Course (Pro Placeholder)
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\LifterLMS;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Remove User From Course
 */
class Remove_User_From_Course extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove User From Course';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'lifterlms_remove_user_from_course';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove a user from a LifterLMS course.';

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

Remove_User_From_Course::instance();
