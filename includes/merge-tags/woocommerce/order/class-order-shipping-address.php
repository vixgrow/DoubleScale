<?php
/**
 * Class Order Shipping Address
 *
 * This class is responsible for handling the order shipping address merge tag
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
 * Order Shipping Address Merge Tag
 */
class Order_Shipping_Address extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Shipping Address';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'shipping_address';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Shipping Address';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'order';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model automation_contact Contact Model.
	 * @param string                                                    $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		$order_id = $automation_contact->get_data( 'order_id' );
		$order    = wc_get_order( $order_id );
		if ( ! $order instanceof \WC_Order ) {
			return '';
		}

		// Formats available: default, comma, address_1, address_2.
		$format           = $this->get_format( $merge_tag );
		$address          = apply_filters( 'woocommerce_order_formatted_shipping_address', $order->get_address( 'shipping' ), $order );
		$formated_address = '';
		switch ( $format ) {
			case 'default':
				$formated_address = WC()->countries->get_formatted_address( $address, '' );
				break;
			case 'comma':
				$formated_address = WC()->countries->get_formatted_address( $address, ', ' );
				break;
			case 'address_1':
				$formated_address = $address['address_1'];
				break;
			case 'address_2':
				$formated_address = $address['address_2'];
				break;
		}

		return $formated_address ? $formated_address : '';
	}

	/**
	 * Get the format from the merge tag
	 *
	 * @param string $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	private function get_format( $merge_tag ) {
		$format  = 'comma';
		$matches = array();
		preg_match( '/format=\'(.*?)\'/', $merge_tag, $matches );
		if ( ! empty( $matches[1] ) ) {
			$format = $matches[1];
		}

		return $format;
	}
}

Merge_Tags_Manager::instance()->register( new Order_Shipping_Address() );
