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

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use WP_User;

/**
 * Course Enrolled Trigger
 */
class User_Enrolled_In_Course extends Trigger {

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
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'learndash_update_course_access', array( $this, 'course_enrolled' ), 10, 4 );
	}

	/**
	 * Course Enrolled
	 *
	 * @since 1.0.0
	 *
	 * @param int    $user_id User ID.
	 * @param int    $course_id Course ID.
	 * @param string $course_access_list Course Access List (comma separated).
	 * @param bool   $remove Remove.
	 * @return void
	 */
	public function course_enrolled( $user_id, $course_id, $course_access_list, $remove ) {
		if ( $remove ) {
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
		error_log( 'User Enrolled in Course:' . wp_json_encode( $data ) );
	}
}

Triggers_Manager::instance()->register( new User_Enrolled_In_Course() );
