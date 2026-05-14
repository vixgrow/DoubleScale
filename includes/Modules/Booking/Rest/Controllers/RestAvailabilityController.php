<?php

/**
 * Class REST_Availability_Controller
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Rest\Controllers;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Booking\Models\CalendarModel;
use WP_Error;
use Exception;
use Illuminate\Support\Arr;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Booking\Models\AvailabilityModel;
use DoubleScale\Modules\Booking\Models\EventModel;

/**
 * REST_Availability_Controller class
 */
class RestAvailabilityController extends RestController {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'booking/availabilities';

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
						'filter' => array(
							'description' => __( 'Filter availabilities.', 'doublescale' ),
							'type'        => 'object',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)',
			array(
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

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)/clone',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'clone_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9]+)/set-default',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'set_default' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
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
			 'title'      => 'availability',
			 'type'       => 'object',
			 'properties' => array(
				 'id'           => array(
					 'description' => __( 'Unique identifier for the object.', 'doublescale' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'readonly'    => true,
				 ),
				 'user_id'      => array(
					 'description' => __( 'User ID.', 'doublescale' ),
					 'type'        => 'integer',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
				 ),
				 'name'         => array(
					 'description' => __( 'Name.', 'doublescale' ),
					 'type'        => 'string',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
				 ),
				 'weekly_hours' => array(
					 'description' => __( 'Weekly hours.', 'doublescale' ),
					 'type'        => 'object',
					 'properties'  => array(
						 'monday'    => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'tuesday'   => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'wednesday' => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'thursday'  => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'friday'    => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'saturday'  => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
						 'sunday'    => array(
							 'type'       => 'object',
							 'properties' => array(
								 'start' => array(
									 'type' => 'string',
								 ),
								 'end'   => array(
									 'type' => 'string',
								 ),
								 'off'   => array(
									 'type' => 'boolean',
								 ),
							 ),
						 ),
					 ),
					 'context'     => array( 'view', 'edit' ),
					 'required'    => true,
				 ),
				 'override'     => array(
					 'description' => __( 'Override.', 'doublescale' ),
					 'type'        => 'object',
					 'properties'  => array(
						 'days'  => array(
							 'type'  => 'array',
							 'items' => array(
								 'type' => 'string',
							 ),
						 ),
						 'hours' => array(
							 'type'  => 'array',
							 'items' => array(
								 'type'       => 'object',
								 'properties' => array(
									 'start' => array(
										 'type' => 'string',
									 ),
									 'end'   => array(
										 'type' => 'string',
									 ),
								 ),
							 ),
						 ),
					 ),
					 'context'     => array( 'view', 'edit' ),
					 'required'    => false,
				 ),
				 'is_default'   => array(
					 'description' => __( 'Is default.', 'doublescale' ),
					 'type'        => 'boolean',
					 'context'     => array( 'view', 'edit' ),
					 'required'    => false,
					 'default'     => false,
				 ),
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
		$filter = $request->get_param( 'filter' ) ? $request->get_param( 'filter' ) : array();
		$user   = Arr::get( $filter, 'user' ) ? Arr::get( $filter, 'user' ) : 'own';

		if ( 'all' === $user && ! current_user_can( 'doublescale_booking_read_all_availability' ) ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to read all availabilities.', 'doublescale' ), array( 'status' => 403 ) );
		}

		$query = AvailabilityModel::query();

		if ( 'own' === $user ) {
			$query->where( 'user_id', get_current_user_id() );
		}

		$availabilities = $query->get();

		// Convert to array format and add events details
		$availabilities_array = array();
		foreach ( $availabilities as $availability ) {
			$availability_data      = $this->prepare_availability_for_response( $availability );
			$availability_data      = $this->events_details_for_availability( $availability_data );
			$availabilities_array[] = $availability_data;
		}

		return new WP_REST_Response( $availabilities_array, 200 );
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
		return current_user_can( 'doublescale_booking_read_all_availability' ) || current_user_can( 'doublescale_booking_read_own_availability' );
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		$id           = $request->get_param( 'id' );
		$availability = AvailabilityModel::find( $id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'doublescale' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'doublescale_booking_read_all_availability' ) && get_current_user_id() !== $availability->user_id ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to read this availability.', 'doublescale' ), array( 'status' => 403 ) );
		}

		$availability_data = $this->prepare_availability_for_response( $availability );
		$availability_data = $this->events_details_for_availability( $availability_data );

		return new WP_REST_Response( $availability_data, 200 );
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'doublescale_booking_read_all_availability' ) || current_user_can( 'doublescale_booking_read_own_availability' );
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function create_item( $request ) {
		$weekly_hours = $request->get_param( 'value' )['weekly_hours'] ?? array();
		$override     = $request->get_param( 'value' )['override'] ?? array();
		$user_id      = $request->get_param( 'user_id' ) ? $request->get_param( 'user_id' ) : get_current_user_id();
		$name         = $request->get_param( 'name' );
		$timezone     = $request->get_param( 'timezone' );
		$is_default   = (bool) $request->get_param( 'is_default' );

		// Delegate to AvailabilityService so the "force first availability to
		// be default" invariant lives in exactly one place. Previously this
		// rule was duplicated here and missing from the legacy
		// Availabilities::add_availability() path.
		$service = new \DoubleScale\Modules\Booking\Services\AvailabilityService();
		$result  = $service->create_availability( $user_id, $name, $weekly_hours, $override, $timezone, $is_default );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$availability  = AvailabilityModel::find( $result['id'] );
		$response_data = $this->prepare_availability_for_response( $availability );
		return new WP_REST_Response( $response_data, 201 );
	}

	/**
	 * Create item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'doublescale_booking_manage_all_availability' );
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {
		$id           = $request->get_param( 'id' );
		$weekly_hours = $request->get_param( 'value' )['weekly_hours'];
		$override     = $request->get_param( 'value' )['override'];
		$name         = $request->get_param( 'name' );
		$timezone     = $request->get_param( 'timezone' );
		$is_default   = $request->get_param( 'is_default' );

		$availability = AvailabilityModel::find( $id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'doublescale' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'doublescale_booking_manage_all_availability' ) && get_current_user_id() !== $availability->user_id ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to update this availability.', 'doublescale' ), array( 'status' => 403 ) );
		}

		try {
			// Handle is_default logic first (before other updates)
			if ( isset( $is_default ) ) {
				if ( $is_default ) {
					// If setting this as default, remove default from all other availabilities for this user
					AvailabilityModel::where( 'user_id', $availability->user_id )
						->where( 'id', '!=', $id )
						->update( array( 'is_default' => false ) );

					$availability->is_default = true;
				} else {
					// If trying to unset default, we need to ensure there's always one default
					$other_default_count = AvailabilityModel::where( 'user_id', $availability->user_id )
						->where( 'id', '!=', $id )
						->where( 'is_default', true )
						->count();

					if ( $other_default_count === 0 ) {
						// Cannot unset default if this is the only default availability
						return new WP_Error(
							'rest_availability_default_required',
							__( 'Cannot remove default status. There must be at least one default availability per user.', 'doublescale' ),
							array( 'status' => 400 )
						);
					}

					$availability->is_default = false;
				}
			}

			// Update simple fields directly
			if ( $name ) {
				$availability->name = $name;
			}

			if ( $timezone ) {
				$availability->timezone = $timezone;
			}

			// Handle value field updates (weekly_hours and override)
			if ( $weekly_hours || isset( $override ) ) {
				// Get current value data
				$current_value = $availability->value ?: array();
				$value_data    = $current_value;

				if ( $weekly_hours ) {
					$value_data['weekly_hours'] = $weekly_hours;
				}

				// Always include override even if empty
				if ( isset( $override ) ) {
					$value_data['override'] = $override;
				}

				$availability->value = $value_data;
			}

			// Save all changes
			$updated = $availability->save();

			if ( ! $updated ) {
				return new WP_Error(
					'rest_availability_update_failed',
					__( 'Failed to update availability', 'doublescale' ),
					array( 'status' => 500 )
				);
			}

			$response_data = $this->prepare_availability_for_response( $availability );
			return new WP_REST_Response( $response_data, 200 );

		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_update_failed', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'doublescale_booking_manage_all_availability' ) || current_user_can( 'doublescale_booking_manage_own_availability' );
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete_item( $request ) {
		$id = $request->get_param( 'id' );

		$availability = AvailabilityModel::find( $id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'doublescale' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'doublescale_booking_manage_all_availability' ) && get_current_user_id() !== $availability->user_id ) {
			return new WP_Error( 'rest_forbidden', __( 'You do not have permission to delete this availability.', 'doublescale' ), array( 'status' => 403 ) );
		}

		if ( $availability->is_default ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Sorry, you cannot delete the default availability.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$events_data = $this->get_availability_events_data( $availability->id );

		if ( $events_data['events_count'] > 0 ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Sorry, you cannot delete an availability with events.', 'doublescale' ), array( 'status' => 400 ) );
		}

		try {
			$this->replace_availability_references_before_delete( $availability );

			$availability->delete();
			return new WP_REST_Response( null, 204 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_delete_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'doublescale_booking_manage_all_availability' ) || current_user_can( 'doublescale_booking_manage_own_availability' );
	}

	/**
	 * Clone item
	 *
	 * @param WP_REST_Request
	 *
	 * @return WP_REST_Response
	 */
	public function clone_item( $request ) {
		$availability_id = $request->get_param( 'id' );

		if ( ! $availability_id ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$availability = AvailabilityModel::find( $availability_id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_not_found', __( 'Availability not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$clone_data = array(
			'user_id'    => $availability->user_id,
			'name'       => $availability->name . ' (clone)',
			'value'      => $availability->value,
			'timezone'   => $availability->timezone,
			'is_default' => false,
		);

		try {
			$cloned_availability = AvailabilityModel::create( $clone_data );
			$response_data       = $this->prepare_availability_for_response( $cloned_availability );
			return new WP_REST_Response( $response_data, 201 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_clone_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Set availability as default
	 *
	 * @param WP_REST_Request
	 */
	public function set_default( $request ) {
		$availability_id = $request->get_param( 'id' );

		if ( ! $availability_id ) {
			return new WP_Error( 'rest_availability_invalid_id', __( 'Invalid availability ID.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$availability = AvailabilityModel::find( $availability_id );

		if ( ! $availability ) {
			return new WP_Error( 'rest_availability_not_found', __( 'Availability not found.', 'doublescale' ), array( 'status' => 404 ) );
		}

		$user_id = $availability->user_id;

		try {
			global $wpdb;
			$table = $wpdb->prefix . 'doublescale_booking_availability';
			$wpdb->update( $table, array( 'is_default' => 0 ), array( 'user_id' => $user_id ) );
			$wpdb->update( $table, array( 'is_default' => 1 ), array( 'id' => $availability->id ) );
			$availability = AvailabilityModel::find( $availability->id );

			$response_data = $this->prepare_availability_for_response( $availability );
			return new WP_REST_Response( $response_data, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'rest_availability_set_default_failed', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Prepare availability for response
	 *
	 * @param AvailabilityModel $availability
	 *
	 * @return array
	 */
	private function prepare_availability_for_response( $availability ) {

		return array(
			'id'         => $availability->id,
			'user_id'    => $availability->user_id,
			'name'       => $availability->name,
			'value'      => $availability->value,
			'timezone'   => $availability->timezone,
			'is_default' => $availability->is_default,
			'created_at' => $availability->created_at,
			'updated_at' => $availability->updated_at,
		);
	}

	/**
	 * Get events data for availability
	 *
	 * @since 1.0.0
	 *
	 * @param string $availability_id Availability ID.
	 * @return array Array containing events_count and events
	 */
	private function get_availability_events_data( $availability_id ) {
		$availability_model = AvailabilityModel::find( $availability_id );
		$user_id            = $availability_model->user_id;

		// Get all calendars that the user is in
		$calendars = CalendarModel::where( 'user_id', $user_id )->get();

		if ( $calendars->isEmpty() ) {
			return array(
				'events_count' => 0,
				'events'       => array(),
			);
		}

		$total_events_count = 0;
		$all_events         = array();

		foreach ( $calendars as $calendar ) {
			// Check if the calendar is team or hosts
			if ( $calendar->type === 'host' ) {
				// For host calendars, get events directly from availability
				$events              = EventModel::where( 'availability_id', $availability_id )->where( 'calendar_id', $calendar->id )->where( 'availability_type', 'existing' )->get();
				$total_events_count += $events->count();
				$all_events          = array_merge( $all_events, $events->toArray() );
			} else {
				// For team calendars, check availability_meta
				$events_count = 0;
				$events       = array();

				// Get all events for this calendar
				$calendar_events = EventModel::where( 'calendar_id', $calendar->id )->where( 'availability_type', 'existing' )->get();

				foreach ( $calendar_events as $event ) {
					// Get availability meta from the event itself
					$availability_meta = maybe_unserialize( $event->availability_meta );
					if ( ! $availability_meta['is_common'] && $availability_meta['hosts_schedules'][ $user_id ] === $availability_id ) {
						$events_count++;
						$events[] = $event;
					}
				}

				$total_events_count += $events_count;
				$all_events          = array_merge( $all_events, $events );
			}
		}

		return array(
			'events_count' => $total_events_count,
			'events'       => $all_events,
		);
	}

	/**
	 * Get events details for availability
	 *
	 * @since 1.0.0
	 *
	 * @param array $availability Availability.
	 *
	 * @return array
	 */
	private function events_details_for_availability( $availability ) {
		$events_data = $this->get_availability_events_data( $availability['id'] );

		$availability['events_count'] = $events_data['events_count'];
		$availability['events']       = $events_data['events'];

		return $availability;
	}

	/**
	 * Replace availability references in events before deleting availability
	 *
	 * @since 1.0.0
	 *
	 * @param AvailabilityModel $availability The availability being deleted.
	 * @return void
	 */
	private function replace_availability_references_before_delete( $availability ) {
		// Get the user's default availability
		$default_availability = AvailabilityModel::getUserDefault( $availability->user_id );

		if ( ! $default_availability ) {
			doublescale_get_logger()->warning(
				'No default availability when handling deletion',
				array(
					'source'         => 'booking-availability-rest',
					'user_id'        => (int) $availability->user_id,
					'availability_id' => (int) $availability->id,
				)
			);
			return;
		}

		$user_id = $availability->user_id;

		// Get all calendars that the user is in
		$calendars = CalendarModel::where( 'user_id', $user_id )->get();

		foreach ( $calendars as $calendar ) {
			if ( $calendar->type === 'host' ) {
				$host_events = EventModel::where( 'availability_id', $availability->id )
					->where( 'calendar_id', $calendar->id )
					->where( 'availability_type', 'custom' )
					->get();

				foreach ( $host_events as $event ) {
					$event->availability_id = $default_availability->id;
					$event->save();
				}
			} else {
				$team_events = EventModel::where( 'calendar_id', $calendar->id )->where( 'availability_type', 'custom' )->get();

				foreach ( $team_events as $event ) {
					$availability_meta = $event->availability_meta;

					if ( $availability_meta['is_common'] ) {
						// Replace the availability_id with default
						if ( $event->availability_id === $availability->id ) {
							$event->availability_id = $default_availability->id;
							$event->save();
						}
					}

					// Also check hosts_schedules for this specific availability
					if ( isset( $availability_meta['hosts_schedules'][ $user_id ] ) &&
						 $availability_meta['hosts_schedules'][ $user_id ] === $availability->id ) {

						$availability_meta['hosts_schedules'][ $user_id ] = $default_availability->id;
						$event->availability_meta                         = $availability_meta;
						$event->save();
					}
				}
			}
		}

		doublescale_get_logger()->info(
			'Replaced availability references with default after deletion',
			array(
				'source'                 => 'booking-availability-rest',
				'user_id'                => (int) $availability->user_id,
				'deleted_availability_id' => (int) $availability->id,
				'replacement_id'         => (int) $default_availability->id,
			)
		);
	}
}
