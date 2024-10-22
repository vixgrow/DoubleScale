<?php
/**
 * Class Candidate Name Merge Tag
 *
 * This class is responsible for handling the candidate name merge tag
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
 * Candidate Name Merge Tag
 */
class Candidate_Name extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Candidate Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'candidate_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Candidate Name';

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
		$user    = get_user_by( 'ID', $user_id );
		if ( ! $user instanceof \WP_User ) {
			return '';
		}

		$first_name = $user->first_name;
		$last_name  = $user->last_name;
		$full_name  = $first_name . ' ' . $last_name;

		return $full_name;
	}
}

Merge_Tags_Manager::instance()->register( new Candidate_Name() );
