<?php

/**
 * WooCommerce Order Created Trigger
 * This trigger will be fired when an order is created.
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
use QuillCRM\Constants\Order_Status;

/**
 * Order Created Trigger
 */
class Order_Created extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Order Created';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_order_created';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a new order is created in WooCommerce.';

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
		add_action( 'woocommerce_new_order', array( $this, 'order_created' ) );
		add_action( 'woocommerce_order_status_changed', array( $this, 'order_status_changed' ), 10, 3 );
	}

	/**
	 * Order Created
	 *
	 * @since 1.0.0
	 *
	 * @param int $order_id Order ID.
	 * @return void
	 */
	public function order_created( $order_id ) {
		$order = \wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		/**
		 * WooCommerce Order Statuses
		 *
		 * @link https://docs.woocommerce.com/document/managing-orders/
		 *
		 * 1. wc-pending - Pending payment
		 * 2. wc-processing - Processing
		 * 3. wc-on-hold - On hold
		 * 4. wc-completed - Completed
		 * 5. wc-cancelled - Cancelled
		 * 6. wc-refunded - Refunded
		 * 7. wc-failed - Failed
		 * 8. wc-checkout-draft - Checkout Draft
		 */
		$status = 'wc-' . $order->get_status(); // Add 'wc-' prefix to the status
		$data   = array(
			'first_name' => $order->get_billing_first_name(),
			'last_name'  => $order->get_billing_last_name(),
			'email'      => $order->get_billing_email(),
			'data'       => array(
				'order_id' => $order->get_id(),
				'status'   => $status,
			),
		);

		$this->process( $data );
	}

	/**
	 * Order Status Changed
	 *
	 * @since 1.0.0
	 *
	 * @param int    $order_id Order ID.
	 * @param string $old_status Old Status.
	 * @param string $new_status New Status.
	 * @return void
	 */
	public function order_status_changed( $order_id, $old_status, $new_status ) {
		$order = \wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return;
		}
		$new_status = 'wc-' . $new_status; // Add 'wc-' prefix to the status

		$data = array(
			'first_name' => $order->get_billing_first_name(),
			'last_name'  => $order->get_billing_last_name(),
			'email'      => $order->get_billing_email(),
			'data'       => array(
				'order_id' => $order->get_id(),
				'status'   => $new_status,
			),
		);

		$this->process( $data );
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
		$status              = $args['data']['status'] ?? '';
		$automation_statuses = $automation->get_setting( 'statuses', array() );

		if ( ! in_array( $status, $automation_statuses, true ) ) {
			return false;
		}

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
		return array(
			'statuses' => array(
				'type'    => 'multiselect',
				'label'   => __( 'Order Statuses', 'quillcrm' ),
				'options' => Order_Status::get_all(),
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'statuses' => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'string',
					),
				),
			),
		);
	}
}

Triggers_Manager::instance()->register( new Order_Created() );
