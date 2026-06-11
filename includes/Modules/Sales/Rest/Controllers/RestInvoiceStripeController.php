<?php
/**
 * REST controller for Stripe payments on invoices.
 *
 * Stripe SDK logic lives in DoubleScale Pro; this controller validates the
 * invoice and delegates via filters so free Sales works without Pro active.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Rest\InvoiceShaper;
use DoubleScale\Modules\Sales\Services\InvoicePayable;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestInvoiceStripeController class.
 */
class RestInvoiceStripeController extends RestController {

	/**
	 * @var string
	 */
	protected $rest_base = 'sales';

	/**
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/stripe/status',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_status' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/invoices/(?P<invoice_id>[\d]+)/stripe/init',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'init_payment' ),
					'permission_callback' => array( $this, 'manage_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/invoices/(?P<invoice_id>[\d]+)/stripe/confirm',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'confirm_payment' ),
					'permission_callback' => array( $this, 'manage_permissions_check' ),
				),
			)
		);
	}

	public function get_items_permissions_check( $request ) {
		unset( $request );
		return Capabilities::can_view_sales();
	}

	public function manage_permissions_check( $request ) {
		unset( $request );
		return Capabilities::can_view_sales()
			&& ( Capabilities::can_manage_all_sales() || Capabilities::current_user_can( 'doublescale_manage_own_sales' ) );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_status( $request ) {
		unset( $request );
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		return new WP_REST_Response(
			array(
				'available'   => (bool) apply_filters( 'doublescale_sales_stripe_available', false ),
				'configured'  => (bool) apply_filters( 'doublescale_sales_stripe_configured', false ),
			),
			200
		);
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function init_payment( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$invoice = $this->resolve_invoice( $request );
		if ( is_wp_error( $invoice ) ) {
			return $invoice;
		}

		$guard = InvoicePayable::guard( $invoice );
		if ( is_wp_error( $guard ) ) {
			return $guard;
		}

		$result = apply_filters( 'doublescale_sales_invoice_stripe_init', null, $invoice );
		if ( null === $result ) {
			return new WP_Error(
				'stripe_unavailable',
				__( 'Stripe payments require DoubleScale Pro with Stripe configured.', 'doublescale' ),
				array( 'status' => 503 )
			);
		}
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function confirm_payment( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$invoice = $this->resolve_invoice( $request );
		if ( is_wp_error( $invoice ) ) {
			return $invoice;
		}

		$result = apply_filters( 'doublescale_sales_invoice_stripe_confirm', null, $invoice );
		if ( null === $result ) {
			return new WP_Error(
				'stripe_unavailable',
				__( 'Stripe payments require DoubleScale Pro with Stripe configured.', 'doublescale' ),
				array( 'status' => 503 )
			);
		}
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( is_array( $result ) && isset( $result['invoice'] ) && $result['invoice'] instanceof InvoiceModel ) {
			$result['invoice'] = InvoiceShaper::shape( $result['invoice'], true );
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return InvoiceModel|WP_Error
	 */
	private function resolve_invoice( WP_REST_Request $request ) {
		$invoice = InvoiceModel::with( array( 'contact', 'sale_agent', 'proposal' ) )->find( (int) $request->get_param( 'invoice_id' ) );
		if ( ! $invoice ) {
			return new WP_Error( 'not_found', __( 'Invoice not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		if ( ! Capabilities::user_can_manage_record( get_current_user_id(), $invoice->sale_agent_user_id ? (int) $invoice->sale_agent_user_id : null ) ) {
			return new WP_Error( 'not_allowed', __( 'You do not have permission to access this invoice.', 'doublescale' ), array( 'status' => 403 ) );
		}

		return $invoice;
	}
}
