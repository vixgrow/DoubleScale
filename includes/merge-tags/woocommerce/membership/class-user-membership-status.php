<?php

/**
 * Class User Membership Status
 *
 * This class is responsible for handling the user membership status merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\WooCommerce\Membership;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * User Membership Status Merge Tag
 */
class User_Membership_Status extends Merge_Tag {



	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'User Membership Status';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'user_membership_status';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'User Membership Status';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'membership';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$status = $contact->get_data( 'status' );

		return $status ? $status : '';
	}
}

Merge_Tags_Manager::instance()->register( new User_Membership_Status() );
