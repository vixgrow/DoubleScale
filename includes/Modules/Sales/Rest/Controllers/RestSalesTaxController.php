<?php
/**
 * REST controller for sales taxes.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Sales\Capabilities;
use DoubleScale\Modules\Sales\Models\TaxModel;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestSalesTaxController class.
 */
class RestSalesTaxController extends RestController {

	/**
	 * @var string
	 */
	protected $rest_base = 'sales/taxes';

	/**
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * @return bool
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		return Capabilities::can_view_sales();
	}

	/**
	 * @param \WP_REST_Request $request Unused. // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$disabled = $this->require_module( 'sales' );
		if ( $disabled ) {
			return $disabled;
		}

		$taxes = TaxModel::query()
			->orderBy( 'name' )
			->get();

		$data = array();
		foreach ( $taxes as $tax ) {
			$data[] = array(
				'id'   => (int) $tax->id,
				'name' => (string) $tax->name,
				'rate' => (float) $tax->rate,
			);
		}

		return new WP_REST_Response( $data, 200 );
	}
}
