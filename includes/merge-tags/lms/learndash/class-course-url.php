<?php
/**
 * Class Course URL Merge Tag
 *
 * This class is responsible for handling the course URL merge tag
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
 * Course URL Merge Tag
 */
class Course_URL extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Course URL';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'course_url';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Course URL';

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
		$course_id  = $automation_contact->get_data( 'course_id' );
		$course_url = get_permalink( $course_id );

		return $course_url ? $course_url : '';
	}
}

Merge_Tags_Manager::instance()->register( new Course_URL() );
