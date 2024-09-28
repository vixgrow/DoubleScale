<?php
/**
 * Class Rest_Campaign_Controller
 * This class is responsible for handling the campaign rest api
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
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Campaign_Email_Model;

/**
 * Rest_Campaign_Controller class
 */
class REST_Campaign_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'campaigns';

	/**
	 * Register the routes for the controller.
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
					'args'                => array(
						'keyword'  => array(
							'description' => __( 'The keyword to search for.', 'quillcrm' ),
							'type'        => 'string',
						),
						'per_page' => array(
							'description' => __( 'The number of items to return per page.', 'quillcrm' ),
							'type'        => 'integer',
							'default'     => 10,
						),
						'page'     => array(
							'description' => __( 'The page number.', 'quillcrm' ),
							'type'        => 'integer',
							'default'     => 1,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'The ids of the items to delete.', 'quillcrm' ),
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

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Get campaign emails
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/emails',
			array(
				'args' => array(
					'id'       => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
					),
					'per_page' => array(
						'description' => __( 'The number of items to return per page.', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 10,
					),
					'page'     => array(
						'description' => __( 'The page number.', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 1,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_emails' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/email-analytics',
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
	 * Schema for the campaign
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The campaign schema
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'campaign',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'name'        => array(
					'description' => __( 'The name of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'description' => array(
					'description' => __( 'The description of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status'      => array(
					'description' => __( 'The status of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'enum'        => array( 'active', 'inactive' ),
				),
				'settings'    => array(
					'description' => __( 'The settings of the campaign.', 'quillcrm' ),
					'type'        => 'object',
				),
				'parent_id'   => array(
					'description' => __( 'The parent id of the campaign.', 'quillcrm' ),
					'type'        => 'integer',
				),
				'count'       => array(
					'description' => __( 'The count of the campaign.', 'quillcrm' ),
					'type'        => 'integer',
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'execute_at'  => array(
					'description' => __( 'The execute at of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'created_at'  => array(
					'description' => __( 'The created at of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'updated_at'  => array(
					'description' => __( 'The updated at of the campaign.', 'quillcrm' ),
					'type'        => 'string',
					'readonly'    => true,
				),
			),
		);
	}

	/**
	 * Get all campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_items( $request ) {
		try {
			$keyword  = $request->get_param( 'keyword' ) ? $request->get_param( 'keyword' ) : '';
			$per_page = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page     = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;

			if ( $keyword ) {
				$campaigns = Campaign_Model::where( 'name', 'LIKE', '%' . $keyword . '%' )
					->paginate( $per_page, array( '*' ), 'page', $page );
			} else {
				$campaigns = Campaign_Model::paginate( $per_page, array( '*' ), 'page', $page );
			}

			return new WP_REST_Response( $campaigns, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get campaign emails
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_campaign_emails( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$per_page    = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page        = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;

			$campaign_emails = Campaign_Email_Model::where( 'campaign_id', $campaign_id )->with( 'contact' )
				->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $campaign_emails, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = Campaign_Model::find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $campaign, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function create_item( $request ) {
		try {
			$campaign_data = $this->prepare_campaign( $request );
			$campaign      = Campaign_Model::create( $campaign_data );

			return new WP_REST_Response( $campaign, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function update_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = Campaign_Model::find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$campaign_data = $this->prepare_campaign( $request );
			$campaign->update( $campaign_data );

			return new WP_REST_Response( $campaign, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function delete_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = Campaign_Model::find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$campaign->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete multiple campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function delete_items( $request ) {
		try {
			$campaign_ids = $request->get_param( 'ids' );
			$campaigns    = Campaign_Model::find( $campaign_ids );

			if ( ! $campaigns ) {
				return new WP_Error( 'error', __( 'Campaigns not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			Campaign_Model::destroy( $campaign_ids );

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare the campaign data
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return array $campaign_data The campaign data
	 */
	private function prepare_campaign( $request ) {
		$campaign_data = array(
			'name'        => $request->get_param( 'name' ),
			'description' => $request->get_param( 'description' ),
			'status'      => $request->get_param( 'status' ),
			'settings'    => $request->get_param( 'settings' ),
			'parent_id'   => $request->get_param( 'parent_id' ),
			'count'       => $request->get_param( 'count' ),
			'execute_at'  => $request->get_param( 'execute_at' ),
		);

		foreach ( $campaign_data as $key => $value ) {
			if ( empty( $value ) ) {
				unset( $campaign_data[ $key ] );
			}
		}

		return $campaign_data;
	}

	/**
	 * Check if a given request has access to get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to get a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to create a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to update a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to delete a campaign
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to delete multiple campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
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

			$dates         = $this->get_days_months_between_dates( $start_date, $end_date );
			$emails        = Campaign_Email_Model::whereBetween( 'created_at', array( $start_date, $end_date ) )->where( 'status', 'sent' )
				->get()
				->groupBy(
					function( $item ) use ( $dates ) {
						return $this->is_date( $item->created_at, $dates['days'] ) ? date( 'Y-m-d', strtotime( $item->created_at ) ) : date( 'Y-m', strtotime( $item->created_at ) );
					}
				);
			$total_emails  = Campaign_Email_Model::count();
			$total_opened  = Campaign_Email_Model::where( 'status', 'opened' )->count();
			$total_clicked = Campaign_Email_Model::where( 'status', 'clicked' )->count();

			$analytics = array(
				'emails'  => $emails,
				'dates'   => $dates,
				'total'   => $total_emails,
				'opened'  => $total_opened,
				'clicked' => $total_clicked,
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
