<?php
/**
 * Class Order Number
 *
 * This class is responsible for handling the order number merge tag
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
 * Order Number Merge Tag
 */
class Order_Number extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Number';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'number';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Number';

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
		$order      = edd_get_payment( $payment_id );
		if ( ! $order ) {
			return '';
		}

		return $order->number;
	}
}

Merge_Tags_Manager::instance()->register( new Order_Number() );
