<?php

/**
 * WooCommerce Order Completed Trigger
 * This trigger will be fired when an order is completed.
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Triggers\Woocommerce\Order;

use DoubleScale\Modules\Automations\Abstracts\Trigger;
use WC_Order;

/**
 * Order Completed Trigger
 */
class OrderCompleted extends Trigger
{
	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Order Completed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_order_completed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when an order is completed.';

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
	public function load_hooks()
	{
		add_action('woocommerce_order_status_completed', array($this, 'order_completed'));
	}

	/**
	 * Order Completed
	 *
	 * @since 1.0.0
	 *
	 * @param int $order_id Order ID.
	 *
	 * @return void
	 */
	public function order_completed($order_id)
	{
		$order = \wc_get_order($order_id);
		if (! $order instanceof WC_Order) {
			return;
		}

		$data = array(
			'first_name' => $order->get_billing_first_name(),
			'last_name'  => $order->get_billing_last_name(),
			'email'      => $order->get_billing_email(),
			'data'       => array(
				'order_id' => $order->get_id(),
			),
		);

		$this->process($data);
	}
}
