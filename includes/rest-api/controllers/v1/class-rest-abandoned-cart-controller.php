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
use DateInterval;
use DatePeriod;
use DateTime;
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
						'type'       => array(
							'description' => __( 'Type of data to be fetched.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'custom', 'order' ),
							'required'    => false,
						),
						'interval'   => array(
							'description' => __( 'Interval for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year', 'last_year' ),
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
				$carts = Abandoned_Cart_Model::where( 'name', 'like', '%' . $keyword . '%' )
					->paginate( $per_page, array( '*' ), 'page', $page );
			} else {
				$carts = Abandoned_Cart_Model::paginate( $per_page, array( '*' ), 'page', $page );
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
			$type       = $request->get_param( 'type' ) ? $request->get_param( 'type' ) : 'order';
			$interval   = $request->get_param( 'interval' ) ? $request->get_param( 'interval' ) : 'last_30_days';
			$start_date = $request->get_param( 'start_date' ) ? $request->get_param( 'start_date' ) : '';
			$end_date   = $request->get_param( 'end_date' ) ? $request->get_param( 'end_date' ) : '';

			if ( 'order' === $type ) {
				$start_date = $this->get_start_date( $interval, $start_date );
				$end_date   = $this->get_end_date( $interval, $end_date );
			}

			$dates = $this->get_days_months_between_dates( $start_date, $end_date );
			$carts = Abandoned_Cart_Model::whereBetween( 'created_at', array( $start_date, $end_date ) )
				->get()
				->groupBy(
					function( $item ) use ( $dates ) {
						return $this->is_date( $item->created_at, $dates['days'] ) ? date( 'Y-m-d', strtotime( $item->created_at ) ) : date( 'Y-m', strtotime( $item->created_at ) );
					}
				);

			$revenue_grouped_by_date = Abandoned_Cart_Model::whereBetween( 'created_at', array( $start_date, $end_date ) )->where( 'order_id', '>', 0 )
				->get()
				->groupBy(
					function( $item ) use ( $dates ) {
						return $this->is_date( $item->created_at, $dates['days'] ) ? date( 'Y-m-d', strtotime( $item->created_at ) ) : date( 'Y-m', strtotime( $item->created_at ) );
					}
				)
				->map(
					function( $item ) {
						return $item->sum( 'total' );
					}
				);
			$total_cart              = Abandoned_Cart_Model::count();
			$total_revenue           = Abandoned_Cart_Model::where( 'order_id', '>', 0 )->sum( 'total' );

			$analytics = array(
				'carts'   => $carts,
				'revenue' => $revenue_grouped_by_date,
				'dates'   => $dates,
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

	/**
	 * Get start date
	 *
	 * @since 1.0.0
	 *
	 * @param string $interval Interval.
	 * @param string $start_date Start date.
	 *
	 * @return string
	 */
	private function get_start_date( $interval, $start_date ) {
		$start_date = '';
		switch ( $interval ) {
			case 'today':
				$start_date = date( 'Y-m-d' );
				break;
			case 'yesterday':
				$start_date = date( 'Y-m-d', strtotime( '-1 day' ) );
				break;
			case 'last_7_days':
				$start_date = date( 'Y-m-d', strtotime( '-7 days' ) );
				break;
			case 'last_30_days':
				$start_date = date( 'Y-m-d', strtotime( '-30 days' ) );
				break;
			case 'this_month':
				$start_date = date( 'Y-m-01' );
				break;
			case 'last_month':
				$start_date = date( 'Y-m-01', strtotime( 'first day of last month' ) );
				break;
			case 'this_year':
				$start_date = date( 'Y-01-01' );
				break;
			case 'last_year':
				$start_date = date( 'Y-01-01', strtotime( 'first day of last year' ) );
				break;
		}

		return $start_date;
	}

	/**
	 * Get end date
	 *
	 * @since 1.0.0
	 *
	 * @param string $interval Interval.
	 * @param string $end_date End date.
	 *
	 * @return string
	 */
	private function get_end_date( $interval, $end_date ) {
		$end_date = '';
		switch ( $interval ) {
			case 'today':
				$end_date = date( 'Y-m-d' );
				break;
			case 'yesterday':
				$end_date = date( 'Y-m-d', strtotime( '-1 day' ) );
				break;
			case 'last_7_days':
				$end_date = date( 'Y-m-d' );
				break;
			case 'last_30_days':
				$end_date = date( 'Y-m-d' );
				break;
			case 'this_month':
				$end_date = date( 'Y-m-t' );
				break;
			case 'last_month':
				$end_date = date( 'Y-m-t', strtotime( 'last day of last month' ) );
				break;
			case 'this_year':
				$end_date = date( 'Y-12-31' );
				break;
			case 'last_year':
				$end_date = date( 'Y-12-31', strtotime( 'last day of last year' ) );
				break;
		}

		return $end_date;
	}

	/**
	 * Get days/months between two dates
	 *
	 * @since 1.0.0
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 *
	 * @return array
	 */
	private function get_days_months_between_dates( $start_date, $end_date ) {
		$days     = array();
		$months   = array();
		$interval = new DateInterval( 'P1D' );
		$realEnd  = new DateTime( $end_date );
		$realEnd->add( $interval );
		$period = new DatePeriod( new DateTime( $start_date ), $interval, $realEnd );

		foreach ( $period as $date ) {
			$days[]   = $date->format( 'Y-m-d' );
			$months[] = $date->format( 'Y-m' );
		}

		return array(
			'days'   => $days,
			'months' => $months,
		);
	}


	/**
	 * Check if date is in array
	 *
	 * @since 1.0.0
	 *
	 * @param string $date Date.
	 * @param array  $dates Dates.
	 *
	 * @return bool
	 */
	private function is_date( $date, $dates ) {
		// Date to same format as in array
		$date = date( 'Y-m-d', strtotime( $date ) );

		return in_array( $date, $dates );
	}
}
