<?php
/**
 * Class Customer Email
 *
 * This class is responsible for handling the customer email merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\EDD\Customer;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Customer Email Merge Tag
 */
class Customer_Email extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Customer Email';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'email';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Customer Email';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'edd_customer';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$customer_id = $contact->get_data( 'customer_id' );
		$customer    = edd_get_customer( $customer_id );
		if ( ! $customer ) {
			return '';
		}

		return $customer->email;
	}
}

Merge_Tags_Manager::instance()->register( new Customer_Email() );
