<?php

/**
 * Abstract Campaign Controller
 * Base class for all campaign REST controllers
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\User_Roles\Permissions;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Utils;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Services\Campaign_Analytics;
use QuillCRM\Managers\Campaign_Status_Manager;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\Constants\Campaign_Channel;

/**
 * Abstract_Campaign_Controller class
 */
abstract class Abstract_Campaign_Controller extends REST_Controller {

	/**
	 * Campaign channel (email, sms, whatsapp)
	 *
	 * @var string
	 */
	protected $channel;

	/**
	 * Analytics service
	 *
	 * @var Campaign_Analytics
	 */
	protected $analytics;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->analytics = Campaign_Analytics::instance();
	}

	/**
	 * Get campaign query - default implementation filters by channel if set
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	protected function get_campaign_query() {
		if ( $this->channel ) {
			// Convert string to integer for database query (accessors don't work in WHERE)
			$type_int = Campaign_Channel::to_integer( $this->channel );
			return Campaign_Model::query()->whereRaw( 'type = ?', array( $type_int ) );
		}
		return Campaign_Model::query();
	}

	/**
	 * Get campaign message query - default implementation based on channel
	 *
	 * @param int $campaign_id
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	protected function get_campaign_message_query( $campaign_id ) {
		if ( ! $this->channel ) {
			return Communication_Tracking_Model::query()
				->where( 'source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN )
				->where( 'source_id', $campaign_id );
		}

		$mode_map = array(
			'email'    => Communication_Tracking_Model::MODE_EMAIL,
			'sms'      => Communication_Tracking_Model::MODE_SMS,
			'whatsapp' => Communication_Tracking_Model::MODE_WHATSAPP,
		);

		$mode = $mode_map[ $this->channel ] ?? Communication_Tracking_Model::MODE_EMAIL;

		return Communication_Tracking_Model::query()
			->where( 'mode', $mode )
			->where( 'source_type', \QuillCRM\Constants\Message_Source_Types::CAMPAIGN )
			->where( 'source_id', $campaign_id );
	}

	/**
	 * Register common routes
	 *
	 * @return void
	 */
	protected function register_common_routes() {
		// Main CRUD routes
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
							'items'       => array( 'type' => 'integer' ),
							'required'    => true,
						),
					),
				),
			)
		);

		// Individual item routes
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

		// Analytics route
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/analytics',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_analytics' ),
					'permission_callback' => array( $this, 'get_analytics_permissions_check' ),
					'args'                => $this->get_analytics_params(),
				),
			)
		);

		// Campaign time-series analytics route
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/time-series',
			array(
				'args' => array(
					'id'     => array(
						'description' => __( 'Campaign ID', 'quillcrm' ),
						'type'        => 'integer',
						'required'    => true,
					),
					'period' => array(
						'description' => __( 'Time period for grouping', 'quillcrm' ),
						'type'        => 'string',
						'enum'        => array( 'hour', 'day', 'week', 'month' ),
						'default'     => 'day',
					),
					'limit'  => array(
						'description' => __( 'Number of periods to return', 'quillcrm' ),
						'type'        => 'integer',
						'default'     => 30,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_time_series' ),
					'permission_callback' => array( $this, 'get_analytics_permissions_check' ),
				),
			)
		);

		// Duplicate route
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/duplicate',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'duplicate_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		// Campaign messages route - child controllers should register this with campaign-type-specific status enums
	}

	/**
	 * Get all campaigns
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		try {
			$keywords = $request->get_param( 'keywords' ) ?? null;
			$per_page = $request->get_param( 'per_page' ) ?? 10;
			$page     = $request->get_param( 'page' ) ?? 1;
			$from     = $request->get_param( 'from' ) ?? null;
			$to       = $request->get_param( 'to' ) ?? null;

			// New filter parameters
			$status        = $request->get_param( 'status' ) ?? null;
			$campaign_type = $request->get_param( 'campaign_type' ) ?? null;
			$created_from  = $request->get_param( 'created_from' ) ?? null;
			$created_to    = $request->get_param( 'created_to' ) ?? null;
			$updated_from  = $request->get_param( 'updated_from' ) ?? null;
			$updated_to    = $request->get_param( 'updated_to' ) ?? null;

			$query       = $this->get_campaign_query();
			$total_count = $query->count();

			// Apply filters
			if ( $keywords ) {
				$query->where( 'name', 'like', '%' . $keywords . '%' );
			}

			// Status filter
			if ( $status ) {
				$query->where( 'status', $status );
			}

			// Campaign type filter (standard or ab_test)
			if ( $campaign_type ) {
				if ( $campaign_type === 'standard' ) {
					// Standard campaigns have ab_test = false or null in settings
					$query->where(
						function ( $q ) {
							$q->whereRaw( "JSON_EXTRACT(settings, '$.ab_test') = false" )
							->orWhereRaw( "JSON_EXTRACT(settings, '$.ab_test') IS NULL" );
						}
					);
				} elseif ( $campaign_type === 'ab_test' ) {
					// A/B test campaigns have ab_test = true in settings
					$query->whereRaw( "JSON_EXTRACT(settings, '$.ab_test') = true" );
				}
			}

			// Backward compatibility: use from/to for created_at if provided
			if ( $from ) {
				$query->where( 'created_at', '>=', $from );
			}
			if ( $to ) {
				$query->where( 'created_at', '<=', $to );
			}

			// New created_at date range filters
			if ( $created_from ) {
				$query->where( 'created_at', '>=', $created_from );
			}
			if ( $created_to ) {
				$query->where( 'created_at', '<=', $created_to );
			}

			// Updated_at date range filters
			if ( $updated_from ) {
				$query->where( 'updated_at', '>=', $updated_from );
			}
			if ( $updated_to ) {
				$query->where( 'updated_at', '<=', $updated_to );
			}

			$campaigns = $query->orderBy( 'created_at', 'desc' )
				->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response(
				$campaigns->toArray() + array( 'total_count' => $total_count ),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get single campaign
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = $this->get_campaign_query()->find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', sprintf( __( '%s Campaign not found', 'quillcrm' ), ucfirst( $this->channel ) ), array( 'status' => 404 ) );
			}

			// Attach full template data for frontend use
			$campaign->attach_templates( $campaign );

			return new WP_REST_Response( $campaign, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create campaign
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function create_item( $request ) {
		try {
			$campaign_data = $this->prepare_campaign( $request );
			// Pass string directly - model's setTypeAttribute will convert to integer
			$campaign_data['type'] = $this->channel;
			$campaign              = Campaign_Model::create( $campaign_data );

			// Attach analytics counts for frontend use
			$campaign->attach_counts( $campaign );

			return new WP_REST_Response( $campaign, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update campaign
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = $this->get_campaign_query()->find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', sprintf( __( '%s Campaign not found', 'quillcrm' ), ucfirst( $this->channel ) ), array( 'status' => 404 ) );
			}

			if ( $campaign['status'] !== 'draft' ) {
				return new WP_Error( 'error', __( 'Campaign is not draft', 'quillcrm' ), array( 'status' => 400 ) );
			}

			$campaign_data = $this->prepare_campaign( $request );

			// Recalculate count if filters were updated
			if ( isset( $campaign_data['settings']['filters'] ) ) {
				$filters                = $campaign_data['settings']['filters'] ?? array();
				$contact_filter         = \QuillCRM\Services\Campaign_Contact_Filter::instance();
				$campaign_data['count'] = $contact_filter->get_contact_count( $this->channel, $filters );
			}

			// Only set is_attached if templates are NOT being sent
			// Email campaigns send template_ids only (not full templates)
			// SMS/WhatsApp campaigns send full templates array and need them processed
			if ( ! isset( $campaign_data['settings']['templates'] ) ) {
				$campaign_data['settings']['is_attached'] = true;
			}

			$campaign->update( $campaign_data );

			// Attach full template data for frontend use
			$campaign->attach_templates( $campaign );
			// Attach analytics counts (sent, clicked, etc.) for frontend use
			$campaign->attach_counts( $campaign );

			return new WP_REST_Response( $campaign, 200 );
		} catch ( \Exception $e ) {
			$logger = quillcrm_get_logger();
			$logger->error(
				'Campaign update error: ' . $e->getMessage(),
				array(
					'campaign_id' => $campaign_id,
					'trace'       => $e->getTraceAsString(),
				)
			);
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete campaign
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function delete_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = $this->get_campaign_query()->find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', sprintf( __( '%s Campaign not found', 'quillcrm' ), ucfirst( $this->channel ) ), array( 'status' => 404 ) );
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
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function delete_items( $request ) {
		try {
			$campaign_ids = $request->get_param( 'ids' );
			$campaigns    = $this->get_campaign_query()->whereIn( 'id', $campaign_ids )->get();

			if ( $campaigns->isEmpty() ) {
				return new WP_Error( 'error', sprintf( __( '%s Campaigns not found', 'quillcrm' ), ucfirst( $this->channel ) ), array( 'status' => 404 ) );
			}

			Campaign_Model::destroy( $campaign_ids );

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Duplicate campaign
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function duplicate_item( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$campaign    = $this->get_campaign_query()->find( $campaign_id );

			if ( ! $campaign ) {
				return new WP_Error( 'error', sprintf( __( '%s Campaign not found', 'quillcrm' ), ucfirst( $this->channel ) ), array( 'status' => 404 ) );
			}

			$campaign_data = $campaign->toArray();
			unset( $campaign_data['id'], $campaign_data['created_at'], $campaign_data['updated_at'] );

			// Clean up template data for duplication:
			// 1. Remove template_id from each template to force creation of new Template_Model records
			// 2. Remove template_ids array - it will be regenerated by Campaign_Model::saving() hook
			if ( isset( $campaign_data['settings']['templates'] ) && is_array( $campaign_data['settings']['templates'] ) ) {
				foreach ( $campaign_data['settings']['templates'] as $key => $template ) {
					unset( $campaign_data['settings']['templates'][ $key ]['template_id'] );
				}
			}
			unset( $campaign_data['settings']['template_ids'] );

			$campaign_data['status'] = 'draft';
			$campaign_data['name']   = $campaign_data['name'] . ' - Copy';
			$new_campaign            = Campaign_Model::create( $campaign_data );

			return new WP_REST_Response( $new_campaign, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get campaign messages - unified implementation for all campaign types
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_campaign_messages( $request ) {
		try {
			$campaign_id = $request->get_param( 'id' );
			$per_page    = $request->get_param( 'per_page' ) ?: 10;
			$page        = $request->get_param( 'page' ) ?: 1;
			$status      = $request->get_param( 'status' ) ?: '';

			$query = $this->get_campaign_message_query( $campaign_id );

			// Apply status filter if provided
			if ( ! empty( $status ) && $status !== 'all' ) {
				$this->apply_message_status_filter( $query, $status );
			}

			$campaign_messages = $query->with( 'contact', 'template' )
				->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $campaign_messages, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Apply status filter to message query
	 * Can be overridden by child classes for type-specific filtering
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query
	 * @param string                                $status
	 * @return void
	 */
	protected function apply_message_status_filter( $query, $status ) {
		// Common status filters across all campaign types
		switch ( $status ) {
			case 'failed':
				$query->where( 'status', Tracking_Status::FAILED );
				break;
			case 'sent':
				$query->where( 'status', Tracking_Status::SENT );
				break;
			case 'pending':
				$query->where( 'status', Tracking_Status::PENDING );
				break;
			case 'delivered':
				$query->where( 'status', Tracking_Status::DELIVERED );
				break;
			case 'opened':
				// Email-specific: check opened column
				$query->where( 'opened', 1 );
				break;
			case 'clicked':
				// Email-specific: check clicked column
				$query->where( 'clicked', 1 );
				break;
			case 'scheduled':
				// Scheduled messages
				$query->where( 'status', Tracking_Status::SCHEDULED );
				break;
		}
	}

	/**
	 * Get analytics
	 * Cached for 5 minutes to improve performance
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_analytics( $request ) {
		try {
			$interval   = $request->get_param( 'interval' ) ?: 'last_30_days';
			$start_date = $request->get_param( 'start_date' ) ?: '';
			$end_date   = $request->get_param( 'end_date' ) ?: '';

			// Allow channel to be set via request parameter (for unified endpoint)
			$channel = $request->get_param( 'channel' );
			if ( ! empty( $channel ) ) {
				// Validate it's a valid channel string
				$valid_channels = Campaign_Channel::get_core_channel_strings();
				if ( in_array( $channel, $valid_channels, true ) ) {
					$this->channel = $channel;
				}
			}

			// Ensure channel is set
			if ( empty( $this->channel ) ) {
				return new WP_Error(
					'missing_channel',
					__( 'Channel parameter is required', 'quillcrm' ),
					array( 'status' => 400 )
				);
			}

			// Generate cache key
			$cache_key = sprintf(
				'quillcrm_analytics_%s_%s_%s_%s',
				$this->channel,
				$interval,
				$start_date,
				$end_date
			);

		// Try to get cached result
		$analytics = get_transient( $cache_key );

		if ( false === $analytics ) {
			// Cache miss - fetch fresh data
			// Pass string channel directly to analytics service
			$analytics = $this->analytics->get_analytics( $this->channel, $interval, $start_date, $end_date );

			// Cache for 5 minutes
			set_transient( $cache_key, $analytics, 5 * MINUTE_IN_SECONDS );
		}

		// Normalize analytics response using centralized method
		$response = Campaign_Analytics::normalize_response( $analytics, $this->channel );

		return new WP_REST_Response( $response, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get campaign time-series analytics
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_campaign_time_series( $request ) {
		try {
			$campaign_id = (int) $request->get_param( 'id' );
			$period      = $request->get_param( 'period' ) ?: 'day';
			$limit       = (int) ( $request->get_param( 'limit' ) ?: 30 );

			// Validate campaign exists and matches type
			$campaign = $this->get_campaign_query()->find( $campaign_id );
			if ( ! $campaign ) {
				return new WP_Error( 'not_found', __( 'Campaign not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Generate cache key
			$cache_key = sprintf(
				'quillcrm_timeseries_%s_%d_%s_%d',
				$this->channel,
				$campaign_id,
				$period,
				$limit
			);

			// Try to get cached result
			$time_series = get_transient( $cache_key );

			if ( false === $time_series ) {
				// Cache miss - fetch fresh data
				$time_series = $this->analytics->get_campaign_time_series(
					$campaign_id,
					$this->channel,
					$period,
					$limit
				);

				// Cache for 5 minutes
				set_transient( $cache_key, $time_series, 5 * MINUTE_IN_SECONDS );
			}

			return new WP_REST_Response( $time_series, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare campaign data
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return array
	 */
	protected function prepare_campaign( $request ) {
		$campaign_data = array(
			'name'        => $request->get_param( 'name' ),
			'description' => $request->get_param( 'description' ),
			'status'      => $request->get_param( 'status' ),
			'settings'    => $request->get_param( 'settings' ),
			'count'       => $request->get_param( 'count' ),
			'execute_at'  => $request->get_param( 'execute_at' ),
		);

		foreach ( $campaign_data as $key => $value ) {
			if ( empty( $value ) && $value !== 0 ) {
				unset( $campaign_data[ $key ] );
			}
		}

		return $campaign_data;
	}

	/**
	 * Get collection parameters
	 *
	 * @return array
	 */
	public function get_collection_params() {
		return array(
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
		);
	}

	/**
	 * Get analytics parameters
	 *
	 * @return array
	 */
	public function get_analytics_params() {
		return array(
			'channel'    => array(
				'description' => __( 'Campaign channel (email, sms, whatsapp).', 'quillcrm' ),
				'type'        => 'string',
				'enum'        => Campaign_Channel::get_core_channel_strings(),
				'required'    => false,
			),
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
		);
	}

	/**
	 * Process merge tags in message content
	 * Common merge tag processing for all campaign types (Email, SMS, WhatsApp)
	 *
	 * @param string             $message Message content
	 * @param Contact_Model|null $contact Contact for merge tags (can be null)
	 * @return string Processed message
	 */
	protected function process_merge_tags( $message, $contact ) {
		return \QuillCRM\Managers\Merge_Tags_Manager::instance()->process_merge_tags( $message, $contact );
	}

	/**
	 * Validate campaign status
	 *
	 * @param string          $status
	 * @param WP_REST_Request $request
	 * @param string          $param
	 *
	 * @return bool|WP_Error
	 */
	public function validate_campaign_status( $status, $request, $param ) {
		$status_manager = Campaign_Status_Manager::instance();

		if ( ! $status_manager->is_valid_status( $status ) ) {
			return new WP_Error(
				'invalid_campaign_status',
				sprintf( __( 'Invalid campaign status: %s', 'quillcrm' ), $status ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Permission checks - all return the same for campaigns
	 */
	public function get_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
	public function get_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
	public function create_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
	public function update_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
	public function delete_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
	public function delete_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
	public function get_analytics_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
