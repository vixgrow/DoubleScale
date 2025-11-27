<?php

/**
 * WooCommerce Cart Recovered Trigger
 * This trigger will be fired when an abandoned cart is recovered (customer completes purchase).
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Cart;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use WC_Order;

/**
 * Cart Recovered Trigger
 */
class Cart_Recovered extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Cart Recovered';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_cart_recovered';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when an abandoned cart is recovered (customer completes purchase).';

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
	public $group = 'cart';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'quillcrm_abandoned_cart_recovered', array( $this, 'check_cart_recovery' ), 10, 1 );
	}

	/**
	 * Check Cart Recovery
	 *
	 * @since 1.0.0
	 *
	 * @param Abandoned_Cart_Model $abandoned_cart Abandoned cart object.
	 *
	 * @return void
	 */
	public function check_cart_recovery( $abandoned_cart ) {
		if ( ! $abandoned_cart instanceof Abandoned_Cart_Model ) {
			return;
		}

		// Get the order
		$order_id = $abandoned_cart->order_id ?? 0;
		if ( empty( $order_id ) ) {
			return;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		// Get customer email
		$customer_email = $order->get_billing_email();
		if ( empty( $customer_email ) ) {
			return;
		}

		$data = array(
			'first_name' => $order->get_billing_first_name(),
			'last_name'  => $order->get_billing_last_name(),
			'email'      => $customer_email,
			'data'       => array(
				'order_id'          => $order->get_id(),
				'abandoned_cart_id' => $abandoned_cart->id,
				'recovery_time'     => current_time( 'mysql' ),
				'cart_total'        => $abandoned_cart->total ?? 0,
				'order_total'       => $order->get_total(),
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
		// Check minimum cart value if specified
		$min_cart_value = $automation->get_setting( 'min_cart_value', 0 );
		if ( $min_cart_value > 0 ) {
			$cart_total = $args['data']['cart_total'] ?? 0;
			if ( $cart_total < $min_cart_value ) {
				return false;
			}
		}

		// Check recovery time frame if specified
		$max_recovery_days = $automation->get_setting( 'max_recovery_days', 0 );
		if ( $max_recovery_days > 0 ) {
			$abandoned_cart_id = $args['data']['abandoned_cart_id'] ?? 0;
			if ( $abandoned_cart_id ) {
				$abandoned_cart = new Abandoned_Cart_Model( $abandoned_cart_id );
				if ( $abandoned_cart->created_at ) {
					$days_since_abandonment = ( time() - strtotime( $abandoned_cart->created_at ) ) / DAY_IN_SECONDS;
					if ( $days_since_abandonment > $max_recovery_days ) {
						return false;
					}
				}
			}
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
			'min_cart_value'    => array(
				'type'        => 'number',
				'label'       => __( 'Minimum Cart Value', 'quillcrm' ),
				'description' => __( 'Only trigger for recovered carts above this value (optional).', 'quillcrm' ),
				'placeholder' => __( '0.00', 'quillcrm' ),
				'step'        => '0.01',
				'min'         => '0',
			),
			'max_recovery_days' => array(
				'type'        => 'number',
				'label'       => __( 'Maximum Recovery Days', 'quillcrm' ),
				'description' => __( 'Only trigger for carts recovered within this many days (optional, 0 = no limit).', 'quillcrm' ),
				'placeholder' => __( '30', 'quillcrm' ),
				'min'         => '0',
				'step'        => '1',
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
				'min_cart_value'    => array(
					'type' => 'number',
				),
				'max_recovery_days' => array(
					'type' => 'integer',
				),
			),
		);
	}
}

Triggers_Manager::instance()->register( new Cart_Recovered() );
