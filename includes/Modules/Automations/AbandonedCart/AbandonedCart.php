<?php

/**
 * Class AbandonedCart
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\AbandonedCart;


defined( 'ABSPATH' ) || exit;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use DoubleScale\Core\PluginKernel;
use DoubleScale\Core\Utils\Utils;
use DoubleScale\Modules\Automations\Models\AbandonedCartModel;
use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Contacts\Models\ContactModel;

/**
 * Abandoned Cart Class.
 */
class AbandonedCart {



	/**
	 * Settings.
	 *
	 * @var array
	 */
	private $settings;

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var AbandonedCart
	 */
	private static $instance;

	/**
	 * Abandoned Cart Instance.
	 *
	 * Instantiates or reuses an instance of Abandoned Cart.
	 *
	 * @since 1.0.0
	 *
	 * @return AbandonedCart
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
		 $this->settings = Settings::get( 'cart', array() );
		if ( ! doublescale_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			return;
		}
		// Enqueue scripts to the checkout page.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// Ajax action to save the abandoned cart.
		add_action( 'wp_ajax_doublescale_save_abandoned_cart', array( $this, 'save_abandoned_cart' ) );
		add_action( 'wp_ajax_nopriv_doublescale_save_abandoned_cart', array( $this, 'save_abandoned_cart' ) );
		add_action( 'wp_ajax_doublescale_opt_out_abandoned_cart', array( $this, 'opt_out_abandoned_cart' ) );
		add_action( 'wp_ajax_nopriv_doublescale_opt_out_abandoned_cart', array( $this, 'opt_out_abandoned_cart' ) );

		// Mark the cart as recovered when the order is processed.
		add_action( 'woocommerce_checkout_order_processed', array( $this, 'mark_as_recoverd' ), 1 );
		add_action( 'woocommerce_store_api_checkout_order_processed', array( $this, 'mark_as_recoverd' ), 1 );

		// Restore the abandoned cart.
		add_action( 'wp', array( $this, 'restore_abandoned_cart' ) );

		// Save the cart blocks.
		add_action( 'woocommerce_store_api_cart_update_customer_from_request', array( $this, 'save_cart_blocks' ) );

		add_action(
			'init',
			function () {
				PluginKernel::instance()->daily_tasks->register_callback( 'doublescale_daily', array( $this, 'check_lost_carts' ) );
				PluginKernel::instance()->daily_tasks->register_callback( 'doublescale_daily', array( $this, 'check_cooling_off' ) );
				PluginKernel::instance()->abandoned_cart_tasks->register_callback( 'mark_cart_recoverable', array( $this, 'mark_cart_recoverable' ) );
			}
		);

		add_action( 'doublescale_abandoned_cart_skipped', array( $this, 'skip_abandoned_cart' ) );
		add_action( 'doublescale_abandoned_cart_processing', array( $this, 'mark_as_processing' ) );
	}

	/**
	 * Opt Out Abandoned Cart.
	 *
	 * @since 1.0.0
	 */
	public function opt_out_abandoned_cart() {
		// Verify the nonce.
		check_ajax_referer( 'doublescale_abandoned_cart', 'nonce' );

		$this->set_skip_session();
		$session = $this->get_session();
		if ( ! empty( $session ) ) {
			$abandoned_cart = AbandonedCartModel::getByHashKey( $session );
			if ( empty( $abandoned_cart ) ) {
				wp_send_json_error( __( 'Abandoned cart not found.', 'doublescale') );
			}

			$abandoned_cart->status = 'opt-out';
			$abandoned_cart->save();

			$this->clear_session();
		}

		wp_send_json_success(
			array(
				'message' => __( 'You have successfully opted out of abandoned cart emails.', 'doublescale'),
			)
		);
	}

	/**
	 * Mark as Processing.
	 *
	 * @since 1.0.0
	 *
	 * @param string $cart_id Cart ID.
	 */
	public function mark_as_processing( $cart_id ) {
		$abandoned_cart = AbandonedCartModel::find( $cart_id );
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

		// Try to get session from cookie first.
		$session = $this->get_session();

		// Fallback: Try to get from WC session.
		if ( empty( $session ) && WC()->session ) {
			$session = WC()->session->get( 'doublescale_cart_hash' );
		}

		$abandoned_cart = null;

		// Try to get abandoned cart by hash key.
		if ( ! empty( $session ) ) {
			$abandoned_cart = AbandonedCartModel::getByHashKey( $session );
		}

		// Fallback: Try to find by email if hash key method failed.
		if ( empty( $abandoned_cart ) ) {
			$email = $order->get_billing_email();
			if ( ! empty( $email ) ) {
				$abandoned_cart = AbandonedCartModel::where( 'email', $email )
					->where( 'status', 'pending' )
					->orderBy( 'id', 'DESC' )
					->first();
			}
		}

		// If still no abandoned cart found, return.
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

		// Remove tags and lists.
		$contact = ContactModel::get_by_email( $abandoned_cart->email );
		if ( $contact ) {
			$tags       = $this->settings['tags'] ?? array();
			$lists      = $this->settings['lists'] ?? array();
			$lost_tags  = $this->settings['lost_tags'] ?? array();
			$lost_lists = $this->settings['lost_lists'] ?? array();

			$contact->tags()->detach( array_merge( $tags, $lost_tags ) );
			$contact->lists()->detach( array_merge( $lists, $lost_lists ) );
		}

		// Clear the session.
		$this->clear_session();

		do_action( 'doublescale_abandoned_cart_recovered', $abandoned_cart );
	}

	/**
	 * Skip Abandoned Cart.
	 *
	 * @since 1.0.0
	 *
	 * @param string $cart_id Cart ID.
	 */
	public function skip_abandoned_cart( $cart_id ) {
		$abandoned_cart = AbandonedCartModel::find( $cart_id );
		if ( empty( $abandoned_cart ) ) {
			return;
		}

		if ( 'opt-out' === $abandoned_cart->status ) {
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
	 * @param string $meta_id Meta ID.
	 */
	public function mark_cart_recoverable( $meta_id ) {
		$meta = doublescale_get_meta_args( $meta_id );
		if ( empty( $meta ) ) {
			return;
		}

		$cart_id        = $meta[0] ?? 0;
		$abandoned_cart = AbandonedCartModel::find( $cart_id );

		if ( empty( $abandoned_cart ) ) {
			return;
		}

		if ( $abandoned_cart->status === 'recovered' ) {
			return;
		}

		$this->add_contact( $abandoned_cart );

		do_action( 'doublescale_abandoned_cart_created', $abandoned_cart );
	}

	/**
	 * Check Lost Carts.
	 *
	 * @since 1.0.0
	 */
	public function check_lost_carts() {
		$lost_cart_days = $this->settings['lost_cart_days'] ?? 15;

		// Get all carts that are pending and older than the lost cart days.
		$abandoned_carts = AbandonedCartModel::where( 'status', '!=', 'recovered' )
			->where( 'created_at', '<', strtotime( '-' . $lost_cart_days . ' days' ) )
			->get();

		if ( empty( $abandoned_carts ) ) {
			return;
		}

		foreach ( $abandoned_carts as $abandoned_cart ) {
			$abandoned_cart->status = 'lost';
			$abandoned_cart->save();

			$this->add_contact( $abandoned_cart, 'lost' );
		}
	}

	/**
	 * Add contact.
	 *
	 * @since 1.0.0
	 *
	 * @param AbandonedCartModel $abandoned_cart Abandoned Cart.
	 * @param string               $status Status.
	 *
	 * @return void
	 */
	public function add_contact( $abandoned_cart, $status = 'abandoned' ) {
		try {
			$contact = ContactModel::get_by_email( $abandoned_cart->email );
			if ( ! $contact ) {
				$contact = ContactModel::create(
					array(
						'email'        => $abandoned_cart->email,
						'email_status' => $abandoned_cart->status ? 'subscribed' : 'unverified',
					)
				);
			}

			$lists = $status === 'abandoned' ? $this->settings['lists'] ?? array() : $this->settings['lost_lists'] ?? array();
			$tags  = $status === 'abandoned' ? $this->settings['tags'] ?? array() : $this->settings['lost_tags'] ?? array();

			if ( ! empty( $lists ) ) {
				$contact->lists()->syncWithPivotValues( $lists, array( 'taxonomy_type' => 'list' ) );
			}

			if ( ! empty( $tags ) ) {
				$contact->tags()->syncWithPivotValues( $tags, array( 'taxonomy_type' => 'tag' ) );
			}
		} catch ( \Exception $e ) {
			return;
		}
	}

	/**
	 * Check Cooling Off.
	 *
	 * @since 1.0.0
	 */
	public function check_cooling_off() {
		$cool_off_period = $this->settings['cool_off_period'] ?? 15;

		// Get all carts that are pending and older than the lost cart days.
		$abandoned_carts = AbandonedCartModel::where( 'status', '!=', 'recovered' )
			->where( 'created_at', '<', strtotime( '-' . $cool_off_period . ' days' ) )
			->get();

		if ( empty( $abandoned_carts ) ) {
			return;
		}

		foreach ( $abandoned_carts as $abandoned_cart ) {
			$abandoned_cart->status = 'cool-off';
			$abandoned_cart->save();
		}
	}

	/**
	 * Restore Abandoned Cart.
	 *
	 * @since 1.0.0
	 */
	public function restore_abandoned_cart() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- public abandoned-cart restore link; identity comes from the per-cart hash validated against the DB below.
		$cart_id = sanitize_text_field( wp_unslash( $_GET['doublescale-cart-id'] ?? $_GET['ds-cart-id'] ?? '' ) );
		if ( ! $cart_id || wp_doing_ajax() || is_admin() ) {
			return;
		}

		// Get the abandoned cart.
		$abandoned_cart = AbandonedCartModel::where( 'hash_key', $cart_id )->where( 'status', 'pending' )->first();
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
	 * @param AbandonedCartModel $abandoned_cart Abandoned Cart.
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
			'doublescale-abandoned-cart',
			DOUBLESCALE_PLUGIN_URL . 'assets/js/abandoned-cart.js',
			array(),
			wp_rand(
				1,
				100
			),
			true
		);

		$gdpr_compliance = $this->settings['gdpr_compliance'] ?? false;
		$gdpr_message    = $this->settings['gdpr_message'] ?? 'Your email and cart are saved so we can send you email reminders about this order. {{no_thanks text="No Thanks"}}';

		// Text of merge tag.
		$gdpr_message = preg_replace_callback(
			'/{{no_thanks text="([^"]+)"}}/',
			function ( $matches ) {
				$text = $matches[1] ?? __( 'No Thanks', 'doublescale');
				return '<a href="#" class="doublescale-abandoned-cart-opt-out" id="doublescale-opt-out">' . esc_html( $text ) . '</a>';
			},
			$gdpr_message
		);

		// Localize the script with the cart data.
		wp_localize_script(
			'doublescale-abandoned-cart',
			'doublescale_abandoned_cart',
			array(
				'ajax_url'        => admin_url( 'admin-ajax.php' ),
				'nonce'           => wp_create_nonce( 'doublescale_abandoned_cart' ),
				'gdpr_compliance' => $this->get_skip_session() ? false : $gdpr_compliance,
				'gdpr_message'    => $gdpr_message,
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
		check_ajax_referer( 'doublescale_abandoned_cart', 'nonce' );

		// Check if the cart is skipped.
		if ( $this->get_skip_session() ) {
			wp_send_json_success();
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- raw JSON payload; values are extracted and individually sanitised below (sanitize_email + per-field handling).
		$fields = isset( $_POST['fields'] ) ? wp_unslash( $_POST['fields'] ) : null;
		if ( empty( $fields ) ) {
			wp_send_json_error( __( 'Fields are required.', 'doublescale') );
		}

		$fields        = json_decode( $fields, true );
		$billing_email = sanitize_email( $fields['billing_email'] ) ?? '';
		if ( empty( $billing_email ) ) {
			wp_send_json_error( __( 'Email is required.', 'doublescale') );
		}

		$data = array(
			'email'   => $billing_email,
			'fields'  => $fields,
			'coupons' => array(),
			'status'  => 'pending',
		);

		$items = WC()->cart->get_cart();

		if ( empty( $items ) ) {
			wp_send_json_error( __( 'Cart is empty.', 'doublescale') );
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
			wp_send_json_error( __( 'Failed to save the abandoned cart.', 'doublescale') );
		}
	}

	/**
	 * Save Abandoned Cart.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Data.
	 *
	 * @return AbandonedCartModel|false
	 */
	public function save( $data ) {
		$wait_period = $this->settings['wait_period'] ?? 1;
		$wait_period = $wait_period * 60;

		try {
			$abandoned_cart = AbandonedCartModel::where( 'email', $data['email'] )->first();
			if ( ! empty( $abandoned_cart ) ) {
				$abandoned_cart->fill( $data );
				if ( $this->get_skip_session() ) {
					$abandoned_cart->status = 'opt-out';
				}
				$abandoned_cart->save();
			} else {
				$abandoned_cart = AbandonedCartModel::create( $data );
				PluginKernel::instance()->abandoned_cart_tasks->schedule_single( time() + $wait_period, 'mark_cart_recoverable', $abandoned_cart->id );
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
	 * @return AbandonedCartModel|false
	 */
	public function update( $hash_key, $data ) {
		$wait_period = $this->settings['wait_period'] ?? 1;
		$wait_period = $wait_period * 60;

		try {
			$abandoned_cart = AbandonedCartModel::updateByHashKey( $hash_key, $data );
			if ( ! $abandoned_cart ) {
				return false;
			}

			if ( $this->get_skip_session() ) {
				$abandoned_cart->status = 'opt-out';
				$abandoned_cart->save();
			}

			PluginKernel::instance()->abandoned_cart_tasks->schedule_single( time() + $wait_period, 'mark_cart_recoverable', $abandoned_cart->id );
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
		return isset( $_COOKIE['doublescale_abandoned_cart'] ) ? sanitize_text_field( wp_unslash( $_COOKIE['doublescale_abandoned_cart'] ) ) : '';
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
		// Save the hash key in the cookie with proper path and domain.
		setcookie( 'doublescale_abandoned_cart', $hash_key, time() + ( 86400 * 30 ), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );

		// Also store in WC session as fallback.
		if ( WC()->session ) {
			WC()->session->set( 'doublescale_cart_hash', $hash_key );
		}
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
		setcookie( 'doublescale_abandoned_cart', '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );

		// Also clear from WC session.
		if ( WC()->session ) {
			WC()->session->set( 'doublescale_cart_hash', null );
		}
	}

	/**
	 * Set Skip Session.
	 *
	 * @since 1.0.0
	 */
	public function set_skip_session() {
		setcookie( 'doublescale_abandoned_cart_skip', '1', time() + ( 86400 * 7 ), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );
	}

	/**
	 * Get Skip Session.
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_skip_session() {
		return isset( $_COOKIE['doublescale_abandoned_cart_skip'] ) ? sanitize_text_field( wp_unslash( $_COOKIE['doublescale_abandoned_cart_skip'] ) ) : '';
	}
}
