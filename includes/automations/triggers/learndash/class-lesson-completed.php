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

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use WP_User;

/**
 * Lesson Completed Trigger
 */
class Lesson_Completed extends Trigger {

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
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'learndash_lesson_completed', array( $this, 'lesson_completed' ), 10, 1 );
	}

	/**
	 * Lesson Completed
	 *
	 * @since 1.0.0
	 *
	 * @param array $lesson Lesson.
	 * @return void
	 */
	public function lesson_completed( $lesson ) {
		$user_id   = $lesson['user']->ID;
		$course_id = $lesson['course']->ID;
		$lesson_id = $lesson['lesson']->ID;
		$progress  = $lesson['progress'];

		$user = get_user_by( 'ID', $user_id );
		if ( ! $user instanceof WP_User ) {
			return;
		}

		$data = array(
			'email' => $user->user_email,
			'data'  => array(
				'course_id' => $course_id,
				'lesson_id' => $lesson_id,
				'progress'  => $progress,
			),
		);

		$this->process( $data );
	}
}

Triggers_Manager::instance()->register( new Lesson_Completed() );
