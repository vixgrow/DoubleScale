<?php
/**
 * Class Order Status
 *
 * This class is responsible for handling the order status merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\EDD\Order;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Order Status Merge Tag
 */
class Order_Status extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Status';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'status';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Status';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'edd_order';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$payment_id = $contact->get_data( 'payment_id' );
		$payment    = edd_get_payment( $payment_id );
		if ( ! $payment ) {
			return '';
		}

		$status = $payment->status;

		return $status;
	}
}

Merge_Tags_Manager::instance()->register( new Order_Status() );
