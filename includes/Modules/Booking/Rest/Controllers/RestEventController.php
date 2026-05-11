<?php

/**
 * Class Rest_Event_Controller
 *
 * This class is responsible for handling the event controller
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Rest\Controllers;

use DoubleScale\Modules\Booking\Models\AvailabilityModel;
use WP_Error;
use Exception;
use Illuminate\Support\Arr;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Booking\Models\EventModel;
use DoubleScale\Modules\Booking\Capabilities;
use DoubleScale\Modules\Booking\Services\AvailabilityService;
use DoubleScale\Modules\Booking\EventFields\EventFields;
use DoubleScale\Modules\Booking\Models\CalendarModel;
use DoubleScale\Modules\Booking\Models\UserModel;
use DoubleScale\Modules\Booking\Managers\LocationsManager;
use DoubleScale\Modules\Booking\PaymentGateway\PaymentValidator;

/**
 * Event Controller class
 */
class RestEventController extends RestController {


	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'booking/events';

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
							'description' => __( 'Keyword to search.', 'doublescale' ),
							'type'        => 'string',
						),
						'per_page' => array(
							'description' => __( 'Number of items to fetch.', 'doublescale' ),
							'type'        => 'integer',
						),
						'page'     => array(
							'description' => __( 'Page number.', 'doublescale' ),
							'type'        => 'integer',
						),
						'filter'   => array(
							'description' => __( 'Filter the results.', 'doublescale' ),
							'type'        => 'object',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the object.', 'doublescale' ),
					'type'        => 'integer',
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
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/range',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the object.', 'doublescale' ),
					'type'        => 'integer',
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item_range' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item_availability' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'availability' => array(
							'description'          => __( 'Availability to update.', 'doublescale' ),
							'type'                 => 'object',
							'additionalProperties' => true,
							'required'             => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/fields',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the object.', 'doublescale' ),
					'type'        => 'integer',
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fields' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_fields' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'fields' => array(
							'description'          => __( 'Fields to update.', 'doublescale' ),
							'type'                 => 'object',
							'additionalProperties' => true,
							'required'             => true,
						),
					),
				),
			)
		);

		// Duplicate event
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/duplicate',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'duplicate_item' ),
					'permission_callback' => array( $this, 'duplicate_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Event ID to duplicate.', 'doublescale' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
				),
			)
		);

		// Get meta
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/meta/(?P<key>[\w-]+)',
			array(
				'id' => array(
					'description' => __( 'Unique identifier for the object.', 'doublescale' ),
					'type'        => 'integer',
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_meta' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);

		// hande event disable status
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/disable-status',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'disable_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'id'         => array(
							'description' => __( 'Unique identifier for the object.', 'doublescale' ),
							'type'        => 'integer',
							'context'     => array( 'view', 'edit' ),
							'readonly'    => true,
						),
						'properties' => array(
							'status' => array(
								'description' => __( 'Disable status.', 'doublescale' ),
								'type'        => 'boolean',
								'context'     => array( 'view', 'edit' ),
								'readonly'    => true,
							),
						),
					),
				),
			)
		);

		// Get latest events
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/latest',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_latest_events' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'limit'   => array(
							'description' => __( 'Number of events to retrieve.', 'doublescale' ),
							'type'        => 'integer',
							'default'     => 5,
						),
						'user_id' => array(
							'description' => __( 'Filter by user ID.', 'doublescale' ),
							'type'        => 'integer',
						),
						'status'  => array(
							'description' => __( 'Filter by event status.', 'doublescale' ),
							'type'        => 'string',
							'enum'        => array( 'active', 'inactive' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Get item schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		 return array(
			 '$schema'    => 'http://json-schema.org/draft-04/schema#',
			 'title'      => 'event',
			 'type'       => 'object',
			 'properties' => array(
				 'id'            => array(
					 'description' => __( 'Unique identifier for the object.', 'doublescale' ),
					 'type'        => 'integer',
					 'context'     => array( 'view' ),
					 'readonly'    => true,
				 ),
				 'hash_id'       => array(
					 'description' => __( 'Unique identifier for the object.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view' ),
					 'readonly'    => true,
				 ),
				 'calendar_id'   => array(
					 'description' => __( 'Calendar ID.', 'doublescale' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'absint',
					 ),
				 ),
				 'user_id'       => array(
					 'description' => __( 'User ID.', 'doublescale' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'arg_options' => array(
						 'sanitize_callback' => 'absint',
					 ),
				 ),
				 'name'          => array(
					 'description' => __( 'Event name.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'is_disabled'   => array(
					 'description' => __( 'Is event disabled.', 'doublescale' ),
					 'type'        => 'boolean',
					 'context'     => array( 'view', 'edit' ),
				 ),
				 'description'   => array(
					 'description' => __( 'Event description.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'slug'          => array(
					 'description' => __( 'Event slug.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_title',
					 ),
				 ),
				 'status'        => array(
					 'description' => __( 'Event status.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
					 'enum'        => array( 'active', 'inactive' ),
				 ),
				 'type'          => array(
					 'description' => __( 'Event type.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
					 'enum'        => array( 'one-to-one', 'group', 'round-robin', 'collective' ),
				 ),
				 'duration'      => array(
					 'description' => __( 'Event duration.', 'doublescale' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'absint',
					 ),
				 ),
				 'color'         => array(
					 'description' => __( 'Event color.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'visibility'    => array(
					 'description' => __( 'Event visibility.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
					 'enum'        => array( 'public', 'private' ),
				 ),
				 'reserve_times' => array(
					 'description' => __( 'Reserve times.', 'doublescale' ),
					 'type'        => 'boolean',
					 'context'     => array( 'view', 'edit' ),
				 ),
				 'created_at'    => array(
					 'description' => __( 'Event created at.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'readonly'    => true,
				 ),
				 'updated_at'    => array(
					 'description' => __( 'Event updated at.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'readonly'    => true,
				 ),
			 ),
		 );
	}

	/**
	 * Get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		try {
			$per_page = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page     = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$keyword  = $request->get_param( 'keyword' );
			$filter   = $request->get_param( 'filter' ) ?? array();
			$user     = Arr::get( $filter, 'user' ) ? Arr::get( $filter, 'user' ) : 'own';

			if ( 'own' === $user ) {
				$user = get_current_user_id();
			}

			if ( ( 'all' === $user || get_current_user_id() !== $user ) && ! current_user_can( 'doublescale_booking_read_all_calendars' ) ) {
				error_log( 'Booking Event Controller: Permission denied for user ' . get_current_user_id() . ' to access events' );
				return new WP_Error( 'rest_event_error', __( 'You do not have permission', 'doublescale' ), array( 'status' => 403 ) );
			}

			$query = EventModel::with( array( 'calendar' ) );

			if ( $keyword ) {
				$query->where( 'name', 'LIKE', '%' . $keyword . '%' );
			}

			if ( 'all' !== $user ) {
				$query->where( 'user_id', $user );
			}

			$events = $query->paginate( $per_page, array( '*' ), 'page', $page );

			// Prepare events for response to include calendar data
			$events_data     = $events->toArray();
			$prepared_events = array();
			foreach ( $events->items() as $event ) {
				$prepared_events[] = $this->prepare_event_for_response( $event );
			}
			$events_data['data'] = $prepared_events;

			return new WP_REST_Response( $events_data, 200 );
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in get_items: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'doublescale_booking_manage_own_calendars' ) || current_user_can( 'doublescale_booking_read_all_calendars' );
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		try {
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$calendar_id       = $request->get_param( 'calendar_id' );
			$name              = $request->get_param( 'name' );
			$description       = $request->get_param( 'description' );
			$status            = $request->get_param( 'status' );
			$type              = $request->get_param( 'type' );
			$duration          = $request->get_param( 'duration' );
			$color             = $request->get_param( 'color' );
			$visibility        = $request->get_param( 'visibility' );
			$location          = $request->get_param( 'location' );
			$hosts             = $request->get_param( 'hosts' );
			$payments_settings = $request->get_param( 'payments_settings' );
			$group_settings    = $request->get_param( 'group_settings' );
			$color             = $request->get_param( 'color' ) ?: '#3A3A99'; // Default color if not provided

			if ( empty( $location ) ) {
				error_log( 'Booking Event Controller: Event location is required for event creation' );
				return new WP_Error( 'rest_event_error', __( 'Event location is required.', 'doublescale' ), array( 'status' => 400 ) );
			}

			$calendar = CalendarModel::find( $calendar_id );
			if ( ! $calendar ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Calendar not found for event creation with ID: ' . $calendar_id );
				return new WP_Error( 'rest_event_error', __( 'You must add event to a calendar.', 'doublescale' ), array( 'status' => 400 ) );
			}

			$team_events = array( 'collective', 'round-robin' );
			$host_events = array( 'one-to-one', 'group' );

			if ( ( 'host' === $calendar->type && ! in_array( $type, $host_events ) ) || ( 'team' === $calendar->type && ! in_array( $type, $team_events ) ) ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Invalid event type ' . $type . ' for calendar type ' . $calendar->type );
				return new WP_Error( 'rest_event_error', __( 'Invalid event type.', 'doublescale' ), array( 'status' => 400 ) );
			}

			// Validate hosts for team calendar events
			if ( 'team' === $calendar->type && in_array( $type, $team_events ) ) {
				if ( empty( $hosts ) || ! is_array( $hosts ) || count( $hosts ) === 0 ) {
					$wpdb->query( 'ROLLBACK' );
					error_log( 'Booking Event Controller: Team events require at least one host to be selected for calendar ID: ' . $calendar_id );
					return new WP_Error( 'rest_event_error', __( 'Team events require at least one host to be selected.', 'doublescale' ), array( 'status' => 400 ) );
				}
			}

			// Validate payment settings if provided
			if ( $payments_settings ) {
				// Use Payment_Validator to validate payment settings
				$validation_result = PaymentValidator::validate_payment_gateways( $payments_settings );

				// If validation fails, block the create operation and return error
				if ( is_wp_error( $validation_result ) ) {
					$wpdb->query( 'ROLLBACK' );
					error_log( 'Booking Event Controller: Payment validation failed: ' . $validation_result->get_error_message() );
					return $validation_result;
				}
			}

			$event_data = array(
				'calendar_id' => $calendar_id,
				'name'        => $name,
				'description' => $description,
				'status'      => $status ?? 'active',
				'type'        => $type,
				'duration'    => $duration,
				'color'       => $color,
				'visibility'  => $visibility,
				'is_disabled' => false,
			);
			$event_data['availability_meta']['custom_availability'] = AvailabilityModel::getDefaultAvailability();

			if ( 'host' === $calendar->type ) {
				$default_availability = AvailabilityModel::where( 'user_id', $calendar->user_id )->where( 'is_default', 1 )->first();
				if ( ! $default_availability ) {
					$wpdb->query( 'ROLLBACK' );
					error_log( 'Booking Event Controller: Default availability not found for user ID: ' . $calendar->user_id );
					return new WP_Error( 'rest_event_error', __( 'Default availability not found', 'doublescale' ), array( 'status' => 500 ) );
				}
				$event_data['availability_id']   = $default_availability->id;
				$event_data['availability_type'] = 'existing';
			} else {
				$event_data['availability_meta']['is_common'] = false;
				$event_data['availability_type']              = 'existing';

				$primary_host_availability = AvailabilityModel::where( 'user_id', $hosts[0] )->where( 'is_default', 1 )->first();
				if ( ! $primary_host_availability ) {
					$wpdb->query( 'ROLLBACK' );
					$user_label = $this->describe_host_for_error( (int) $hosts[0] );
					error_log( 'Booking Event Controller: Default availability not found for team member: ' . $user_label );
					return new WP_Error(
						'rest_event_error',
						sprintf(
							/* translators: %s: human-readable host identifier (display name or ID). */
							__( 'Default availability not found for team member %s. Open Booking → Availability and create a default schedule for this user before adding them to a team event.', 'doublescale' ),
							$user_label
						),
						array( 'status' => 400 )
					);
				}
				$event_data['availability_id'] = $primary_host_availability->id;

				foreach ( $hosts as $host ) {
					$host_availability = AvailabilityModel::where( 'user_id', $host )->where( 'is_default', 1 )->first();
					if ( ! $host_availability ) {
						$wpdb->query( 'ROLLBACK' );
						$user_label = $this->describe_host_for_error( (int) $host );
						error_log( 'Booking Event Controller: Default availability not found for team member: ' . $user_label );
						return new WP_Error(
							'rest_event_error',
							sprintf(
								/* translators: %s: human-readable host identifier (display name or ID). */
								__( 'Default availability not found for team member %s. Open Booking → Availability and create a default schedule for this user before adding them to a team event.', 'doublescale' ),
								$user_label
							),
							array( 'status' => 400 )
						);
					}
					$event_data['availability_meta']['hosts_schedules'][ $host ] = $host_availability->id;
				}
			}

			$event_data['availability_meta'] = maybe_serialize( $event_data['availability_meta'] );

			$event_data = array_filter( $event_data );
			$event      = EventModel::create( $event_data );
			$event->setEventRangeAttribute(
				array(
					'type' => 'days',
					'days' => 60,
				)
			);
			if ( ! $event->id ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Failed to create event in database' );
				return new WP_Error( 'rest_event_error', __( 'Event not created', 'doublescale' ), array( 'status' => 500 ) );
			}

			$event->setReserveTimesAttribute( false );
			$event->location            = $location;
			$event->limits              = EventFields::instance()->get_default_limit_settings();
			$event->email_notifications = EventFields::instance()->get_default_email_notification_settings();
			$event->additional_settings = EventFields::instance()->get_default_additional_settings( $type );
			$event->advanced_settings   = EventFields::instance()->get_default_advanced_settings();
			$event->sms_notifications   = EventFields::instance()->get_default_sms_notification_settings();
			$event->payments_settings   = $payments_settings ?? EventFields::instance()->get_default_payments_settings();
			$event->team_members        = $hosts;
			if ( 'group' === $type ) {
				$event->group_settings = $group_settings ?? array(
					'max_invites'    => 2,
					'show_remaining' => true,
				);
			}

			$event->save();
			// Set system fields based on the validated location
			$event->setSystemFields();

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
			error_log( 'Booking Event Controller Error in create_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function create_item_permissions_check( $request ) {
		$calendar_id = $request->get_param( 'calendar_id' );
		return Capabilities::can_manage_calendar( $calendar_id );
	}

	/**
	 * Delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_items( $request ) {
		try {
			$ids = $request->get_param( 'ids' );

			if ( ! $ids ) {
				error_log( 'Booking Event Controller: No event IDs provided for deletion' );
				return new WP_Error( 'rest_event_error', __( 'No events to delete', 'doublescale' ), array( 'status' => 400 ) );
			}

			foreach ( $ids as $id ) {
				$event = EventModel::find( $id );

				if ( ! $event ) {
					error_log( 'Booking Event Controller: Event not found for deletion with ID: ' . $id );
					return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
				}

				$event->delete();
			}

			return new WP_REST_Response( $ids, 200 );
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in delete_items: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function delete_items_permissions_check( $request ) {
		return current_user_can( 'doublescale_booking_manage_all_calendars' );
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	// Inside REST_Event_Controller::get_item method in class-rest-event-controller.php

	public function get_item( $request ) {
		try {
			$id    = $request->get_param( 'id' );
			$event = EventModel::with( 'calendar', 'availability' )->where( 'id', $id )->first();

			if ( ! $event ) {
				error_log( 'Booking Event Controller: Event not found with ID: ' . $id );
				return new WP_Error(
					'rest_event_not_found',
					__( 'Event not found', 'doublescale' ),
					array( 'status' => 404 )
				);
			}

			$usersId = $event->getTeamMembersAttribute() ?: $event->user_id;
			$usersId = is_array( $usersId ) ? $usersId : array( $usersId );

			$users = array();
			foreach ( $usersId as $userId ) {
				$user = UserModel::find( $userId );

				if ( $user ) {
					$user_avatar_url = get_avatar_url( $user->ID );
					$availabilities  = AvailabilityModel::where( 'user_id', $user->ID )->get();

					$users[] = array(
						'id'             => $user->ID,
						'name'           => $user->display_name,
						'image'          => $user_avatar_url,
						'availabilities' => $availabilities,
					);
				}
			}

			$event->hosts   = $users;
			$event->reserve = $event->getReserveTimesAttribute();

			return new WP_REST_Response( $event, 200 );
		} catch ( \Throwable $e ) { // Catch Throwable
			error_log( 'Booking Event Controller Error in get_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get item availability
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item_range( $request ) {
		try {
			$id    = $request->get_param( 'id' );
			$event = EventModel::find( $id );

			if ( ! $event ) {
				error_log( 'Booking Event Controller: Event not found for range retrieval with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			$data = array(
				'range' => $event->getEventRangeAttribute(),
			);

			return new WP_REST_Response( $data, 200 );
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in get_item_range: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_fields( $request ) {
		try {
			$id    = $request->get_param( 'id' );
			$event = EventModel::find( $id );

			if ( ! $event ) {
				error_log( 'Booking Event Controller: Event not found for fields retrieval with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $event->fields, 200 );
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in get_fields: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function get_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_read_event( $id ) || current_user_can( 'doublescale_booking_read_all_calendars' );
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		try {
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );
			$id                  = $request->get_param( 'id' );
			$user_id             = $request->get_param( 'user_id' );
			$name                = $request->get_param( 'name' );
			$description         = $request->get_param( 'description' );
			$status              = $request->get_param( 'status' );
			$type                = $request->get_param( 'type' );
			$dynamic_duration    = $request->get_param( 'dynamic_duration' );
			$duration            = $request->get_param( 'duration' );
			$color               = $request->get_param( 'color' );
			$event_availability  = $request->get_param( 'event_availability' );
			$availability_meta   = $request->get_param( 'event_availability_meta' );
			$availability_type   = $request->get_param( 'availability_type' );
			$team_availability   = $request->get_param( 'team_availability' );
			$visibility          = $request->get_param( 'visibility' );
			$location            = $request->get_param( 'location' );
			$limits              = $request->get_param( 'limits' );
			$additional_settings = $request->get_param( 'additional_settings' );
			$group_settings      = $request->get_param( 'group_settings' );
			$event_range         = $request->get_param( 'event_range' );
			$advanced_settings   = $request->get_param( 'advanced_settings' );
			$email_notifications = $request->get_param( 'email_notifications' );
			$sms_notifications   = $request->get_param( 'sms_notifications' );
			$payments_settings   = $request->get_param( 'payments_settings' );
			$fields              = $request->get_param( 'fields' );
			$reserve_times       = $request->get_param( 'reserve_times' );
			$hosts               = $request->get_param( 'hosts' );
			$slug                = $request->get_param( 'slug' );

			$event = EventModel::with( 'calendar' )->find( $id );
			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Event not found for update with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			// Validate payment settings
			if ( $payments_settings ) {
				// Use Payment_Validator to validate payment settings
				$validation_result = PaymentValidator::validate_payment_gateways( $payments_settings );

				// If validation fails, block the update and return error
				if ( is_wp_error( $validation_result ) ) {
					$wpdb->query( 'ROLLBACK' );
					error_log( 'Booking Event Controller: Payment validation failed during update: ' . $validation_result->get_error_message() );
					return $validation_result;
				}
			}

			$updated = array(
				'name'                => $name,
				'description'         => $description,
				'status'              => $status,
				'type'                => $type,
				'duration'            => $duration,
				'color'               => $color,
				'visibility'          => $visibility,
				'location'            => $location,
				'limits'              => $limits,
				'additional_settings' => $additional_settings,
				'group_settings'      => $group_settings,
				'event_range'         => $event_range,
				'advanced_settings'   => $advanced_settings,
				'email_notifications' => $email_notifications,
				'sms_notifications'   => $sms_notifications,
				'payments_settings'   => $payments_settings,
				'dynamic_duration'    => $dynamic_duration,
				'availability_meta'   => maybe_serialize( $availability_meta ),
				'availability_type'   => $availability_type,
				'availability_id'     => is_array( $event_availability ) && isset( $event_availability['id'] )
					? $event_availability['id']
					: null,
			);

			$event->setReserveTimesAttribute( $reserve_times );

			$waiting_list = $request->get_param( 'waiting_list' );
			if ( isset( $waiting_list ) ) {
				$event->waiting_list_settings = $waiting_list;
			}

			if ( ! empty( $slug ) ) {
				$exists = EventModel::where( 'slug', $slug )->where( 'id', '!=', $id )->first();
				if ( $exists ) {
					$wpdb->query( 'ROLLBACK' );
					error_log( 'Booking Event Controller: Event slug already exists: ' . $slug );
					return new WP_Error( 'rest_event_error', __( 'Event slug already exists', 'doublescale' ), array( 'status' => 400 ) );
				}

				$updated['slug'] = $slug;
			}

			if ( ! empty( $hosts ) && $event->calendar->type === 'team' ) {
				// Normalize hosts to array of IDs if they're arrays with 'id' key
				if ( is_array( $hosts ) && ! empty( $hosts ) && is_array( $hosts[0] ) && isset( $hosts[0]['id'] ) ) {
					$hosts = array_column( $hosts, 'id' );
				}

				$event->setTeamMembersAttribute( $hosts );
			}
			if ( $user_id ) {
				$updated['user_id'] = $user_id;
			}
			$updated = array_filter( $updated );

			foreach ( $updated as $key => $value ) {
				$event->{$key} = $value;
			}

			if ( $fields ) {
				$event->updateFields( $fields );
			}

			// Handle availability updates based on calendar type and settings
			$result = $this->handle_availability_update( $event, $availability_type, $availability_meta, $event_availability, $team_availability );
			if ( is_wp_error( $result ) ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Availability update failed: ' . $result->get_error_message() );
				return $result;
			}

			$event->save();
			$event->updateSystemFields( $location );

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
			error_log( 'Booking Event Controller Error in update_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item availability
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item_availability( $request ) {
		try {
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$id           = $request->get_param( 'id' );
			$availability = $request->get_param( 'availability' );

			$event = EventModel::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Event not found for availability update with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			$result = $this->update_event_host_availability( $availability );
			if ( is_wp_error( $result ) ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Host availability update failed: ' . $result->get_error_message() );
				return $result;
			}

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $event->availability_value, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
			error_log( 'Booking Event Controller Error in update_item_availability: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update fields
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_fields( $request ) {
		try {
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$id     = $request->get_param( 'id' );
			$fields = $request->get_param( 'fields' );
			$event  = EventModel::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Event not found for fields update with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			$event->updateFields( $fields );

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $event->fields, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
			error_log( 'Booking Event Controller Error in update_fields: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function update_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_event( $id ) || current_user_can( 'doublescale_booking_manage_all_calendars' );
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		try {
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$id = $request->get_param( 'id' );

			$event = EventModel::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Event not found for deletion with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			$event->delete();

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response(
				array(
					'id' => $id,
				),
				200
			);
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
			error_log( 'Booking Event Controller Error in delete_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function delete_item_permissions_check( $request ) {
		$id = $request->get_param( 'id' );
		return Capabilities::can_manage_event( $id ) || current_user_can( 'doublescale_booking_manage_all_calendars' );
	}

	/**
	 * Duplicate item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function duplicate_item( $request ) {
		try {
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			$id = $request->get_param( 'id' );

			$event = EventModel::find( $id );

			if ( ! $event ) {
				$wpdb->query( 'ROLLBACK' );
				error_log( 'Booking Event Controller: Event not found for duplication with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			$new_event = $event->duplicate();

			$wpdb->query( 'COMMIT' );
			return new WP_REST_Response( $new_event, 200 );
		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
			error_log( 'Booking Event Controller Error in duplicate_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Duplicate item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return boolean
	 */
	public function duplicate_item_permissions_check( $request ) {
		return current_user_can( 'doublescale_booking_manage_all_calendars' );
	}

	/**
	 * Get meta
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_meta( $request ) {
		try {
			$id  = $request->get_param( 'id' );
			$key = $request->get_param( 'key' );

			$event = EventModel::find( $id );

			if ( ! $event ) {
				error_log( 'Booking Event Controller: Event not found for meta retrieval with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			$meta = $event->{$key};

			if ( ! isset( $event->{$key} ) ) {
				error_log( 'Booking Event Controller: Meta key not found: ' . $key . ' for event ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Meta not found', 'doublescale' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $meta, 200 );
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in get_meta: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}


	/**
	 * Disable item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function disable_item( $request ) {
		try {
			$id     = $request->get_param( 'id' );
			$status = $request->get_param( 'status' );
			$event  = EventModel::find( $id );
			if ( ! $event ) {
				error_log( 'Booking Event Controller: Event not found for disable status update with ID: ' . $id );
				return new WP_Error( 'rest_event_error', __( 'Event not found', 'doublescale' ), array( 'status' => 404 ) );
			}
			$event->is_disabled = $status;
			$event->save();
			return new WP_REST_Response( $event, 200 );
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in disable_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'rest_event_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	// Update event availability
	private function update_event_host_availability( $event_availability ) {
		try {
			// Check if event_availability is provided and not empty
			if ( empty( $event_availability ) ) {
				return true; // Nothing to update
			}
			// Find the availability record
			$availability = AvailabilityModel::where( 'id', $event_availability['id'] )->first();

			if ( ! $availability ) {
				error_log( 'Booking Event Controller: Availability record not found with ID: ' . $event_availability['id'] );
				return new WP_Error(
					'rest_event_error',
					__( 'Availability record not found', 'doublescale' ),
					array( 'status' => 404 )
				);
			}

			// Update the availability record using Eloquent
			try {
				// If event_availability contains the value data directly
				if ( isset( $event_availability['value'] ) ) {
					$availability->value = $event_availability['value'];
				}

				// Update other fields if provided
				if ( isset( $event_availability['name'] ) ) {
					$availability->name = $event_availability['name'];
				}

				if ( isset( $event_availability['timezone'] ) ) {
					$availability->timezone = $event_availability['timezone'];
				}

				// Save the changes
				$updated = $availability->save();

				if ( ! $updated ) {
					error_log( 'Booking Event Controller: Failed to update availability record with ID: ' . $event_availability['id'] );
					return new WP_Error(
						'rest_event_error',
						__( 'Failed to update availability', 'doublescale' ),
						array( 'status' => 500 )
					);
				}

				return $availability;
			} catch ( Exception $e ) {
				error_log( 'Booking Event Controller Error updating availability: ' . $e->getMessage() . ' | Availability ID: ' . $event_availability['id'] );
				return new WP_Error(
					'rest_event_error',
					$e->getMessage(),
					array( 'status' => 500 )
				);
			}
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in update_event_host_availability: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			throw $e;
		}
	}

	// Update event availability
	private function update_event_team_availability( $event, $team_availability ) {
		try {
			foreach ( $team_availability as $user_id => $availabilityData ) {
				$model = AvailabilityModel::find( $availabilityData['id'] );
				if ( ! $model ) {
					error_log( 'Booking Event Controller: Availability not found for team member with ID: ' . $availabilityData['id'] );
					return new WP_Error(
						'rest_event_error',
						__( 'Availability not found', 'doublescale' ),
						array( 'status' => 404 )
					);
				}
				$model->value = $availabilityData['value'];
				$model->save();
			}
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in update_event_team_availability: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			throw $e;
		}
	}

	// Handle availability updates based on calendar type and settings
	private function handle_availability_update( $event, $availability_type, $availability_meta, $event_availability, $team_availability ) {
		try {
			if ( $event->calendar->type === 'host' && $availability_type === 'existing' ) {
				return $this->update_event_host_availability( $event_availability );
			}

			if ( $event->calendar->type === 'team' && $availability_meta['is_common'] === true && $availability_type === 'existing' ) {
				return $this->update_event_host_availability( $event_availability );
			}

			if ( $event->calendar->type === 'team' && $availability_meta['is_common'] === false ) {
				return $this->update_event_team_availability( $event, $team_availability );
			}

			return true; // No specific availability update needed
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in handle_availability_update: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			throw $e;
		}
	}

	/**
	 * Get latest events
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_latest_events( $request ) {
		try {
			$limit   = $request->get_param( 'limit' ) ? absint( $request->get_param( 'limit' ) ) : 7;
			$user_id = $request->get_param( 'user_id' ) ? absint( $request->get_param( 'user_id' ) ) : null;
			$status  = $request->get_param( 'status' ) ? sanitize_text_field( $request->get_param( 'status' ) ) : null;

			$query = EventModel::with( array( 'calendar', 'meta' ) )->orderBy( 'created_at', 'desc' );

			// Apply filters if provided
			if ( $user_id ) {
				$query->where( 'user_id', $user_id );
			} elseif ( ! current_user_can( 'doublescale_booking_read_all_calendars' ) ) {
				$query->where( 'user_id', get_current_user_id() );
				$user_id = get_current_user_id(); // Set user_id for count query
			}

			if ( $status ) {
				$query->where( 'status', $status );
			}

			$events = $query->limit( $limit )->get();

			// Count enabled events based on user
			$enabled_events_count_query = EventModel::where( 'is_disabled', false );

			// If user_id is set, filter enabled events by user
			if ( $user_id ) {
				$enabled_events_count_query->where( 'user_id', $user_id );
			}

			$enabled_events_count = $enabled_events_count_query->count();

			// Prepare events for response
			$prepared_events = array();
			foreach ( $events as $event ) {
				$prepared_events[] = $this->prepare_event_for_response( $event );
			}

			return new WP_REST_Response(
				array(
					'events'               => $prepared_events,
					'enabled_events_count' => $enabled_events_count,
				),
				200
			);
		} catch ( Exception $e ) {
			error_log( 'Booking Event Controller Error in get_latest_events: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() );
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare event data for API response
	 *
	 * @since 1.0.0
	 *
	 * @param EventModel $event The event model.
	 * @return array Prepared event with only essential data.
	 */
	protected function prepare_event_for_response( $event ) {
		// Extract only the essential data needed for display
		$prepared_data = array(
			'id'            => $event->id,
			'name'          => $event->name,
			'duration'      => $event->duration,
			'type'          => $event->type,
			'booking_count' => $event->getBookingCountAttribute(),
			'location'      => $event->location,
			'calendar_id'   => $event->calendar_id,
			'slug'          => $event->slug,
			'calendar'      => $event->calendar,
		);

		return $prepared_data;
	}

	/**
	 * Resolve a human-readable label for a host user id, used in error messages
	 * when the user has no default availability. Falls back to the bare id when
	 * the user record can't be loaded so admins can still locate the row.
	 *
	 * @param int $user_id WP user id of the host.
	 * @return string Display name suffixed with the id, or "user #N" on miss.
	 */
	private function describe_host_for_error( $user_id ) {
		$user = $user_id > 0 ? get_userdata( $user_id ) : false;
		if ( $user && ! empty( $user->display_name ) ) {
			return sprintf( '%s (#%d)', $user->display_name, $user_id );
		}
		return sprintf( 'user #%d', $user_id );
	}
}
