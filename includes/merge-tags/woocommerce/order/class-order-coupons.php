<?php
/**
 * Class Order Coupons Merge Tag
 *
 * This class is responsible for handling the order coupons merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\WooCommerce\Order;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Order Coupons Merge Tag
 */
class Order_Coupons extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Coupons';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'coupons';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Coupons';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'order';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		$order_id = $automation_contact->get_data( 'order_id' );
		$order    = wc_get_order( $order_id );
		if ( ! $order instanceof \WC_Order ) {
			return '';
		}

		$coupons = $order->get_coupon_codes();

		return ! empty( $coupons ) ? implode( ', ', $coupons ) : '';
	}
}

Merge_Tags_Manager::instance()->register( new Order_Coupons() );
