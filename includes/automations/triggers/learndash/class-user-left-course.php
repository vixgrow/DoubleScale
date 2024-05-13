<?php
/**
 * LearnDash Trigger for Course Left
 * This trigger will be fired when a user leaves a course.
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
 * Course Left Trigger
 */
class User_Left_Course extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'User Left Course';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_user_left_course';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user leaves a course.';

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
		add_action( 'learndash_update_course_access', array( $this, 'course_left' ), 10, 4 );
	}

	/**
	 * Course Left
	 *
	 * @since 1.0.0
	 *
	 * @param int $user_id User ID.
	 * @param int $course_id Course ID.
	 * @param int $course_access_list Access List (comma separated).
	 * @param int $remove Remove.
	 * @return void
	 */
	public function course_left( $user_id, $course_id, $course_access_list, $remove ) {
		if ( ! $remove ) {
			return;
		}

		$user = get_user_by( 'ID', $user_id );
		if ( ! $user instanceof WP_User ) {
			return;
		}
		$data = array(
			'email' => $user->user_email,
			'data'  => array(
				'course_id'          => $course_id,
				'course_access_list' => $course_access_list,
			),
		);
		error_log( 'User Left Course:' . wp_json_encode( $data ) );
	}
}

Triggers_Manager::instance()->register( new User_Left_Course() );
