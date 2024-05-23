<?php
/**
 * Order Payment URL Merge Tag
 *
 * This class is responsible for handling the order payment URL merge tag
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
 * Order Payment URL Merge Tag
 */
class Order_Payment_URL extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Payment URL';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'payment_url';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Payment URL';

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

		$payment_url = $order->get_checkout_payment_url();

		return $payment_url;
	}
}

Merge_Tags_Manager::instance()->register( new Order_Payment_URL() );
