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
use QuillCRM\Models\Deal_Activity_Model;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Models\Pipeline_Model;
use QuillCRM\User_Roles\Permissions;
use QuillCRM\User_Roles\User_Roles;
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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_contacts_deals_reports' ),
					'permission_callback' => array( $this, 'get_contacts_deals_reports_permissions_check' ),
					'args'                => $this->get_reports_filter_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/deals-by-date',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_deals_by_date_reports' ),
					'permission_callback' => array( $this, 'get_deals_by_date_reports_permissions_check' ),
					'args'                => $this->get_deals_by_date_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/deals-leaderboard',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_deals_leaderboard_reports' ),
					'permission_callback' => array( $this, 'get_deals_leaderboard_reports_permissions_check' ),
					'args'                => $this->get_reports_filter_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/sales-rep',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_sales_rep_reports' ),
					'permission_callback' => array( $this, 'get_sales_rep_reports_permissions_check' ),
					'args'                => $this->get_reports_filter_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/sales-rep/pipeline-stages',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_sales_rep_pipeline_stages_reports' ),
					'permission_callback' => array( $this, 'get_sales_rep_pipeline_stages_reports_permissions_check' ),
					'args'                => $this->get_reports_filter_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/sales-rep/active-deals',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_sales_rep_active_deals_reports' ),
					'permission_callback' => array( $this, 'get_sales_rep_active_deals_reports_permissions_check' ),
					'args'                => $this->get_reports_filter_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/all-sales-rep',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_all_sales_rep_reports' ),
					'permission_callback' => array( $this, 'get_all_sales_rep_reports_permissions_check' ),
					'args'                => $this->get_reports_filter_params(),
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
		// Get only CRM users and administrators
		$all_owners = get_users(
			array(
				'role__in' => array(
					User_Roles::CRM_MANAGER,
					User_Roles::DEAL_OWNER,
					User_Roles::ADMINISTRATOR,
				),
			)
		);

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
	 * Get sales rep reports
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_sales_rep_reports( $request ) {
		$filters             = $this->get_filters_from_request( $request );
		$date_ranges         = $this->get_report_date_ranges( $filters );
		$filters['owner_id'] = $filters['owner_id'] ?? get_current_user_id();

		$sale_info          = $this->get_sale_info( $filters );
		$cards_statistics   = $this->get_cards_statistics( $filters, $date_ranges );
		$won_loss_analytics = $this->get_won_loss_analytics( $filters, $date_ranges );
		$recent_activities  = $this->get_recent_activities( $filters, $date_ranges );
		$data               = array(
			'sale_info'          => $sale_info,
			'cards_statistics'   => $cards_statistics,
			'won_loss_analytics' => $won_loss_analytics,
			'recent_activities'  => $recent_activities,
		);

		return new WP_REST_Response(
			$data,
			200
		);
	}

	/**
	 * Get sales rep pipeline stages reports
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_sales_rep_pipeline_stages_reports( $request ) {
		$filters             = $this->get_filters_from_request( $request );
		$date_ranges         = $this->get_report_date_ranges( $filters );
		$filters['owner_id'] = $filters['owner_id'] ?? get_current_user_id();
		$pipeline_stages     = $this->get_pipeline_stages_statistics( $filters, $date_ranges );
		return new WP_REST_Response(
			array(
				'pipeline_stages' => $pipeline_stages,
				'pipelines'       => $this->get_pipelines_for_sales_rep( $filters ),
				'filters'         => $filters,
			),
			200
		);
	}

	/**
	 * Get sales rep active deals reports
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_sales_rep_active_deals_reports( $request ) {
		$filters             = $this->get_filters_from_request( $request );
		$filters['owner_id'] = $filters['owner_id'] ?? get_current_user_id();

		// Get pagination parameters
		$page     = absint( $request->get_param( 'page' ) ) ?: 1;
		$per_page = absint( $request->get_param( 'per_page' ) ) ?: 10;
		$search   = sanitize_text_field( $request->get_param( 'search' ) );
		$offset   = ( $page - 1 ) * $per_page;

		// Build query
		$query = $this->get_filters_to_apply( $filters )->where( 'status', 'open' );

		// Add search functionality
		if ( ! empty( $search ) ) {
			$query->where(
				function ( $q ) use ( $search ) {
					$q->where( 'title', 'LIKE', '%' . $search . '%' )
						->orWhereHas(
							'stage',
							function ( $stage_query ) use ( $search ) {
								$stage_query->where( 'name', 'LIKE', '%' . $search . '%' );
							}
						);
				}
			);
		}

		// Get total count for pagination
		$total_deals = $query->count();

		// Get paginated results
		$deals = $query->orderBy( 'created_at', 'desc' )
			->offset( $offset )
			->limit( $per_page )
			->get();

		$active_deals = array();

		foreach ( $deals as $deal ) {
			$activity       = $deal->activities()->first();
			$timeInStage    = $this->get_days_in_stage( $deal );
			$active_deals[] = array(
				'id'           => $deal->id,
				'name'         => $deal->title,
				'value'        => '$' . number_format( $deal->value, 2 ),
				'stage'        => $deal->stage->name,
				'stage_color'  => $deal->stage->color,
				'closeDate'    => $deal->expected_close_date,
				'timeInStage'  => $timeInStage,
				'lastActivity' => $activity ? $activity->created_at : null,
			);
		}

		// Calculate pagination info
		$total_pages = ceil( $total_deals / $per_page );

		return new WP_REST_Response(
			array(
				'active_deals' => $active_deals,
				'pagination'   => array(
					'total'        => $total_deals,
					'per_page'     => $per_page,
					'current_page' => $page,
					'total_pages'  => $total_pages,
					'has_next'     => $page < $total_pages,
					'has_prev'     => $page > 1,
				),
				'filters'      => $filters,
			),
			200
		);
	}

	/**
	 * Get all sales rep reports
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function get_all_sales_rep_reports( $request ) {
		$filters     = $this->get_filters_from_request( $request );
		$date_ranges = $this->get_report_date_ranges( $filters );
		// Get only CRM users and administrators
		$users             = get_users(
			array(
				'role__in' => array(
					User_Roles::CRM_MANAGER,
					User_Roles::DEAL_OWNER,
					User_Roles::ADMINISTRATOR,
				),
			)
		);
		$sales_rep_reports = array();

		// Collect all user data first
		foreach ( $users as $user ) {
			$filters['owner_id'] = $user->ID;
			$cards_statistics    = $this->get_cards_statistics( $filters, $date_ranges );
			$last_activity       = Deal_Activity_Model::where( 'user_id', $user->ID )->orderBy( 'created_at', 'desc' )->first();

			// Calculate performance score for sorting
			$deals_won         = (int) $cards_statistics['total_deals_close_won_number']['value'];
			$deals_lost        = (int) $cards_statistics['total_deals_close_lost_number']['value'];
			$performance_rate  = (float) str_replace( '%', '', $cards_statistics['performance_rate_number']['value'] );
			$performance_value = (float) str_replace( '%', '', $cards_statistics['performance_rate_value']['value'] );

			// Calculate composite performance score
			// Priority: Performance rate (40%) + Deals won (30%) + Performance value (20%) + Win ratio (10%)
			$total_deals = $deals_won + $deals_lost;
			$win_ratio   = $total_deals > 0 ? ( $deals_won / $total_deals ) * 100 : 0;

			$performance_score = ( $performance_rate * 0.4 ) + ( $deals_won * 3 * 0.3 ) + ( $performance_value * 0.2 ) + ( $win_ratio * 0.1 );

			$sales_rep_reports[ $user->ID ] = array(
				'id'                            => $user->ID,
				'name'                          => $user->display_name,
				'email'                         => $user->user_email,
				'ranking'                       => '', // Will be assigned after sorting
				'total_deals_close_won_number'  => $cards_statistics['total_deals_close_won_number'],
				'total_deals_close_lost_number' => $cards_statistics['total_deals_close_lost_number'],
				'performance_rate_number'       => $cards_statistics['performance_rate_number'],
				'performance_rate_value'        => $cards_statistics['performance_rate_value'],
				'lastActivity'                  => $last_activity ? $this->format_time_with_units( $last_activity->created_at ) : 'No activity',
				'performance_score'             => $performance_score,
			);
		}
		uasort(
			$sales_rep_reports,
			function ( $a, $b ) {
				return $b['performance_score'] <=> $a['performance_score'];
			}
		);

		$sales_rep_reports = array_values( $sales_rep_reports );

		foreach ( $sales_rep_reports as $i => &$ud ) {
			$ud['ranking'] = $this->get_ranking_label( $i + 1 );
			unset( $ud['performance_score'] );
		}
		unset( $ud ); // important: break the reference

		return new WP_REST_Response( $sales_rep_reports, 200 );
	}

	/**
	 * Get ranking label
	 *
	 * @param int $rank Rank.
	 * @return string Ranking label.
	 */
	private function get_ranking_label( $rank ) {
		switch ( $rank ) {
			case 1:
				return 'TOP 1';
			case 2:
				return 'ON TRACK';
			case 3:
				return 'AT RISK';
		}
		return 'AT RISK';
	}

	private function get_days_in_stage( $deal ) {
		$activity_change_stage = $deal->activities()
			->where( 'activity_type', 'stage_changed' )
			->orderBy( 'created_at', 'desc' )
			->first();

		if ( ! $activity_change_stage ) {
			return $this->format_time_with_units( $deal->created_at );
		}

		$data = $activity_change_stage->data;

		if ( ! $data || ! isset( $data['new_stage_id'] ) ) {
			return null;
		}

		if ( intval( $data['new_stage_id'] ) === intval( $deal->stage_id ) ) {
			return $this->format_time_with_units( $activity_change_stage->created_at );
		}

		return null;
	}

	/**
	 * Format time difference with appropriate units
	 *
	 * @param string $created_at Created at date.
	 * @return string Formatted time with units
	 */
	private function format_time_with_units( $created_at ) {
		$current_date = current_time( 'mysql' );
		$seconds      = strtotime( $current_date ) - strtotime( $created_at );
		if ( $seconds < 0 ) {
			return '0 seconds';
		}

		$units = array(
			'day'    => 86400, // 24 * 60 * 60
			'hour'   => 3600,  // 60 * 60
			'minute' => 60,
			'second' => 1,
		);

		foreach ( $units as $unit => $value ) {
			if ( $seconds >= $value ) {
				$count     = floor( $seconds / $value );
				$unit_text = $count === 1 ? $unit : $unit . 's';
				return $count . ' ' . $unit_text;
			}
		}

		return '0 seconds';
	}

	/**
	 * Get sale info
	 *
	 * @param array $filters Filters array.
	 * @return array Sale info.
	 */
	private function get_sale_info( $filters ) {
		$sale_info = array();
		$user_id   = $filters['owner_id'] ?? get_current_user_id();
		$user      = get_user_by( 'ID', $user_id );

		if ( $user ) {
			$sale_info['id']    = $user->ID;
			$sale_info['name']  = $user->display_name;
			$sale_info['email'] = $user->user_email;
		}

		return $sale_info;
	}

	/**
	 * Get cards statistics
	 *
	 * @param array $filters Filters array.
	 * @param array $date_ranges Date ranges array.
	 * @return array Cards statistics.
	 */
	private function get_cards_statistics( $filters, $date_ranges ) {
		$cards_statistics = array();
		// total deals close number
		$cards_statistics['total_deals_close_won_number'] = $this->get_count_deals_by_status( $date_ranges['current_start'], $date_ranges['current_end'], 'won', $filters );
		// total deals close won number previous
		$cards_statistics['total_deals_close_won_number_previous'] = $this->get_count_deals_by_status( $date_ranges['previous_start'], $date_ranges['previous_end'], 'won', $filters );
		// total deals close won number change
		$cards_statistics['total_deals_close_won_number_change'] = $this->calculate_percentage_change( $cards_statistics['total_deals_close_won_number'], $cards_statistics['total_deals_close_won_number_previous'] );

		// total deals close won value
		$cards_statistics['total_deals_close_won_value'] = $this->get_deals_by_status_price( $date_ranges['current_start'], $date_ranges['current_end'], 'won', $filters );
		// total deals close won value previous
		$cards_statistics['total_deals_close_won_value_previous'] = $this->get_deals_by_status_price( $date_ranges['previous_start'], $date_ranges['previous_end'], 'won', $filters );
		// total deals close won value change
		$cards_statistics['total_deals_close_won_value_change'] = $this->calculate_percentage_change( $cards_statistics['total_deals_close_won_value'], $cards_statistics['total_deals_close_won_value_previous'] );

		// total deals close lost number
		$cards_statistics['total_deals_close_lost_number'] = $this->get_count_deals_by_status( $date_ranges['current_start'], $date_ranges['current_end'], 'lost', $filters );
		// total deals close lost number previous
		$cards_statistics['total_deals_close_lost_number_previous'] = $this->get_count_deals_by_status( $date_ranges['previous_start'], $date_ranges['previous_end'], 'lost', $filters );
		// total deals close lost number change
		$cards_statistics['total_deals_close_lost_number_change'] = $this->calculate_percentage_change( $cards_statistics['total_deals_close_lost_number'], $cards_statistics['total_deals_close_lost_number_previous'] );

		// total deals close lost value
		$cards_statistics['total_deals_close_lost_value'] = $this->get_deals_by_status_price( $date_ranges['current_start'], $date_ranges['current_end'], 'lost', $filters );
		// total deals close lost value previous
		$cards_statistics['total_deals_close_lost_value_previous'] = $this->get_deals_by_status_price( $date_ranges['previous_start'], $date_ranges['previous_end'], 'lost', $filters );
		// total deals close lost value change
		$cards_statistics['total_deals_close_lost_value_change'] = $this->calculate_percentage_change( $cards_statistics['total_deals_close_lost_value'], $cards_statistics['total_deals_close_lost_value_previous'] );

		// total deals close number
		$cards_statistics['total_deals_close_number'] = $cards_statistics['total_deals_close_won_number'] + $cards_statistics['total_deals_close_lost_number'];
		// total deals close number previous
		$cards_statistics['total_deals_close_number_previous'] = $cards_statistics['total_deals_close_won_number_previous'] + $cards_statistics['total_deals_close_lost_number_previous'];
		// total deals close number change
		$cards_statistics['total_deals_close_number_change'] = $this->calculate_percentage_change( $cards_statistics['total_deals_close_number'], $cards_statistics['total_deals_close_number_previous'] );

		// total deals close value
		$cards_statistics['total_deals_close_value'] = $cards_statistics['total_deals_close_won_value'] + $cards_statistics['total_deals_close_lost_value'];
		// total deals close value previous
		$cards_statistics['total_deals_close_value_previous'] = $cards_statistics['total_deals_close_won_value_previous'] + $cards_statistics['total_deals_close_lost_value_previous'];
		// total deals close value change
		$cards_statistics['total_deals_close_value_change'] = $this->calculate_percentage_change( $cards_statistics['total_deals_close_value'], $cards_statistics['total_deals_close_value_previous'] );

		// performance rate for number
		$cards_statistics['performance_rate_number'] = $this->calculate_percentage( $cards_statistics['total_deals_close_won_number'], $cards_statistics['total_deals_close_number'] );
		// performance rate for number previous
		$cards_statistics['performance_rate_number_previous'] = $this->calculate_percentage( $cards_statistics['total_deals_close_won_number_previous'], $cards_statistics['total_deals_close_number_previous'] );
		// performance rate for number change
		$cards_statistics['performance_rate_number_change'] = $this->calculate_percentage_change( $cards_statistics['performance_rate_number'], $cards_statistics['performance_rate_number_previous'] );

		// performance rate for value
		$cards_statistics['performance_rate_value'] = $this->calculate_percentage( $cards_statistics['total_deals_close_won_value'], $cards_statistics['total_deals_close_value'] );
		// performance rate for value previous
		$cards_statistics['performance_rate_value_previous'] = $this->calculate_percentage( $cards_statistics['total_deals_close_won_value_previous'], $cards_statistics['total_deals_close_value_previous'] );
		// performance rate for value change
		$cards_statistics['performance_rate_value_change'] = $this->calculate_percentage_change( $cards_statistics['performance_rate_value'], $cards_statistics['performance_rate_value_previous'] );

		return array(
			'total_deals_close_number'      => array(
				'label'   => 'Total Deals Close',
				'value'   => $cards_statistics['total_deals_close_number'],
				'change'  => $cards_statistics['total_deals_close_number_change'],
				'isArrow' => $cards_statistics['total_deals_close_number_change'] >= 0,
				'isColor' => $cards_statistics['total_deals_close_number_change'] >= 0,
			),
			'total_deals_close_won_number'  => array(
				'label'   => 'Total Deals Close Won Number',
				'value'   => $cards_statistics['total_deals_close_won_number'],
				'change'  => $cards_statistics['total_deals_close_won_number_change'],
				'isArrow' => $cards_statistics['total_deals_close_won_number_change'] >= 0,
				'isColor' => $cards_statistics['total_deals_close_won_number_change'] >= 0,
			),
			'total_deals_close_won_value'   => array(
				'label'   => 'Total Deals Close Won Value',
				'value'   => $cards_statistics['total_deals_close_won_value'],
				'change'  => $cards_statistics['total_deals_close_won_value_change'],
				'isArrow' => $cards_statistics['total_deals_close_won_value_change'] >= 0,
				'isColor' => $cards_statistics['total_deals_close_won_value_change'] >= 0,
			),
			'total_deals_close_lost_number' => array(
				'label'   => 'Total Deals Close Lost Number',
				'value'   => $cards_statistics['total_deals_close_lost_number'],
				'change'  => $cards_statistics['total_deals_close_lost_number_change'],
				'isArrow' => $cards_statistics['total_deals_close_lost_number_change'] >= 0,
				'isColor' => $cards_statistics['total_deals_close_lost_number_change'] < 0,
			),
			'total_deals_close_lost_value'  => array(
				'label'   => 'Total Deals Close Lost Value',
				'value'   => $cards_statistics['total_deals_close_lost_value'],
				'change'  => $cards_statistics['total_deals_close_lost_value_change'],
				'isArrow' => $cards_statistics['total_deals_close_lost_value_change'] >= 0,
				'isColor' => $cards_statistics['total_deals_close_lost_value_change'] < 0,
			),
			'total_deals_close_value'       => array(
				'label'   => 'Total Deals Close Value',
				'value'   => $cards_statistics['total_deals_close_value'],
				'change'  => $cards_statistics['total_deals_close_value_change'],
				'isArrow' => $cards_statistics['total_deals_close_value_change'] >= 0,
				'isColor' => $cards_statistics['total_deals_close_value_change'] >= 0,
			),
			'performance_rate_number'       => array(
				'label'   => 'Performance Rate Number',
				'value'   => $cards_statistics['performance_rate_number'] . '%',
				'change'  => $cards_statistics['performance_rate_number_change'],
				'isArrow' => $cards_statistics['performance_rate_number_change'] >= 0,
				'isColor' => $cards_statistics['performance_rate_number_change'] >= 0,
			),
			'performance_rate_value'        => array(
				'label'   => 'Performance Rate Value',
				'value'   => $cards_statistics['performance_rate_value'] . '%',
				'change'  => $cards_statistics['performance_rate_value_change'],
				'isArrow' => $cards_statistics['performance_rate_value_change'] >= 0,
				'isColor' => $cards_statistics['performance_rate_value_change'] >= 0,
			),
		);
	}
	/**
	 * Get won loss analytics
	 *
	 * @param array $filters Filters array.
	 * @param array $date_ranges Date ranges array.
	 * @return array Won loss analytics.
	 */
	private function get_won_loss_analytics( $filters, $date_ranges ) {
		$won_loss_analytics = array();
		// won loss analytics
		$won_loss_analytics['total_deals_won']  = $this->get_count_deals_by_status( $date_ranges['current_start'], $date_ranges['current_end'], 'won', $filters );
		$won_loss_analytics['total_deals_lost'] = $this->get_count_deals_by_status( $date_ranges['current_start'], $date_ranges['current_end'], 'lost', $filters );
		$won_loss_analytics['total_deals_open'] = $this->get_count_deals_by_status( $date_ranges['current_start'], $date_ranges['current_end'], 'open', $filters );
		$won_loss_analytics['win_rate']         = $this->calculate_percentage( $won_loss_analytics['total_deals_won'], $won_loss_analytics['total_deals_won'] + $won_loss_analytics['total_deals_lost'] );
		return $won_loss_analytics;
	}

	/**
	 * Get recent activities
	 *
	 * @param array $filters Filters array.
	 * @param array $date_ranges Date ranges array.
	 * @return array Recent activities.
	 */
	private function get_recent_activities( $filters, $date_ranges ) {
		$recent_activities = array();
		$activities        = Deal_Activity_Model::where( 'user_id', $filters['owner_id'] )
			->whereDate( 'created_at', '>=', $date_ranges['current_start'] )
			->whereDate( 'created_at', '<=', $date_ranges['current_end'] )
			->orderBy( 'created_at', 'desc' )
			->whereIn( 'activity_type', array( 'note_added', 'email_sent', 'call_logged', 'meeting_scheduled' ) )
			->limit( 5 )->get();

		foreach ( $activities as $activity ) {
			$recent_activities[] = array(
				'id'    => $activity->id,
				'type'  => $activity->activity_type,
				'title' => $activity->formatted_message,
				'time'  => $activity->created_at,
			);
		}
		return $recent_activities;
	}

	private function get_pipeline_stages_statistics( $filters, $date_ranges ) {
		$pipeline_stages_statistics = array();

		// Get the pipeline ID from filters, default to first pipeline if not specified
		$pipeline_id = $filters['pipeline_id'] ?? null;

		if ( ! $pipeline_id ) {
			// Get the first pipeline for this user's deals if no pipeline specified
			$first_deal = $this->get_filters_to_apply( $filters )->with( 'pipeline' )->first();
			if ( $first_deal && $first_deal->pipeline ) {
				$pipeline_id = $first_deal->pipeline_id;
			}
		}

		if ( ! $pipeline_id ) {
			return $pipeline_stages_statistics;
		}

		// Get the pipeline with its stages
		$pipeline = Pipeline_Model::with( 'stages' )->find( $pipeline_id );

		if ( ! $pipeline ) {
			return $pipeline_stages_statistics;
		}

		$pipeline_stages_statistics = array(
			'pipeline_id' => $pipeline->id,
			'name'        => $pipeline->name,
			'stages'      => array(),
		);

		// For each stage, get the count and value of active deals for the current user
		foreach ( $pipeline->stages as $stage ) {
			// Get deals in this stage for the current user/filters
			$stage_deals_query = $this->get_filters_to_apply( $filters )
				->where( 'stage_id', $stage->id )
				->where( 'status', 'open' )
				->where( 'pipeline_id', $pipeline_id );

			$deal_count  = $stage_deals_query->count();
			$total_value = $stage_deals_query->sum( 'value' );

			// Format the value as currency
			$formatted_value = '$' . number_format( $total_value, 0 );

			// Use the stage color or default colors
			$stage_color = $stage->color;

			$pipeline_stages_statistics['stages'][] = array(
				'id'    => $stage->id,
				'name'  => $stage->name,
				'count' => $deal_count,
				'value' => $formatted_value,
				'color' => $stage_color,
			);
		}

		return $pipeline_stages_statistics;
	}


	private function get_pipelines_for_sales_rep( $filters ) {
		// Get all pipelines that have deals for this user, plus all available pipelines
		$filters['pipeline_id'] = null;
		$user_pipeline_ids      = $this->get_filters_to_apply( $filters )
			->distinct()
			->pluck( 'pipeline_id' )
			->toArray();

		// Get all pipelines, prioritizing those with user deals
		$all_pipelines = Pipeline_Model::whereIn( 'id', $user_pipeline_ids )->orderBy( 'sort_order' )->orderBy( 'name' )->get();

		$pipelines = array();

		// First add pipelines that have deals for this user
		foreach ( $all_pipelines as $pipeline ) {
			$pipelines[ $pipeline->id ] = $pipeline->name;
		}

		return $pipelines;
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
			'source'      => array(
				'description' => 'Filter by deal source',
				'type'        => 'string',
				'enum'        => array( 'website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'trade_show', 'partner', 'other' ),
			),
		);
	}

	/**
	 * Get parameters for active deals endpoint with pagination
	 *
	 * @return array
	 */
	public function get_active_deals_params() {
		return array_merge(
			$this->get_reports_filter_params(),
			array(
				'page'     => array(
					'description' => 'Current page number',
					'type'        => 'integer',
					'default'     => 1,
					'minimum'     => 1,
				),
				'per_page' => array(
					'description' => 'Number of items per page',
					'type'        => 'integer',
					'default'     => 10,
					'minimum'     => 1,
					'maximum'     => 100,
				),
				'search'   => array(
					'description' => 'Search term for filtering deals by name or stage',
					'type'        => 'string',
				),
			)
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

		// Source filter
		if ( $request->get_param( 'source' ) ) {
			$filters['source'] = sanitize_text_field( $request->get_param( 'source' ) );
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
		$deals_won_current  = $this->get_count_deals_by_status(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			'won',
			$filters
		);
		$deals_won_previous = $this->get_count_deals_by_status(
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

		$deals_lost_current  = $this->get_count_deals_by_status(
			$date_ranges['current_start'],
			$date_ranges['current_end'],
			'lost',
			$filters
		);
		$deals_lost_previous = $this->get_count_deals_by_status(
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
		$query = $this->get_deals_by_status( $start_date, $end_date, 'all', $filters );

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
		$contacts_deals = $this->get_deals_by_status( $start_date, $end_date, 'all', $filters );

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
		return $this->get_deals_by_status( $start_date, $end_date, 'all', $filters )->count();
	}



	/**
	 * Count deals won in date range
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 * @param array  $filters Optional filters array.
	 * @return \Illuminate\Database\Eloquent\Builder Deal collection
	 */
	private function get_deals_by_status( $start_date, $end_date, $status, $filters = array() ) {
		$query = $this->get_filters_to_apply( $filters );
		if ( $status === 'open' || $status === 'won' || $status === 'lost' ) {
			$query->where( 'status', $status );
			if ( $status === 'won' || $status === 'lost' ) {
				$query->where( $status . '_time', '>=', $start_date )
					->where( $status . '_time', '<=', $end_date );
			} else {
				$query->whereBetween( 'created_at', array( $start_date . ' 00:00:00', $end_date . ' 23:59:59' ) );
			}
		} else {
			$query->whereBetween( 'created_at', array( $start_date . ' 00:00:00', $end_date . ' 23:59:59' ) );
		}

		return $query;
	}

	private function get_count_deals_by_status( $start_date, $end_date, $status, $filters = array() ) {
		return $this->get_deals_by_status( $start_date, $end_date, $status, $filters )->count();
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
		return $this->get_deals_by_status( $start_date, $end_date, $status, $filters )->sum( 'value' );
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
		$won_query = $this->get_deals_by_status( $start_date, $end_date, 'won', $filters );

		$won_deals = $won_query->get();

		// Get lost deals
		$lost_query = $this->get_deals_by_status( $start_date, $end_date, 'lost', $filters );

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

	private function calculate_percentage( $current, $previous ) {
		if ( $previous <= 0 ) {
			return 0;
		}
		return round( ( $current / $previous ) * 100, 2 );
	}




	/**
	 * Filters to apply to queries (excluding date filters to avoid conflicts)
	 *
	 * @param array $filters Filters array.
	 * @return \Illuminate\Database\Eloquent\Builder Query builder object.
	 */
	private function get_filters_to_apply( $filters = array() ) {
		$query = Deal_Model::query();

		if ( ! empty( $filters['date_from'] ) && ! empty( $filters['date_to'] ) ) {
			$query->whereDate( 'created_at', '>=', $filters['date_from'] )
				->whereDate( 'created_at', '<=', $filters['date_to'] );
		}
		// source filter
		if ( ! empty( $filters['source'] ) ) {
			$query->where( 'source', $filters['source'] );
		}
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

	/**
	 * Get contacts deals reports permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_contacts_deals_reports_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Get deals by date reports permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_deals_by_date_reports_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Get deals leaderboard reports permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_deals_leaderboard_reports_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Get sales rep reports permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_sales_rep_reports_permissions_check( $request ) {
		return Permissions::has_deal_owner_access();
	}

	/**
	 * Get sales rep pipeline stages reports permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_sales_rep_pipeline_stages_reports_permissions_check( $request ) {
		return Permissions::has_deal_owner_access();
	}

	/**
	 * Get sales rep active deals reports permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_sales_rep_active_deals_reports_permissions_check( $request ) {
		return Permissions::has_deal_owner_access();
	}

	/**
	 * Get all sales rep reports permissions check
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_all_sales_rep_reports_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
