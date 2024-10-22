<?php
/**
 * Class Order View URL Merge Tag
 *
 * This class is responsible for handling the order view URL merge tag
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
 * Order View URL Merge Tag
 */
class Order_View_URL extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order View URL';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'view_url';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order View URL';

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

		return $order->get_view_order_url();
	}
}

Merge_Tags_Manager::instance()->register( new Order_View_URL() );
