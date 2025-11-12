<?php

/**
 * Class Membership End Date
 *
 * This class is responsible for handling the membership end date merge tag
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
 * Membership End Date Merge Tag
 */
class Membership_End_Date extends Merge_Tag {




	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Membership End Date';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'membership_end_date';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Membership End Date';

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
		$end_date = $contact->get_data( 'end_date' );
		return $end_date ? $end_date : '';
	}
}

Merge_Tags_Manager::instance()->register( new Membership_End_Date() );
