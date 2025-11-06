<?php

/**
 * Class Membership Plan ID
 *
 * This class is responsible for handling the membership plan ID merge tag
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
 * Membership Plan ID Merge Tag
 */
class Membership_Plan_ID extends Merge_Tag {



	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Membership Plan ID';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'membership_plan_id';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Membership Plan ID';

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
		$plan_id = $contact->get_data( 'plan_id' );

		return $plan_id ? $plan_id : '';
	}
}

Merge_Tags_Manager::instance()->register( new Membership_Plan_ID() );
