<?php

/**
 * Class Membership Plan Name
 *
 * This class is responsible for handling the membership plan name merge tag
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
 * Membership Plan Name Merge Tag
 */
class Membership_Plan_Name extends Merge_Tag {



	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Membership Plan Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'membership_plan_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Membership Plan Name';

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
		$plan_name = $contact->get_data( 'plan_name' );

		return $plan_name ? $plan_name : '';
	}
}

Merge_Tags_Manager::instance()->register( new Membership_Plan_Name() );
