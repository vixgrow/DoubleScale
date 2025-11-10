<?php

/**
 * Class Course Name Merge Tag
 *
 * This class is responsible for handling the course name merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\LearnDash;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Course Name Merge Tag
 */
class Course_Name extends Merge_Tag {





	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Course Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'course_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Course Name';

	/**
	 * Required Triggers
	 *
	 * @var array
	 */
	public $required_triggers = array( 'learndash_course_completed', 'learndash_lesson_completed', 'learndash_topic_completed', 'learndash_user_added_group', 'learndash_user_enrolled_course', 'learndash_user_left_course' );


	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'learndash';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$course_id = $contact->get_data( 'course_id' );
		$course    = get_post( $course_id );

		if ( ! $course ) {
			return '';
		}

		return $course->post_title ?? '';
	}
}

Merge_Tags_Manager::instance()->register( new Course_Name() );
