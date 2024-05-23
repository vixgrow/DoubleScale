<?php
/**
 * Class Order Items
 *
 * This class is responsible for handling the order items merge tag
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
 * Order Items Merge Tag
 */
class Order_Items_Count extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Items Count';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'items_count';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Items Count';

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

		$items = edd_get_payment_meta_cart_details( $payment_id );

		return count( $items );
	}
}

Merge_Tags_Manager::instance()->register( new Order_Items_Count() );
