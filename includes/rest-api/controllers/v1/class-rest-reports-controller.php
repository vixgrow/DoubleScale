<?php

/**
 * REST API: Reports Controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Models\User_Model;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class Rest_Reports_Controller extends REST_Controller {








	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'reports';


	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		 // Pipelines endpoints
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/contacts-deals',
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_contacts_deals_reports' ),
					'args'     => $this->get_reports_filter_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/deals-by-date',
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_deals_by_date_reports' ),
					'args'     => $this->get_deals_by_date_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/deals-leaderboard',
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_deals_leaderboard_reports' ),
					'args'     => $this->get_reports_filter_params(),
				),
			)
		);
	}

	/**
	 * Get contacts and deals reports
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_contacts_deals_reports( $request ) {
		$filters     = $this->get_filters_from_request( $request );
		$date_ranges = $this->get_report_date_ranges( $filters );

		// Get metrics data
		$contacts_metrics = $this->get_contacts_metrics( $date_ranges, $filters );
		$deals_metrics    = $this->get_deals_metrics( $date_ranges, $filters );
		$time_metrics     = $this->get_time_metrics( $date_ranges, $filters );

		return new WP_REST_Response(
			array_merge(
				$contacts_metrics,
				$deals_metrics,
				$time_metrics
			),
			200
		);
	}



	/**
	 * Get deals by date reports with status breakdown
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_deals_by_date_reports( $request ) {
		$days_back = $request->get_param( 'days_back' ) ?: 30;
		$frequency = $request->get_param( 'frequency' ) ?: 'daily';
		$filters   = $this->get_filters_from_request( $request );

		$deals_by_date = $this->get_deals_by_create_date( $days_back, $frequency, $filters );

		return new WP_REST_Response(
			array(
				'deals_by_date' => $deals_by_date,
				'date_range'    => array(
					'days_back' => $days_back,
					'frequency' => $frequency,
				),
				'filters'       => $filters,
			),
			200
		);
	}


	/**
	 * Get deals leaderboard reports
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_deals_leaderboard_reports( $request ) {
		$filters = $this->get_filters_from_request( $request );

		$deals_leaderboard = array();
		$all_owners        = User_Model::all();

		foreach ( $all_owners as $owner ) {
			$owner_data = $this->get_deals_leaderboard( $filters, $owner->ID );

			// Only include owners who have deals
			if ( $owner_data['total_deals'] > 0 ) {
				$deals_leaderboard[] = array(
					'owner_id'     => $owner->ID,
					'owner_name'   => $owner->display_name,
					'won_amount'   => $owner_data['total_value'],
					'lost_amount'  => 0, // You may want to add this calculation
					'total_amount' => $owner_data['total_value'],
					'won_count'    => $owner_data['total_deals'],
					'lost_count'   => 0, // You may want to add this calculation
					'total_count'  => $owner_data['total_deals'],
				);
			}
		}

		return new WP_REST_Response(
			array(
				'deals_leaderboard' => $deals_leaderboard,
				'filters'           => $filters,
			),
			200
		);
	}

	/**
	 * Get deals leaderboard for an owner
	 *
	 * @param array $filters Filters array.
	 * @param int   $owner_id Owner ID.
	 * @return array Deals leaderboard.
	 */
	private function get_deals_leaderboard( $filters, $owner_id ) {
		$deals_leaderboard = array(
			'total_deals'          => 0,
			'total_value'          => 0,
			'total_weighted_value' => 0,
		);

		$deals = $this->get_filters_to_apply( $filters )->where( 'owner_id', $owner_id )->where( 'status', 'won' )->get();

		foreach ( $deals as $deal ) {
			$deals_leaderboard['total_deals']++;
			$deals_leaderboard['total_value']          += $deal->value;
			$deals_leaderboard['total_weighted_value'] += $deal->weighted_value;
		}

		return $deals_leaderboard;
	}




	/**
	 * Get collection parameters for deals by date endpoint
	 *
	 * @return array
	 */
	public function get_deals_by_date_params() {
		return array_merge(
			array(
				'days_back' => array(
					'description' => 'Number of days to go back from current date',
					'type'        => 'integer',
					'default'     => 30,
					'minimum'     => 1,
					'maximum'     => 365,
				),
				'frequency' => array(
					'description' => 'Frequency of data grouping',
					'type'        => 'string',
					'default'     => 'daily',
					'enum'        => array( 'daily', 'weekly', 'monthly' ),
				),
			),
			$this->get_reports_filter_params()
		);
	}

	/**
	 * Get filter parameters for reports endpoints
	 *
	 * @return array
	 */
	public function get_reports_filter_params() {
		return array(
			'date_from'   => array(
				'description' => 'Start date for filtering (YYYY-MM-DD)',
				'type'        => 'string',
				'format'      => 'date',
			),
			'date_to'     => array(
				'description' => 'End date for filtering (YYYY-MM-DD)',
				'type'        => 'string',
				'format'      => 'date',
			),
			'owner_id'    => array(
				'description' => 'Filter by deal owner ID',
				'type'        => 'integer',
			),
			'pipeline_id' => array(
				'description' => 'Filter by pipeline ID',
				'type'        => 'integer',
			),
			'status'      => array(
				'description' => 'Filter by deal status',
				'type'        => 'string',
				'enum'        => array( 'open', 'won', 'lost' ),
			),
			'contact_id'  => array(
				'description' => 'Filter by contact ID',
				'type'        => 'integer',
			),
		);
	}

	/**
	 * Extract filters from request parameters
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array Filters array
	 */
	private function get_filters_from_request( $request ) {
		$filters = array();

		// Date filters
		if ( $request->get_param( 'date_from' ) ) {
			$filters['date_from'] = sanitize_text_field( $request->get_param( 'date_from' ) );
		}
		if ( $request->get_param( 'date_to' ) ) {
			$filters['date_to'] = sanitize_text_field( $request->get_param( 'date_to' ) );
		}

		// Owner filter
		if ( $request->get_param( 'owner_id' ) ) {
			$filters['owner_id'] = absint( $request->get_param( 'owner_id' ) );
		}

		// Pipeline filter
		if ( $request->get_param( 'pipeline_id' ) ) {
			$filters['pipeline_id'] = absint( $request->get_param( 'pipeline_id' ) );
		}

		// Status filter
		if ( $request->get_param( 'status' ) ) {
			$filters['status'] = sanitize_text_field( $request->get_param( 'status' ) );
		}

		// Contact filter
		if ( $request->get_param( 'contact_id' ) ) {
			$filters['contact_id'] = absint( $request->get_param( 'contact_id' ) );
		}

		return $filters;
	}

	/**
	 * Get date ranges for current period and same period last year
	 *
	 * @param array $filters Optional filters array.
	 * @return array Date ranges array
	 */
	private function get_report_date_ranges( $filters = array() ) {
		$current_date = current_time( 'mysql' );
		$days_back    = 30;

		// Use custom date range if provided
		if ( ! empty( $filters['date_from'] ) && ! empty( $filters['date_to'] ) ) {
			$current_start = $filters['date_from'] . ' 00:00:00';
			$current_end   = $filters['date_to'] . ' 23:59:59';

			// Calculate the difference for previous period
			$start_date = new \DateTime( $filters['date_from'] );
			$end_date   = new \DateTime( $filters['date_to'] );
			$diff       = $start_date->diff( $end_date )->days;

			$previous_end   = date( 'Y-m-d H:i:s', strtotime( '-1 year', strtotime( $current_end ) ) );
			$previous_start = date( 'Y-m-d H:i:s', strtotime( "-{$diff} days", strtotime( $previous_end ) ) );
		} else {
			// Default 30-day range
			$current_start  = date( 'Y-m-d H:i:s', strtotime( "-{$days_back} days", strtotime( $current_date ) ) );
			$current_end    = $current_date;
			$previous_start = date( 'Y-m-d H:i:s', strtotime( "-1 year -{$days_back} days", strtotime( $current_date ) ) );
			$previous_end   = date( 'Y-m-d H:i:s', strtotime( '-1 year', strtotime( $current_date ) ) );
		}

		return array(
			'current_start'  => $current_start,
			'current_end'    => $current_end,
			'previous_start' => $previous_start,
			'previous_end'   => $previous_end,
		);
	}

	/**
	 * Get contacts metrics for current and previous periods
	 *
	 * @param array $date_ranges Date ranges for current and previous periods.
	 * @param array $filters Optional filters array.
	 * @return array Contacts metrics with change calculations
	 */
	private function get_contacts_metrics( $date_ranges, $filters = array() ) {
		// Contacts created metrics
		$contacts_created_current  = $this->count_contacts_created(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			$filters
		);
		$contacts_created_previous = $this->count_contacts_created(
			$date_ranges['previous_start'],
			$date_ranges['previous_end'],
			$filters
		);
		$contacts_created_change   = $this->calculate_percentage_change(
			$contacts_created_current,
			$contacts_created_previous
		);

		// Contacts worked metrics
		$contacts_worked_current  = $this->count_contacts_worked(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			$filters
		);
		$contacts_worked_previous = $this->count_contacts_worked(
			$date_ranges['previous_start'],
			$date_ranges['previous_end'],
			$filters
		);
		$contacts_worked_change   = $this->calculate_percentage_change(
			$contacts_worked_current,
			$contacts_worked_previous
		);

		return array(
			'contacts_created'        => $contacts_created_current,
			'contacts_created_change' => round( $contacts_created_change, 2 ),
			'contacts_worked'         => $contacts_worked_current,
			'contacts_worked_change'  => round( $contacts_worked_change, 2 ),
		);
	}

	/**
	 * Get deals metrics for current and previous periods
	 *
	 * @param array $date_ranges Date ranges for current and previous periods.
	 * @param array $filters Optional filters array.
	 * @return array Deals metrics with change calculations
	 */
	private function get_deals_metrics( $date_ranges, $filters = array() ) {
		// Deals created metrics
		$deals_created_current  = $this->count_deals_created(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			$filters
		);
		$deals_created_previous = $this->count_deals_created(
			$date_ranges['previous_start'],
			$date_ranges['previous_end'],
			$filters
		);
		$deals_created_change   = $this->calculate_percentage_change(
			$deals_created_current,
			$deals_created_previous
		);

		// Deals won metrics
		$deals_won_current  = $this->count_deals_by_status(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			'won',
			$filters
		);
		$deals_won_previous = $this->count_deals_by_status(
			$date_ranges['previous_start'],
			$date_ranges['previous_end'],
			'won',
			$filters
		);
		$deals_won_change   = $this->calculate_percentage_change(
			$deals_won_current,
			$deals_won_previous
		);

		$deals_won_current_price  = $this->get_deals_by_status_price(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			'won',
			$filters
		);
		$deals_won_previous_price = $this->get_deals_by_status_price(
			$date_ranges['previous_start'],
			$date_ranges['previous_end'],
			'won',
			$filters
		);
		$deals_won_change_price   = $this->calculate_percentage_change(
			$deals_won_current_price,
			$deals_won_previous_price
		);

		$deals_lost_current  = $this->count_deals_by_status(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			'lost',
			$filters
		);
		$deals_lost_previous = $this->count_deals_by_status(
			$date_ranges['previous_start'],
			$date_ranges['previous_end'],
			'lost',
			$filters
		);
		$deals_lost_change   = $this->calculate_percentage_change(
			$deals_lost_current,
			$deals_lost_previous
		);

		// deal lost value metrics
		$deals_lost_current_price  = $this->get_deals_by_status_price(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			'lost',
			$filters
		);
		$deals_lost_previous_price = $this->get_deals_by_status_price(
			$date_ranges['previous_start'],
			$date_ranges['previous_end'],
			'lost',
			$filters
		);
		$deals_lost_change_price   = $this->calculate_percentage_change(
			$deals_lost_current_price,
			$deals_lost_previous_price
		);

		return array(
			'deals_created'           => $deals_created_current,
			'deals_created_change'    => round( $deals_created_change, 2 ),
			'deals_won'               => $deals_won_current,
			'deals_won_change'        => round( $deals_won_change, 2 ),
			'deals_won_value'         => $deals_won_current_price,
			'deals_won_value_change'  => round( $deals_won_change_price, 2 ),
			'deals_lost'              => $deals_lost_current,
			'deals_lost_change'       => round( $deals_lost_change, 2 ),
			'deals_lost_value'        => $deals_lost_current_price,
			'deals_lost_value_change' => round( $deals_lost_change_price, 2 ),
		);
	}

	/**
	 * Get time metrics for current and previous periods
	 *
	 * @param array $date_ranges Date ranges for current and previous periods.
	 * @param array $filters Optional filters array.
	 * @return array Time metrics with change calculations
	 */
	private function get_time_metrics( $date_ranges, $filters = array() ) {
		// Average time metrics
		$avg_time_current  = $this->calculate_average_deal_time(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			$filters
		);
		$avg_time_previous = $this->calculate_average_deal_time(
			$date_ranges['previous_start'],
			$date_ranges['previous_end'],
			$filters
		);
		$avg_time_change   = $this->calculate_percentage_change(
			$avg_time_current,
			$avg_time_previous
		);

		return array(
			'deals_avg_time'        => round( $avg_time_current ),
			'deals_avg_time_change' => round( $avg_time_change, 2 ),
		);
	}

	/**
	 * Get deals data grouped by create date with status breakdown
	 *
	 * @param int    $days_back Number of days to go back.
	 * @param string $frequency Frequency of grouping (daily, weekly, monthly).
	 * @param array  $filters Optional filters array.
	 * @return array Deals data grouped by date
	 */
	private function get_deals_by_create_date( $days_back, $frequency, $filters = array() ) {
		$current_date = current_time( 'mysql' );
		$start_date   = date( 'Y-m-d', strtotime( "-{$days_back} days", strtotime( $current_date ) ) );
		$end_date     = date( 'Y-m-d', strtotime( $current_date ) );

		// Get all deals created in the date range
		$query = $this->get_filters_to_apply( $filters )->whereBetween( 'created_at', array( $start_date . ' 00:00:00', $end_date . ' 23:59:59' ) );

		$deals = $query->orderBy( 'created_at', 'asc' )->get();

		$grouped_data = array();

		// Generate date range based on frequency
		$dates = $this->generate_date_range( $start_date, $end_date, $frequency );

		// Initialize data structure
		foreach ( $dates as $date ) {
			$grouped_data[ $date ] = array(
				'date'  => $date,
				'open'  => 0,
				'won'   => 0,
				'lost'  => 0,
				'total' => 0,
			);
		}

		// Group deals by date and status
		foreach ( $deals as $deal ) {
			$deal_date = $this->format_date_by_frequency( $deal->created_at, $frequency );

			if ( isset( $grouped_data[ $deal_date ] ) ) {
				$grouped_data[ $deal_date ][ $deal->status ]++;
				$grouped_data[ $deal_date ]['total']++;
			}
		}

		return array_values( $grouped_data );
	}

	/**
	 * Get date format based on frequency
	 *
	 * @param string $frequency Frequency type.
	 * @return string Date format
	 */
	private function get_date_format_by_frequency( $frequency ) {
		switch ( $frequency ) {
			case 'weekly':
				return 'Y-\WW'; // Year-Week format
			case 'monthly':
				return 'Y-m'; // Year-Month format
			case 'daily':
			default:
				return 'Y-m-d'; // Year-Month-Day format
		}
	}

	/**
	 * Format date according to frequency
	 *
	 * @param string $date Date to format.
	 * @param string $frequency Frequency type.
	 * @return string Formatted date
	 */
	private function format_date_by_frequency( $date, $frequency ) {
		$format = $this->get_date_format_by_frequency( $frequency );
		return date( $format, strtotime( $date ) );
	}

	/**
	 * Generate date range array based on frequency
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 * @param string $frequency Frequency type.
	 * @return array Date range array
	 */
	private function generate_date_range( $start_date, $end_date, $frequency ) {
		$dates   = array();
		$current = strtotime( $start_date );
		$end     = strtotime( $end_date );

		$interval = '+1 day';
		if ( $frequency === 'weekly' ) {
			$interval = '+1 week';
			// Adjust to start of week (Monday)
			$current = strtotime( 'monday this week', $current );
		} elseif ( $frequency === 'monthly' ) {
			$interval = '+1 month';
			// Adjust to start of month
			$current = strtotime( date( 'Y-m-01', $current ) );
		}

		while ( $current <= $end ) {
			$dates[] = $this->format_date_by_frequency( date( 'Y-m-d', $current ), $frequency );
			$current = strtotime( $interval, $current );
		}

		return array_unique( $dates );
	}

	/**
	 * Count contacts created in date range
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 * @param array  $filters Optional filters array.
	 * @return int Contact count
	 */
	private function count_contacts_created( $start_date, $end_date, $filters = array() ) {
		$contacts_deals = $this->get_filters_to_apply( $filters )->whereBetween( 'created_at', array( $start_date . ' 00:00:00', $end_date . ' 23:59:59' ) );

		return $this->extract_unique_contact_ids( $contacts_deals->get() );
	}

	/**
	 * Count contacts worked (with deal activity) in date range
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 * @param array  $filters Optional filters array.
	 * @return int Contact count
	 */
	private function count_contacts_worked( $start_date, $end_date, $filters = array() ) {
		$deals_with_activity = $this->get_filters_to_apply( $filters )->with( 'activities' )
			->whereHas(
				'activities',
				function ( $query ) use ( $start_date, $end_date ) {
					$query->where( 'created_at', '>=', $start_date )
						->where( 'created_at', '<=', $end_date );
				}
			);

		return $this->extract_unique_contact_ids( $deals_with_activity->get() );
	}

	/**
	 * Count deals created in date range
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 * @param array  $filters Optional filters array.
	 * @return int Deal count
	 */
	private function count_deals_created( $start_date, $end_date, $filters = array() ) {
		$query = $this->get_filters_to_apply( $filters )->where( 'created_at', '>=', $start_date )
			->where( 'created_at', '<=', $end_date );

		return $query->count();
	}

	/**
	 * Count deals won in date range
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 * @param array  $filters Optional filters array.
	 * @return int Deal count
	 */
	private function count_deals_by_status( $start_date, $end_date, $status, $filters = array() ) {
		$query = $this->get_filters_to_apply( $filters )->where( 'status', $status )
			->where( $status . '_time', '>=', $start_date )
			->where( $status . '_time', '<=', $end_date );

		return $query->count();
	}

	/**
	 * Get deals won price in date range
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 * @param array  $filters Optional filters array.
	 * @return float Deal price
	 */
	private function get_deals_by_status_price( $start_date, $end_date, $status, $filters = array() ) {
		$query = $this->get_filters_to_apply( $filters )->where( 'status', $status )
			->where( $status . '_time', '>=', $start_date )
			->where( $status . '_time', '<=', $end_date );

		return $query->sum( 'value' );
	}

	/**
	 * Calculate average deal time from creation to won or lost status
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 * @param array  $filters Optional filters array.
	 * @return float Average time in days
	 */
	private function calculate_average_deal_time( $start_date, $end_date, $filters = array() ) {
		// Get won deals
		$won_query = $this->get_filters_to_apply( $filters )->where( 'status', 'won' )
			->where( 'won_time', '>=', $start_date )
			->where( 'won_time', '<=', $end_date )
			->whereNotNull( 'created_at' );

		$won_deals = $won_query->get();

		// Get lost deals
		$lost_query = $this->get_filters_to_apply( $filters )->where( 'status', 'lost' )
			->where( 'lost_time', '>=', $start_date )
			->where( 'lost_time', '<=', $end_date )
			->whereNotNull( 'created_at' );

		$lost_deals = $lost_query->get();

		// Combine both collections
		$closed_deals = $won_deals->merge( $lost_deals );

		if ( $closed_deals->isEmpty() ) {
			return 0;
		}

		$total_days = 0;
		foreach ( $closed_deals as $deal ) {
			$created_date = new \DateTime( $deal->created_at );

			// Use won_time for won deals, lost_time for lost deals
			$close_date = $deal->status === 'won'
				? new \DateTime( $deal->won_time )
				: new \DateTime( $deal->lost_time );

			$interval    = $created_date->diff( $close_date );
			$total_days += $interval->days;
		}

		return $total_days / count( $closed_deals );
	}

	/**
	 * Extract unique contact IDs from deals collection
	 *
	 * @param \Illuminate\Database\Eloquent\Collection $deals Deals collection.
	 * @return int Unique contact count
	 */
	private function extract_unique_contact_ids( $deals ) {
		$contact_ids = array();
		foreach ( $deals as $deal ) {
			if ( ! empty( $deal->contact_id ) && ! in_array( $deal->contact_id, $contact_ids, true ) ) {
				$contact_ids[] = $deal->contact_id;
			}
		}
		return count( $contact_ids );
	}

	/**
	 * Calculate percentage change between current and previous values
	 *
	 * @param float $current Current value.
	 * @param float $previous Previous value.
	 * @return float Percentage change
	 */
	private function calculate_percentage_change( $current, $previous ) {
		if ( $previous <= 0 ) {
			return 0;
		}
		return ( ( $current - $previous ) / $previous ) * 100;
	}


	/**
	 * Filters to apply to queries (excluding date filters to avoid conflicts)
	 *
	 * @param array $filters Filters array.
	 * @return \Illuminate\Database\Eloquent\Builder Query builder object.
	 */
	private function get_filters_to_apply( $filters = array() ) {
		$query = Deal_Model::query();

		// Apply non-date filters only - date filters are handled separately in each method
		if ( ! empty( $filters['pipeline_id'] ) ) {
			$query->where( 'pipeline_id', $filters['pipeline_id'] );
		}
		if ( ! empty( $filters['contact_id'] ) ) {
			$query->where( 'contact_id', $filters['contact_id'] );
		}
		if ( ! empty( $filters['status'] ) ) {
			$query->where( 'status', $filters['status'] );
		}
		if ( ! empty( $filters['owner_id'] ) ) {
			$query->where( 'owner_id', $filters['owner_id'] );
		}

		return $query;
	}
}
