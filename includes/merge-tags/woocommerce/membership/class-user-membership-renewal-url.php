<?php

/**
 * Class User Membership Renewal URL
 *
 * This class is responsible for handling the user membership renewal URL merge tag
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
 * User Membership Renewal URL Merge Tag
 */
class User_Membership_Renewal_URL extends Merge_Tag {





	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'User Membership Renewal URL';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'user_membership_renewal_url';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'User Membership Renewal URL';

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
		$membership_renewal_url = $contact->get_data( 'membership_renewal_url' );

		return $membership_renewal_url ? $membership_renewal_url : '';
	}
}
Merge_Tags_Manager::instance()->register( new User_Membership_Renewal_URL() );
