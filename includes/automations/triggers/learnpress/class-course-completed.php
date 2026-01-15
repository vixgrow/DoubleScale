<?php

/**
 * LearnPress Trigger for Course Completed (Pro Placeholder)
 * This trigger will be fired when a user completes a course.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\LearnPress;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Course Completed Trigger
 */
class Course_Completed extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Course Completed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'learnpress_course_completed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user completes a LearnPress course.';

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
	public $group = 'learnpress';
}

Triggers_Manager::instance()->register( new Course_Completed() );
