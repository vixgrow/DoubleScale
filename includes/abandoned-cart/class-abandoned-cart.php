<?php
/**
 * Class Abandoned_Cart
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abandoned_Cart;

use QuillCRM\QuillCRM;
use QuillCRM\Utils;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Settings;

/**
 * Abandoned Cart Class.
 */
class Abandoned_Cart {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Abandoned_Cart
	 */
	private static $instance;

	/**
	 * Abandoned Cart Instance.
	 *
	 * Instantiates or reuses an instance of Abandoned Cart.
	 *
	 * @since  1.0.0
	 *
	 * @return Abandoned_Cart
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		if ( ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			return;
		}
		// Enqueue scripts to the checkout page.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// Ajax action to save the abandoned cart.
		add_action( 'wp_ajax_quillcrm_save_abandoned_cart', array( $this, 'save_abandoned_cart' ) );
		add_action( 'wp_ajax_nopriv_quillcrm_save_abandoned_cart', array( $this, 'save_abandoned_cart' ) );

		// Mark the cart as recovered when the order is processed.
		add_action( 'woocommerce_checkout_order_processed', array( $this, 'mark_as_recoverd' ), 1 );
		add_action( 'woocommerce_store_api_checkout_order_processed', array( $this, 'mark_as_recoverd' ), 1 );

		// Restore the abandoned cart.
		add_action( 'wp', array( $this, 'restore_abandoned_cart' ) );

		// Save the cart blocks.
		add_action( 'woocommerce_store_api_cart_update_customer_from_request', array( $this, 'save_cart_blocks' ) );

		add_action(
			'init',
			function() {
				QuillCRM::instance()->daily_tasks->register_callback( 'quillcrm_daily1', array( $this, 'check_lost_carts' ) );
				QuillCRM::instance()->abandoned_cart_tasks->register_callback( 'mark_cart_recoverable', array( $this, 'mark_cart_recoverable' ) );
			}
		);

		add_action( 'quillcrm_abandoned_cart_skipped', array( $this, 'skip_abandoned_cart' ) );
		add_action( 'quillcrm_abandoned_cart_processing', array( $this, 'mark_as_processing' ) );
	}

	/**
	 * Mark as Processing.
	 *
	 * @since 1.0.0
	 *
	 * @param string $cart_id Cart ID.
	 */
	public function mark_as_processing( $cart_id ) {
		error_log( 'mark_as_processing' );
		$abandoned_cart = Abandoned_Cart_Model::find( $cart_id );
		if ( empty( $abandoned_cart ) ) {
			return;
		}

		$abandoned_cart->status = 'processing';
		$abandoned_cart->save();
	}

	/**
	 * Mark as Recovered.
	 *
	 * @since 1.0.0
	 *
	 * @param \WC_Order $order Order.
	 */
	public function mark_as_recoverd( $order ) {
		if ( ! $order instanceof \WC_Order ) {
			return;
		}

		// Get session.
		$session = $this->get_session();
		if ( empty( $session ) ) {
			return;
		}

		// Get the abandoned cart.
		$abandoned_cart = Abandoned_Cart_Model::getByHashKey( $session );
		if ( empty( $abandoned_cart ) ) {
			return;
		}

		// Update the abandoned cart items.
		$items = array();
		foreach ( $order->get_items() as $item ) {
			$product_id   = $item->get_product_id();
			$variation_id = $item->get_variation_id();
			$quantity     = $item->get_quantity();
			$variation    = $item->get_meta_data();
			$variation    = wp_list_pluck( $variation, 'value', 'key' );

			$items[] = array(
				'product_id'   => $product_id,
				'variation_id' => $variation_id,
				'quantity'     => $quantity,
				'variation'    => $variation,
			);
		}

		$abandoned_cart->items    = $items;
		$abandoned_cart->status   = 'recovered';
		$abandoned_cart->order_id = $order->get_id();
		$abandoned_cart->save();

		// Clear the session.
		$this->clear_session();
	}

	/**
	 * Skip Abandoned Cart.
	 *
	 * @since 1.0.0
	 *
	 * @param string $cart_id Cart ID.
	 */
	public function skip_abandoned_cart( $cart_id ) {
		error_log( 'skip_abandoned_cart' );
		$abandoned_cart = Abandoned_Cart_Model::find( $cart_id );
		if ( empty( $abandoned_cart ) ) {
			return;
		}

		$abandoned_cart->status = 'skipped';
		$abandoned_cart->save();
	}

	/**
	 * Mark Cart Recoverable.
	 *
	 * @since 1.0.0
	 *
	 * @param string $cart_id Cart ID.
	 */
	public function mark_cart_recoverable( $cart_id ) {
		$abandoned_cart = Abandoned_Cart_Model::find( $cart_id );

		if ( empty( $abandoned_cart ) ) {
			return;
		}

		if ( $abandoned_cart->status === 'recovered' ) {
			return;
		}

		do_action( 'quillcrm_abandoned_cart_created', $abandoned_cart );
	}

	/**
	 * Check Lost Carts.
	 *
	 * @since 1.0.0
	 */
	public function check_lost_carts() {
		$settings       = Settings::get( 'cart', array() );
		$lost_cart_days = $settings['lost_cart_days'] ?? 15;

		// Get all carts that are pending and older than the lost cart days.
		$abandoned_carts = Abandoned_Cart_Model::where( 'status', 'pending' )
			->where( 'created_at', '<', strtotime( '-' . $lost_cart_days . ' days' ) )
			->get();

		if ( empty( $abandoned_carts ) ) {
			return;
		}

		foreach ( $abandoned_carts as $abandoned_cart ) {
			$abandoned_cart->status = 'lost';
			$abandoned_cart->save();
		}
	}

	/**
	 * Restore Abandoned Cart.
	 *
	 * @since 1.0.0
	 */
	public function restore_abandoned_cart() {
		$cart_id = sanitize_text_field( $_GET['quillcrm-cart-id'] ?? '' );
		if ( ! $cart_id || wp_doing_ajax() || is_admin() ) {
			return;
		}

		// Get the abandoned cart.
		$abandoned_cart = Abandoned_Cart_Model::where( 'hash_key', $cart_id )->where( 'status', 'pending' )->first();
		if ( empty( $abandoned_cart ) ) {
			return;
		}

		// Restore the cart.
		$this->restore_cart( $abandoned_cart );
	}

	/**
	 * Restore Cart.
	 *
	 * @since 1.0.0
	 *
	 * @param Abandoned_Cart_Model $abandoned_cart Abandoned Cart.
	 */
	public function restore_cart( $abandoned_cart ) {
		// Clear the cart.
		WC()->cart->empty_cart();

		// Restore the cart items.
		foreach ( $abandoned_cart->items as $item ) {
			$product_id   = $item['product_id'];
			$quantity     = $item['quantity'];
			$variation_id = $item['variation_id'] ?? null;
			$variation    = $item['variation'] ?? array();

			WC()->cart->add_to_cart( $product_id, $quantity, $variation_id, $variation );
		}

		// Restore the cart coupons.
		foreach ( $abandoned_cart->coupons as $coupon => $data ) {
			if ( WC()->cart->has_discount( $coupon ) ) {
				continue;
			}

			WC()->cart->add_discount( $coupon );
		}

		// Restore the cart fees.
		foreach ( $abandoned_cart->fees as $fee ) {
			WC()->cart->add_fee( $fee['name'], $fee['amount'] );
		}

		// Restore the cart taxes.
		foreach ( $abandoned_cart->taxes as $tax ) {
			WC()->cart->add_fee( $tax['name'], $tax['amount'] );
		}

		// Restore the cart shipping.
		WC()->cart->calculate_shipping();

		// Restore the cart total.
		WC()->cart->calculate_totals();

		// Restore fields.
		$fields = $abandoned_cart->fields;
		try {
			WC()->customer->set_props( $fields );
		} catch ( Error $e ) {

		}

		// Add new session.
		$this->save_session( $abandoned_cart->hash_key );

		// Redirect to the checkout page.
		wp_safe_redirect( wc_get_checkout_url() );
	}

	/**
	 * Enqueue Scripts.
	 *
	 * @since 1.0.0
	 */
	public function enqueue_scripts() {
		// check if the current page is the checkout page.
		if ( ! is_checkout() ) {
			return;
		}

		// Enqueue the abandoned cart script.
		wp_enqueue_script(
			'quillcrm-abandoned-cart',
			QUILLCRM_PLUGIN_URL . 'assets/js/abandoned-cart.js',
			array(),
			wp_rand(
				1,
				100
			),
			true
		);

		// Localize the script with the cart data.
		wp_localize_script(
			'quillcrm-abandoned-cart',
			'quillcrm_abandoned_cart',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'quillcrm_abandoned_cart' ),
			)
		);
	}

	/**
	 * Save Cart Blocks.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Data.
	 */
	public function save_cart_blocks( $customer ) {
		if ( ! $customer instanceof \WC_Customer || 0 === sizeof( WC()->cart->get_cart() ) ) {
			return false;
		}

		$fields = array(
			'billing_first_name'  => $customer->get_billing_first_name(),
			'billing_last_name'   => $customer->get_billing_last_name(),
			'billing_company'     => $customer->get_billing_company(),
			'billing_address_1'   => $customer->get_billing_address_1(),
			'billing_address_2'   => $customer->get_billing_address_2(),
			'billing_city'        => $customer->get_billing_city(),
			'billing_state'       => $customer->get_billing_state(),
			'billing_postcode'    => $customer->get_billing_postcode(),
			'billing_country'     => $customer->get_billing_country(),
			'billing_phone'       => $customer->get_billing_phone(),
			'billing_email'       => $customer->get_billing_email(),
			'shipping_first_name' => $customer->get_shipping_first_name(),
			'shipping_last_name'  => $customer->get_shipping_last_name(),
			'shipping_company'    => $customer->get_shipping_company(),
			'shipping_address_1'  => $customer->get_shipping_address_1(),
			'shipping_address_2'  => $customer->get_shipping_address_2(),
			'shipping_city'       => $customer->get_shipping_city(),
			'shipping_state'      => $customer->get_shipping_state(),
			'shipping_postcode'   => $customer->get_shipping_postcode(),
			'shipping_country'    => $customer->get_shipping_country(),
			'shipping_phone'      => $customer->get_shipping_phone(),
		);

		$data = array(
			'email'   => $customer->get_billing_email(),
			'fields'  => $fields,
			'coupons' => array(),
			'status'  => 'pending',
		);

		$items = WC()->cart->get_cart();
		if ( empty( $items ) ) {
			return;
		}

		$data['items'] = $items;
		// Check if there is coupons applied.
		$coupons = WC()->cart->get_applied_coupons();
		foreach ( $coupons as $coupon ) {
			$data['coupons'][ $coupon ] = array(
				'amount' => WC()->cart->get_coupon_discount_amount( $coupon ),
			);
		}

		$data['total']    = WC()->cart->get_total( 'raw' );
		$data['fees']     = WC()->cart->get_fees();
		$data['taxes']    = WC()->cart->get_taxes();
		$data['shipping'] = WC()->cart->get_shipping_total();
		$data['currency'] = get_woocommerce_currency();

		if ( is_user_logged_in() ) {
			$data['user_id'] = get_current_user_id();
		}

		$session = $this->get_session();
		if ( ! empty( $session ) ) {
			$update = $this->update( $session, $data );
			if ( $update ) {
				return;
			}
		}

		$data['hash_key'] = Utils::generate_hash_key();
		$this->save( $data );
		return;
	}

	/**
	 * Save Abandoned Cart.
	 *
	 * @since 1.0.0
	 */
	public function save_abandoned_cart() {
		// Verify the nonce.
		check_ajax_referer( 'quillcrm_abandoned_cart', 'nonce' );

		$fields = wp_unslash( $_POST['fields'] ) ?? null;
		if ( empty( $fields ) ) {
			wp_send_json_error( __( 'Fields are required.', 'quillcrm' ) );
		}

		$fields        = json_decode( $fields, true );
		$billing_email = sanitize_email( $fields['billing_email'] ) ?? '';
		if ( empty( $billing_email ) ) {
			wp_send_json_error( __( 'Email is required.', 'quillcrm' ) );
		}

		$data = array(
			'email'   => $billing_email,
			'fields'  => $fields,
			'coupons' => array(),
			'status'  => 'pending',
		);

		$items = WC()->cart->get_cart();
		error_log( print_r( $items, true ) );
		if ( empty( $items ) ) {
			wp_send_json_error( __( 'Cart is empty.', 'quillcrm' ) );
		}

		$data['items'] = $items;
		// Check if there is coupons applied.
		$coupons = WC()->cart->get_applied_coupons();
		foreach ( $coupons as $coupon ) {
			$data['coupons'][ $coupon ] = array(
				'amount' => WC()->cart->get_coupon_discount_amount( $coupon ),
			);
		}

		$data['total']    = WC()->cart->get_total( 'raw' );
		$data['fees']     = WC()->cart->get_fees();
		$data['taxes']    = WC()->cart->get_taxes();
		$data['shipping'] = WC()->cart->get_shipping_total();
		$data['currency'] = get_woocommerce_currency();

		if ( is_user_logged_in() ) {
			$data['user_id'] = get_current_user_id();
		}

		$session = $this->get_session();
		if ( ! empty( $session ) ) {
			$update = $this->update( $session, $data );
			if ( $update ) {
				wp_send_json_success();
			}
		}

		$data['hash_key'] = Utils::generate_hash_key();
		$abandoned_cart   = $this->save( $data );

		if ( $abandoned_cart ) {
			wp_send_json_success();
		} else {
			wp_send_json_error( __( 'Failed to save the abandoned cart.', 'quillcrm' ) );
		}
	}

	/**
	 * Save Abandoned Cart.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Data.
	 *
	 * @return Abandoned_Cart_Model|false
	 */
	public function save( $data ) {
		$settings    = Settings::get( 'cart', array() );
		$wait_period = $settings['wait_period'] ?? 1;
		$wait_period = $wait_period * 60;

		try {
			$abandoned_cart = Abandoned_Cart_Model::where( 'email', $data['email'] )->first();
			if ( ! empty( $abandoned_cart ) ) {
				$abandoned_cart->fill( $data );
				$abandoned_cart->save();
			} else {
				$abandoned_cart = Abandoned_Cart_Model::create( $data );
				QuillCRM::instance()->abandoned_cart_tasks->schedule_single( time() + $wait_period, 'mark_cart_recoverable', $abandoned_cart->id );
			}

			$this->save_session( $abandoned_cart->hash_key );
			return $abandoned_cart;
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Update Abandoned Cart.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hash_key Hash key.
	 * @param array  $data Data.
	 *
	 * @return Abandoned_Cart_Model|false
	 */
	public function update( $hash_key, $data ) {
		$settings    = Settings::get( 'cart', array() );
		$wait_period = $settings['wait_period'] ?? 1;
		$wait_period = $wait_period * 60;

		try {
			$abandoned_cart = Abandoned_Cart_Model::updateByHashKey( $hash_key, $data );
			if ( ! $abandoned_cart ) {
				return false;
			}
			QuillCRM::instance()->abandoned_cart_tasks->schedule_single( time() + $wait_period, 'mark_cart_recoverable', $abandoned_cart->id );
			return $abandoned_cart;
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Get session.
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_session() {
		return sanitize_text_field( $_COOKIE['quillcrm_abandoned_cart'] ?? '' );
	}

	/**
	 * Save Session.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hash_key Hash key.
	 */
	public function save_session( $hash_key ) {
		if ( empty( $hash_key ) ) {
			return;
		}
		// Save the hash key in the cookie.
		setcookie( 'quillcrm_abandoned_cart', $hash_key, time() + 3600 );
	}

	/**
	 * Clear Session.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function clear_session() {
		// Clear the hash key from the cookie.
		setcookie( 'quillcrm_abandoned_cart', '', time() - 3600 );
	}


}
