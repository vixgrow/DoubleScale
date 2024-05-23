<?php
/**
 * Class Topic_Name Merge Tag
 *
 * This class is responsible for handling the topic name merge tag
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
 * Topic Name Merge Tag
 */
class Topic_Name extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Topic Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'topic_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Topic Name';

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
		$topic_id = $automation_contact->get_data( 'topic_id' );

		$topic = get_post( $topic_id );

		if ( ! empty( $topic ) ) {
			return $topic->post_title;
		}

		return '';
	}
}

Merge_Tags_Manager::instance()->register( new Topic_Name() );
