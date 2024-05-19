<?php
/**
 * Class Order_Confirmation_URL
 *
 * This class is responsible for handling the order confirmation URL merge tag
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
 * Order Confirmation URL Merge Tag
 */
class Order_Confirmation_URL extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Confirmation URL';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'confirmation_url';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Confirmation URL';

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

		$confirmation_url = $order->get_checkout_order_received_url();

		return $confirmation_url;
	}
}

Merge_Tags_Manager::instance()->register( new Order_Confirmation_URL() );
