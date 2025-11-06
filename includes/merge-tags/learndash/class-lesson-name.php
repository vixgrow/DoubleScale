<?php

/**
 * Class for Lesson Name Merge Tag
 *
 * This class is responsible for handling the lesson name merge tag
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
 * Lesson Name Merge Tag
 */
class Lesson_Name extends Merge_Tag {


	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Lesson Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'lesson_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Lesson Name';

	/**
	 * Required Triggers
	 *
	 * @var array
	 */
	public $required_triggers = array( 'learndash_lesson_completed' );

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
		$lesson_id = $contact->get_data( 'lesson_id' );
		$lesson    = get_post( $lesson_id );

		if ( ! $lesson ) {
			return '';
		}

		return $lesson->post_title;
	}
}

Merge_Tags_Manager::instance()->register( new Lesson_Name() );
