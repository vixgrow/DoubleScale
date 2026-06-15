<?php
/**
 * REST controller for sales invoice analytics.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Sales\Services\InvoiceAnalyticsService;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestSalesAnalyticsController class.
 */
class RestSalesAnalyticsController extends RestController {

	/**
	 * @var string
	 */
	protected $rest_base = 'sales/analytics';

	/**
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/revenue',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_revenue' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'start_date' => array(
							'type'              => 'string',
							'required'          => false,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'end_date'   => array(
							'type'              => 'string',
							'required'          => false,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'year'       => array(
							'type'              => 'integer',
							'required'          => false,
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);
	}

	/**
	 * @return bool|WP_Error
	 */
	public function permissions_check() {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}
		return Capabilities::can_manage_all_sales() || Capabilities::can_view_sales();
	}

	/**
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_revenue( $request ) {
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$today      = current_time( 'Y-m-d' );
		$start_date = sanitize_text_field( (string) $request->get_param( 'start_date' ) );
		$end_date   = sanitize_text_field( (string) $request->get_param( 'end_date' ) );
		$year       = (int) $request->get_param( 'year' );

		if ( '' === $start_date ) {
			$start_date = gmdate( 'Y-m-01', strtotime( $today . ' UTC' ) );
		}
		if ( '' === $end_date ) {
			$end_date = $today;
		}
		if ( $year <= 0 ) {
			$year = (int) gmdate( 'Y', strtotime( $today . ' UTC' ) );
		}

		$service = new InvoiceAnalyticsService();

		return new WP_REST_Response(
			array(
				'summary' => $service->get_revenue_summary( $start_date, $end_date ),
				'monthly' => $service->get_monthly_revenue( $year ),
			),
			200
		);
	}
}
