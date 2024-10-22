<?php
/**
 * Order Tax Merge Tag
 *
 * This class is responsible for handling the order tax merge tag
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
	public $group = 'order';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$order_id = $contact->get_data( 'order_id' );
		$order    = wc_get_order( $order_id );

		if ( ! $order instanceof \WC_Order ) {
			return '';
		}

		$tax = $order->get_total_tax();

		return $tax ? $tax : 0;
	}
}

Merge_Tags_Manager::instance()->register( new Order_Tax() );
