<?php

/**
 * LearnDash Trigger for Lesson Completed
 * This trigger will be fired when a user completes a lesson.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\LearnDash;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Lesson Completed Trigger
 */
class Lesson_Completed extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Lesson Completed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_lesson_completed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user completes a lesson.';

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

Triggers_Manager::instance()->register( new Lesson_Completed() );
