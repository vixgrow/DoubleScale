<?php

/**
 * Class Group Name Merge Tag
 *
 * This class is responsible for handling the group name merge tag
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
 * Group Name Merge Tag
 */
class Group_Name extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Group Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'group_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Group Name';

	/**
	 * Required Triggers
	 *
	 * @var array
	 */
	public $required_triggers = array( 'learndash_user_added_group' );

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
		$group_id = $contact->get_data( 'group_id' );

		$group = get_post( $group_id );
		if ( ! empty( $group ) ) {
			return $group->post_title;
		}

		return '';
	}
}

Merge_Tags_Manager::instance()->register( new Group_Name() );
