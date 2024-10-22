<?php
/**
 * Class User Groups Merge Tag
 *
 * This class is responsible for handling the user groups merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\LMS\LearnDash;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * User Groups Merge Tag
 */
class User_Groups extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'User Groups';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'groups';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'User Groups';

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
		$user_id = $contact->get_data( 'user_id' );

		$groups = learndash_get_users_group_ids( $user_id );

		$group_names = array();

		foreach ( $groups as $group_id ) {
			$group = get_post( $group_id );

			if ( $group ) {
				$group_names[] = $group->post_title;
			}
		}

		return implode( ', ', $group_names );
	}
}

Merge_Tags_Manager::instance()->register( new User_Groups() );
