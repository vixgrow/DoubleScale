<?php
/**
 * Class Rest_Abandoned_Cart_Controller
 * This class is responsible for handling the Automation Contact REST API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Utils;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Abandoned_Cart_Model;

/**
 * Rest_Abandoned_Cart_Controller class
 */
class Rest_Abandoned_Cart_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'abandoned-carts';

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
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
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'The IDs of the items to delete.', 'quillcrm' ),
							'type'        => 'array',
							'items'       => array(
								'type' => 'integer',
							),
							'required'    => true,
						),
					),
				),
			)
		);

		// Analytics
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/analytics',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_analytics' ),
					'permission_callback' => array( $this, 'get_analytics_permissions_check' ),
					'args'                => array(
						'interval'   => array(
							'description' => __( 'Interval for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'custom', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year', 'last_year' ),
							'required'    => false,
						),
						'start_date' => array(
							'description' => __( 'Start date for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
						'end_date'   => array(
							'description' => __( 'End date for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
					),
				),
			)
		);
	}

	/**
	 * Collection params
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_collection_params() {
		return array(
			'keyword'  => array(
				'description'       => __( 'Search keyword.', 'quillcrm' ),
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'page'     => array(
				'description'       => __( 'Current page of the collection.', 'quillcrm' ),
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'per_page' => array(
				'description'       => __( 'Maximum number of items to be returned in result set.', 'quillcrm' ),
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
		);
	}

	/**
	 * Get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		try {
			$per_page = $request->get_param( 'per_page' ) ?? 10;
			$page     = $request->get_param( 'page' ) ?? 1;
			$keyword  = $request->get_param( 'keyword' ) ?? '';

			if ( $keyword ) {
				$carts = Abandoned_Cart_Model::where( 'name', 'like', '%' . $keyword . '%' )->with( 'contact' )->orderBy( 'created_at', 'desc' )
					->paginate( $per_page, array( '*' ), 'page', $page );
			} else {
				$carts = Abandoned_Cart_Model::orderBy( 'created_at', 'desc' )->with( 'contact' )->paginate( $per_page, array( '*' ), 'page', $page );
			}

			return new WP_REST_Response( $carts, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete_items( $request ) {
		try {
			$ids = $request->get_param( 'ids' );
			if ( empty( $ids ) ) {
				return new WP_Error( 'error', __( 'No IDs provided.', 'quillcrm' ), array( 'status' => 400 ) );
			}

			Abandoned_Cart_Model::destroy( $ids );

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get analytics
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_analytics( $request ) {
		try {
			$interval   = $request->get_param( 'interval' ) ? $request->get_param( 'interval' ) : 'last_30_days';
			$start_date = $request->get_param( 'start_date' ) ? $request->get_param( 'start_date' ) : '';
			$end_date   = $request->get_param( 'end_date' ) ? $request->get_param( 'end_date' ) : '';

			if ( 'custom' !== $interval ) {
				$start_date = Utils::get_start_date( $interval, $start_date );
				$end_date   = Utils::get_end_date( $interval, $end_date );
			}

			$dates = Utils::get_dates_between_dates( $start_date, $end_date );
			$type  = $dates['type'] ?? 'hour';
			$carts = array();

			foreach ( $dates['dates'] as $date ) {
				switch ( $type ) {
					case 'hour':
						$carts[ $date ] = Abandoned_Cart_Model::whereBetween( 'created_at', array( $date, date( 'Y-m-d H:i:s', strtotime( $date . ' +1 hour' ) ) ) )->count();
						break;
					case 'day':
						$carts[ $date ] = Abandoned_Cart_Model::whereDay( 'created_at', date( 'd', strtotime( $date ) ) )->count();
						break;
					case 'month':
						$carts[ $date ] = Abandoned_Cart_Model::whereMonth( 'created_at', date( 'm', strtotime( $date ) ) )->count();
						break;
					case 'year':
						$carts[ $date ] = Abandoned_Cart_Model::whereYear( 'created_at', date( 'Y', strtotime( $date ) ) )->count();
						break;
				}
			}

			$revenue_grouped_by_date = array();

			foreach ( $dates['dates'] as $date ) {
				switch ( $dates['type'] ) {
					case 'hour':
						$revenue_grouped_by_date[ $date ] = Abandoned_Cart_Model::whereBetween( 'created_at', array( $date, date( 'Y-m-d H:i:s', strtotime( $date . ' +1 hour' ) ) ) )->sum( 'total' );
						break;
					case 'day':
						$revenue_grouped_by_date[ $date ] = Abandoned_Cart_Model::whereDay( 'created_at', date( 'd', strtotime( $date ) ) )->sum( 'total' );
						break;
					case 'month':
						$revenue_grouped_by_date[ $date ] = Abandoned_Cart_Model::whereMonth( 'created_at', date( 'm', strtotime( $date ) ) )->sum( 'total' );
						break;
					case 'year':
						$revenue_grouped_by_date[ $date ] = Abandoned_Cart_Model::whereYear( 'created_at', date( 'Y', strtotime( $date ) ) )->sum( 'total' );
						break;
				}
			}

			$total_cart    = Abandoned_Cart_Model::count();
			$total_revenue = Abandoned_Cart_Model::where( 'order_id', '>', 0 )->sum( 'total' );

			$analytics = array(
				'carts'   => $carts,
				'revenue' => $revenue_grouped_by_date,
				'data'    => $dates,
				'total'   => array(
					'carts'   => $total_cart,
					'revenue' => $total_revenue,
				),
			);
			return new WP_REST_Response( $analytics, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get analytics permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_analytics_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
