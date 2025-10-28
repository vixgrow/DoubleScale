<?php

/**
 * Class Enrolled Group Names Merge Tag
 *
 * This class is responsible for handling the enrolled group names merge tag
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
 * Enrolled Group Names Merge Tag
 */
class Enrolled_Group_Names extends Merge_Tag {


	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Enrolled Group Names (Comma Separated)';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'enrolled_group_names';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Enrolled Group Names';

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

		$enrolled_groups = learndash_get_users_group_ids( $user->ID );
		$group_names     = array();

		foreach ( $enrolled_groups as $group_id ) {
			$group_names[] = get_the_title( $group_id );
		}

		return implode( ', ', $group_names );
	}
}

Merge_Tags_Manager::instance()->register( new Enrolled_Group_Names() );
