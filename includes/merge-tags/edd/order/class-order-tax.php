<?php
/**
 * Class Order Tax Merge Tag
 *
 * This class is responsible for handling the order tax merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\EDD\Order;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Order Tax Merge Tag
 */
class Order_Tax extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Tax';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'tax';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Tax';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'edd_order';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		$payment_id = $automation_contact->get_data( 'payment_id' );
		$payment    = edd_get_payment( $payment_id );
		if ( ! $payment ) {
			return '';
		}

		$tax = $payment->get_tax();

		return $tax;
	}
}

Merge_Tags_Manager::instance()->register( new Order_Tax() );
