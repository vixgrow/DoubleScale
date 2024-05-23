<?php
/**
 * Class Purchase Value
 *
 * This class is responsible for handling the purchase value merge tag
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
 * Purchase Value Merge Tag
 */
class Purchase_Value extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Purchase Value';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'purchase_value';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Purchase Value';

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
		$customer    = edd_get_customer( $customer_id );
		if ( ! $customer ) {
			return '';
		}

		$purchase_value = $customer->purchase_value;

		return $purchase_value;
	}
}

Merge_Tags_Manager::instance()->register( new Purchase_Value() );
