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
	 * Get collection parameters.
	 *
	 * @return array
	 */
	public function get_collection_params() {
		return array();
	}

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
					'args'     => $this->get_collection_params(),
				),
			)
		);
	}

	public function get_contacts_deals_reports( $request ) {
		// Define date ranges
		$current_date                 = current_time( 'mysql' );
		$thirty_days_ago              = date( 'Y-m-d H:i:s', strtotime( '-30 days', strtotime( $current_date ) ) );
		$year_before_start            = date( 'Y-m-d H:i:s', strtotime( '-1 year -30 days', strtotime( $current_date ) ) );
		$year_before_end              = date( 'Y-m-d H:i:s', strtotime( '-1 year', strtotime( $current_date ) ) );
		$contacts_created             = 0;
		$contacts_created_year_before = 0;
		$contacts_worked              = 0;
		$contacts_worked_year_before  = 0;
		$deals_created                = 0;
		$deals_created_year_before    = 0;
		$deals_won                    = 0;
		$deals_won_year_before        = 0;
		$deals_avg_time               = 0;
		$deals_avg_time_year_before   = 0;
		$deal_velocity                = 0;
		$deal_velocity_year_before    = 0;
		$deal_velocity_change         = 0;
		$deals_avg_time_change        = 0;
		$deals_created_change         = 0;
		$contacts_worked_change       = 0;
		$contacts_created_change      = 0;
		$deals_won_change             = 0;

		// Contacts created in the last 30 days
		$contacts_created = Contact_Model::where( 'created_at', '>=', $thirty_days_ago )
			->where( 'created_at', '<=', $current_date )
			->count();

		// Contacts created in the same 30-day period one year ago
		$contacts_created_year_before = Contact_Model::where( 'created_at', '>=', $year_before_start )
			->where( 'created_at', '<=', $year_before_end )
			->count();

		// Calculate percentage change
		$contacts_created_change = 0;
		if ( $contacts_created_year_before > 0 ) {
			$contacts_created_change = ( ( $contacts_created - $contacts_created_year_before ) / $contacts_created_year_before ) * 100;
		}

		// Contacts worked in the last 30 days - get contacts with deal activity
		$deals_with_activity = Deal_Model::with( 'activities' )
			->whereHas(
				'activities',
				function ( $query ) use ( $thirty_days_ago, $current_date ) {
					$query->where( 'created_at', '>=', $thirty_days_ago )
						->where( 'created_at', '<=', $current_date );
				}
			)
			->get();

		// Get unique contact IDs from deals with activity
		$contact_ids = array();
		foreach ( $deals_with_activity as $deal ) {
			if ( ! empty( $deal->contact_id ) && ! in_array( $deal->contact_id, $contact_ids ) ) {
				$contact_ids[] = $deal->contact_id;
			}
		}
		$contacts_worked = count( $contact_ids );

		// Contacts worked in the same 30-day period one year ago
		$deals_with_activity_year_before = Deal_Model::with( 'activities' )
			->whereHas(
				'activities',
				function ( $query ) use ( $year_before_start, $year_before_end ) {
					$query->where( 'created_at', '>=', $year_before_start )
						->where( 'created_at', '<=', $year_before_end );
				}
			)
			->get();

		// Get unique contact IDs from deals with activity in previous year
		$contact_ids_year_before = array();
		foreach ( $deals_with_activity_year_before as $deal ) {
			if ( ! empty( $deal->contact_id ) && ! in_array( $deal->contact_id, $contact_ids_year_before ) ) {
				$contact_ids_year_before[] = $deal->contact_id;
			}
		}
		$contacts_worked_year_before = count( $contact_ids_year_before );

		// Calculate percentage change
		$contacts_worked_change = 0;
		if ( $contacts_worked_year_before > 0 ) {
			$contacts_worked_change = ( ( $contacts_worked - $contacts_worked_year_before ) / $contacts_worked_year_before ) * 100;
		}

		// Deals created in the last 30 days
		$deals_created = Deal_Model::where( 'created_at', '>=', $thirty_days_ago )
			->where( 'created_at', '<=', $current_date )
			->count();

		// Deals created in the same 30-day period one year ago
		$deals_created_year_before = Deal_Model::where( 'created_at', '>=', $year_before_start )
			->where( 'created_at', '<=', $year_before_end )
			->count();

		// Calculate percentage change
		if ( $deals_created_year_before > 0 ) {
			$deals_created_change = ( ( $deals_created - $deals_created_year_before ) / $deals_created_year_before ) * 100;
		}

		// Deals won in the last 30 days
		$deals_won = Deal_Model::where( 'status', 'won' )
			->where( 'won_time', '>=', $thirty_days_ago )
			->where( 'won_time', '<=', $current_date )
			->count();

		// Deals won in the same 30-day period one year ago
		$deals_won_year_before = Deal_Model::where( 'status', 'won' )
			->where( 'won_time', '>=', $year_before_start )
			->where( 'won_time', '<=', $year_before_end )
			->count();

		// Calculate percentage change
		if ( $deals_won_year_before > 0 ) {
			$deals_won_change = ( ( $deals_won - $deals_won_year_before ) / $deals_won_year_before ) * 100;
		}

		// Calculate deals average time (time spent in stages) in the last 30 days
		$deals_with_time_current = Deal_Model::where( 'status', 'won' )
			->where( 'won_time', '>=', $thirty_days_ago )
			->where( 'won_time', '<=', $current_date )
			->whereNotNull( 'created_at' )
			->get();

		$total_time_current  = 0;
		$deals_count_current = count( $deals_with_time_current );

		foreach ( $deals_with_time_current as $deal ) {
			$created_date        = new \DateTime( $deal->created_at );
			$closed_date         = new \DateTime( $deal->won_time );
			$interval            = $created_date->diff( $closed_date );
			$total_time_current += $interval->days;
		}

		$deals_avg_time = $deals_count_current > 0 ? $total_time_current / $deals_count_current : 0;

		// Calculate deals average time for the same period one year ago
		$deals_with_time_year_before = Deal_Model::where( 'status', 'won' )
			->where( 'won_time', '>=', $year_before_start )
			->where( 'won_time', '<=', $year_before_end )
			->whereNotNull( 'created_at' )
			->get();

		$total_time_year_before  = 0;
		$deals_count_year_before = count( $deals_with_time_year_before );

		foreach ( $deals_with_time_year_before as $deal ) {
			$created_date            = new \DateTime( $deal->created_at );
			$closed_date             = new \DateTime( $deal->won_time );
			$interval                = $created_date->diff( $closed_date );
			$total_time_year_before += $interval->days;
		}

		$deals_avg_time_year_before = $deals_count_year_before > 0 ? $total_time_year_before / $deals_count_year_before : 0;

		// Calculate percentage change for average time (note: for time metrics, negative change is usually good)
		if ( $deals_avg_time_year_before > 0 ) {
			$deals_avg_time_change = ( ( $deals_avg_time - $deals_avg_time_year_before ) / $deals_avg_time_year_before ) * 100;
		}

		// Deal velocity is the average time from creation to won status (same as avg_time in this case)
		$deal_velocity             = $deals_avg_time;
		$deal_velocity_year_before = $deals_avg_time_year_before;

		// Calculate percentage change for deal velocity
		if ( $deal_velocity_year_before > 0 ) {
			$deal_velocity_change = ( ( $deal_velocity - $deal_velocity_year_before ) / $deal_velocity_year_before ) * 100;
		}

		return new WP_REST_Response(
			array(
				// Contacts metrics
				'contacts_created'        => $contacts_created,
				'contacts_created_change' => round( $contacts_created_change, 2 ),
				'contacts_worked'         => $contacts_worked,
				'contacts_worked_change'  => round( $contacts_worked_change, 2 ),

				// Deals metrics
				'deals_created'           => $deals_created,
				'deals_created_change'    => round( $deals_created_change, 2 ),
				'deals_won'               => $deals_won,
				'deals_won_change'        => round( $deals_won_change, 2 ),

				// Time metrics
				'deals_avg_time'          => round( $deals_avg_time ),
				'deals_avg_time_change'   => round( $deals_avg_time_change, 2 ),
				'deal_velocity'           => round( $deal_velocity ),
				'deal_velocity_change'    => round( $deal_velocity_change, 2 ),
			),
			200
		);
	}
}
