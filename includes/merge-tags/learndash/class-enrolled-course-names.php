<?php

/**
 * Class Enrolled Course Names Merge Tag
 *
 * This class is responsible for handling the enrolled course names merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\LearnDash;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Enrolled Course Names Merge Tag
 */
class Enrolled_Course_Names extends Merge_Tag {




	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Enrolled Course Names (Comma Separated)';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'enrolled_course_names';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Enrolled Course Names';

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
		$contact_id = $contact->contact_id;
		$contact    = Contact_Model::find( $contact_id );

		if ( ! $contact ) {
			return '';
		}

		$user = get_user_by( 'email', $contact->email );

		if ( ! $user ) {
			return '';
		}

		$enrolled_courses = ld_get_mycourses( $user->ID );
		$course_names     = array();

		foreach ( $enrolled_courses as $course_id ) {
			$course_names[] = get_the_title( $course_id );
		}

		return implode( ', ', $course_names );
	}
}

Merge_Tags_Manager::instance()->register( new Enrolled_Course_Names() );
