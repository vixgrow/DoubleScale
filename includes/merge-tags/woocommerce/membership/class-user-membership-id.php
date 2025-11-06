<?php

/**
 * Class User Membership ID
 *
 * This class is responsible for handling the user membership ID merge tag
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
 * User Membership ID Merge Tag
 */
class User_Membership_ID extends Merge_Tag {






	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'User Membership ID';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'user_membership_id';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'User Membership ID';

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
		$user_membership_id = $contact->get_data( 'user_membership_id' );

		return $user_membership_id ? $user_membership_id : '';
	}
}

Merge_Tags_Manager::instance()->register( new User_Membership_ID() );
