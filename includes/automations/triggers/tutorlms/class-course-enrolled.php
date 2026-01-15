<?php

/**
 * TutorLMS Trigger for Course Enrolled (Pro Placeholder)
 * This trigger will be fired when a user enrolls in a course.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\TutorLMS;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Course Enrolled Trigger
 */
class Course_Enrolled extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Course Enrolled';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'tutorlms_course_enrolled';

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
	public $group = 'tutorlms';
}

Triggers_Manager::instance()->register( new Course_Enrolled() );
