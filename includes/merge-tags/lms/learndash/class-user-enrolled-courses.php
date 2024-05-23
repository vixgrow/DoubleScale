<?php
/**
 * Class User Enrolled Courses Merge Tag
 *
 * This class is responsible for handling the user enrolled courses merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\LMS\LearnDash;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * User Enrolled Courses Merge Tag
 */
class User_Enrolled_Courses extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'User Enrolled Courses';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'enrolled_courses';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'User Enrolled Courses';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'learndash';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		$user_id = $automation_contact->get_data( 'user_id' );
		$user    = get_user_by( 'ID', $user_id );
		if ( ! $user instanceof \WP_User ) {
			return '';
		}

		$enrolled_courses = ld_get_mycourses( $user_id );
		$course_names     = array();
		foreach ( $enrolled_courses as $course ) {
			$course_names[] = get_the_title( $course->ID );
		}

		return implode( ', ', $course_names );
	}
}

Merge_Tags_Manager::instance()->register( new User_Enrolled_Courses() );
