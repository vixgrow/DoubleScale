<?php
/**
 * Class Customer ID
 *
 * This class is responsible for handling the customer ID merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\EDD\Customer;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Customer ID Merge Tag
 */
class Customer_ID extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Customer ID';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'id';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Customer ID';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'edd_customer';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		$customer_id = $automation_contact->get_data( 'customer_id' );

		return $customer_id;
	}
}

Merge_Tags_Manager::instance()->register( new Customer_ID() );
