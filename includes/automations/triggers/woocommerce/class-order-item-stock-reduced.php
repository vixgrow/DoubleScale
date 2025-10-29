<?php

/**
 * WooCommerce Order Item Stock Reduced Trigger
 * This trigger will be fired when stock is reduced for an order item.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Automation_Model;
use WC_Order;
use WC_Order_Item_Product;

/**
 * Order Item Stock Reduced Trigger
 */
class Order_Item_Stock_Reduced extends Trigger {







	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'WooCommerce Order Item Stock Reduced';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_order_item_stock_reduced';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when stock is reduced for an order item.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'woocommerce';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'order';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'woocommerce_reduce_order_stock', array( $this, 'order_stock_reduced' ) );
	}

	/**
	 * Order Stock Reduced
	 *
	 * @since 1.0.0
	 *
	 * @param WC_Order $order Order object.
	 * @return void
	 */
	public function order_stock_reduced( $order ) {
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		$items = $order->get_items();

		// Loop through each product in the order
		foreach ( $items as $item_id => $item ) {
			if ( ! $item instanceof WC_Order_Item_Product ) {
				continue;
			}

			$product = $item->get_product();
			if ( ! $product ) {
				continue;
			}

			// Only process if product manages stock
			if ( ! $product->managing_stock() ) {
				continue;
			}

			$data = array(
				'first_name' => $order->get_billing_first_name(),
				'last_name'  => $order->get_billing_last_name(),
				'email'      => $order->get_billing_email(),
				'data'       => array(
					'order_id'       => $order->get_id(),
					'product_id'     => $product->get_id(),
					'product_name'   => $product->get_name(),
					'product_sku'    => $product->get_sku(),
					'quantity'       => $item->get_quantity(),
					'stock_quantity' => $product->get_stock_quantity(),
					'item_id'        => $item_id,
				),
			);

			$this->process( $data );
		}
	}

	/**
	 * Is Processable
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation
	 * @param array            $args
	 *
	 * @return bool
	 */
	public function is_processable( Automation_Model $automation, $args ) {
		return true;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}


	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array();
	}
}

Triggers_Manager::instance()->register( new Order_Item_Stock_Reduced() );
