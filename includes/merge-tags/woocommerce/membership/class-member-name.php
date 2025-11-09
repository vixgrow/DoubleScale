<?php

/**
 * Class Member Name
 *
 * This class is responsible for handling the member name merge tag
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
 * Member Name Merge Tag
 */
class Member_Name extends Merge_Tag {





	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Member Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'wcm_member_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Member Name';

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
		$member_name = $contact->get_data( 'member_name' );

		return $member_name;
	}
}

Merge_Tags_Manager::instance()->register( new Member_Name() );
