<?php

/**
 * Class Calendar_Controller
 *
 * This class is responsible for handling the calendar controller
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Rest\Controllers;

use WP_Error;
use Exception;
use Illuminate\Support\Arr;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Booking\Models\CalendarModel;
use DoubleScale\Modules\Booking\Models\EventModel;
use DoubleScale\Modules\Booking\Capabilities;
use DoubleScale\Modules\Booking\Managers\IntegrationsManager;
use DoubleScale\Modules\Booking\Models\UserModel;
use DoubleScale\Modules\Booking\Helpers\IntegrationsHelper;

/**
 * Calendar Controller class
 */
class RestCalendarController extends RestController
{


	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'booking/calendars';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes()
	{
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array($this, 'get_items'),
					'permission_callback' => array($this, 'get_items_permissions_check'),
					'args'                => array(
						'keyword'  => array(
							'description' => __('Keyword to search.', 'doublescale'),
							'type'        => 'string',
						),
						'per_page' => array(
							'description' => __('Number of items to fetch.', 'doublescale'),
							'type'        => 'integer',
						),
						'page'     => array(
							'description' => __('Page number.', 'doublescale'),
							'type'        => 'integer',
						),
						'filter'   => array(
							'description' => __('Filter the results.', 'doublescale'),
							'type'        => 'object',
						),
						'ids'      => array(
							'description' => __('IDs of the calendars.', 'doublescale'),
							'type'        => 'array',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array($this, 'create_item'),
					'permission_callback' => array($this, 'create_item_permissions_check'),
					'args'                => $this->get_endpoint_args_for_item_schema(WP_REST_Server::CREATABLE),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array($this, 'delete_items'),
					'permission_callback' => array($this, 'delete_items_permissions_check'),
					'args'                => array(
						'ids' => array(
							'description' => __('Calendars IDs.', 'doublescale'),
							'type'        => 'array',
						),
					),
				),
			)
		);

		// Register route for single item
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __('Unique identifier for the resource.', 'doublescale'),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array($this, 'get_item'),
					'permission_callback' => array($this, 'get_item_permissions_check'),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array($this, 'update_item'),
					'permission_callback' => array($this, 'update_item_permissions_check'),
					'args'                => $this->get_endpoint_args_for_item_schema(WP_REST_Server::EDITABLE),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array($this, 'delete_item'),
					'permission_callback' => array($this, 'delete_item_permissions_check'),
				),
			)
		);

		// Register route for clone events from a calendar to another
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/clone',
			array(
				'args' => array(
					'id' => array(
						'description' => __('Unique identifier for the resource.', 'doublescale'),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array($this, 'clone_events'),
					'permission_callback' => array($this, 'clone_events_permissions_check'),
					'args'                => array(
						'event_id' => array(
							'description' => __('Events to clone.', 'doublescale'),
							'type'        => 'array',
							'required'    => true,
							'items'       => array(
								'type' => 'integer',
							),
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)' . '/team',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array($this, 'get_item_team'),
					'permission_callback' => array($this, 'get_item_permissions_check'),
					'args'                => array(
						'id' => array(
							'description' => __('Unique identifier for the resource.', 'doublescale'),
							'type'        => 'integer',
						),
					),
				),
			)
		);

		// Register route for getting calendar integrations
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)' . '/integrations',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array($this, 'get_item_integrations'),
					'permission_callback' => array($this, 'get_item_permissions_check'),
					'args'                => array(
						'id' => array(
							'description' => __('Unique identifier for the resource.', 'doublescale'),
							'type'        => 'integer',
						),
						'host_user_ids' => array(
							'description' => __('Comma-separated WordPress user IDs of team members to check (team calendars only). Defaults to all team members.', 'doublescale'),
							'type'        => 'string',
							'required'    => false,
						),
					),
				),
			)
		);
	}

	/**
	 * Schema for the calendar
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema()
	{
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'calendar',
			'type'       => 'object',
			'properties' => array(
				'id'             => array(
					'description' => __('Unique identifier for the resource.', 'doublescale'),
					'type'        => 'integer',
					'context'     => array('view'),
					'readonly'    => true,
				),
				'hash_id'        => array(
					'description' => __('Unique identifier for the resource.', 'doublescale'),
					'type'        => 'string',
					'context'     => array('view'),
					'readonly'    => true,
				),
				'user_id'        => array(
					'description'  => __('User ID.', 'doublescale'),
					'type'         => 'integer',
					'context'      => array('view', 'edit'),
					'args_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'name'           => array(
					'description'  => __('Name of the calendar.', 'doublescale'),
					'type'         => 'string',
					'context'      => array('view', 'edit'),
					'required'     => true,
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'description'    => array(
					'description'  => __('Description of the calendar.', 'doublescale'),
					'type'         => 'string',
					'context'      => array('view', 'edit'),
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'slug'           => array(
					'description'  => __('Slug of the calendar.', 'doublescale'),
					'type'         => 'string',
					'context'      => array('view', 'edit'),
					'args_options' => array(
						'sanitize_callback' => 'sanitize_title',
					),
				),
				'status'         => array(
					'description' => __('Status of the calendar.', 'doublescale'),
					'type'        => 'string',
					'context'     => array('view', 'edit'),
					'enum'        => array('active', 'inactive'),
				),
				'type'           => array(
					'description' => __('Type of the calendar.', 'doublescale'),
					'type'        => 'string',
					'context'     => array('view', 'edit'),
					'enum'        => array('host', 'team', 'one-off'),
					'required'    => true,
				),
				'members'        => array(
					'description' => __('Members.', 'doublescale'),
					'type'        => 'array',
					'context'     => array('view', 'edit'),
				),
				'avatar'         => array(
					'description' => __('Avatar.', 'doublescale'),
					'type'        => 'object',
					'context'     => array('view', 'edit'),
					'properties'  => array(
						'url' => array(
							'description' => __('Avatar URL.', 'doublescale'),
							'type'        => 'string',
						),
						'id'  => array(
							'description' => __('Avatar ID.', 'doublescale'),
							'type'        => 'integer',
						),
					),
				),
				'featured_image' => array(
					'description' => __('Featured.', 'doublescale'),
					'type'        => 'object',
					'context'     => array('view', 'edit'),
					'properties'  => array(
						'url' => array(
							'description' => __('Avatar URL.', 'doublescale'),
							'type'        => 'string',
						),
						'id'  => array(
							'description' => __('Avatar ID.', 'doublescale'),
							'type'        => 'integer',
						),
					),
				),
				'created_at'     => array(
					'description' => __('Date and time when the calendar was created.', 'doublescale'),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array('view'),
					'readonly'    => true,
				),
				'updated_at'     => array(
					'description' => __('Date and time when the calendar was last updated.', 'doublescale'),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array('view'),
					'readonly'    => true,
				),
			),
		);
	}

	/**
	 * Get all calendars
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_items($request)
	{
		try {
			$page     = $request->get_param('page') ? $request->get_param('page') : 1;
			$per_page = $request->get_param('per_page') ? $request->get_param('per_page') : 10;
			$keyword  = $request->get_param('keyword') ? $request->get_param('keyword') : '';
			$filter   = $request->get_param('filters') ? $request->get_param('filters') : array();
			$type     = Arr::get($filter, 'type', 'all');
			$user     = $request->get_param('user') ?? (current_user_can('doublescale_booking_read_all_calendars') ? 'all' : 'own');
			$ids      = $request->get_param('ids') ? $request->get_param('ids') : array();

			if ('own' === $user) {
				$user = get_current_user_id();
			}

			if (('all' === $user || get_current_user_id() !== $user) && ! current_user_can('doublescale_booking_read_all_calendars')) {
				error_log('Booking Calendar Controller: Permission denied for user ' . get_current_user_id() . ' to access calendars');
				return new WP_Error('rest_calendar_error', __('You do not have permission', 'doublescale'), array('status' => 403));
			}

			$query = CalendarModel::query()->with('user');

			if (! empty($keyword)) {
				$query->whereHas(
					'events',
					function ($query) use ($keyword) {
						$query->where('name', 'like', '%' . $keyword . '%')
							->orWhere('description', 'like', '%' . $keyword . '%');
					}
				);
			}

			if ('all' !== $user) {
				$query->where('user_id', $user);
			}

			if ('all' !== $type) {
				$query->where('type', $type);
			}

			if (! empty($ids)) {
				$query->whereIn('id', $ids);
			}

			$calendars = $query->with(
				array(
					'events' => function ($query) use ($keyword) {
						$query->select('id', 'calendar_id', 'name', 'duration', 'type', 'slug', 'is_disabled');
						if ($keyword) {
							$query->where('name', 'like', '%' . $keyword . '%');
						}
					},
				)
			)->paginate($per_page, array('*'), 'page', $page);

			return new WP_REST_Response($calendars, 200);
		} catch (Exception $e) {
			error_log('Booking Calendar Controller Error in get_items: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			return new WP_Error('rest_calendar_error', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Check if a given request has access to get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function get_items_permissions_check($request)
	{
		return current_user_can('doublescale_booking_manage_own_calendars') || current_user_can('doublescale_booking_read_all_calendars');
	}

	/**
	 * Create a calendar.
	 *
	 * Only team calendars are creatable through this endpoint. Host calendars are
	 * provisioned exclusively by {@see \DoubleScale\Modules\Booking\Services\BookingProvisioner}
	 * when a user is granted a CRM role through Settings → Team (or is added as an
	 * administrator). This guarantees there is exactly one host calendar per CRM team
	 * member and no orphan host calendars for arbitrary WP users.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item($request)
	{
		global $wpdb;
		$wpdb->query('START TRANSACTION');
		try {
			$name        = $request->get_param('name');
			$description = $request->get_param('description');
			$type        = $request->get_param('type');
			$members     = $request->get_param('members');
			$timezone    = $request->get_param('timezone');
			if (empty($timezone)) {
				$timezone = wp_timezone_string();
			}

			if ('team' !== $type) {
				error_log('Booking Calendar Controller: Only team calendars are creatable via REST. Got: ' . $type);
				throw new Exception(__('Only team calendars can be created. Host calendars are auto-provisioned for CRM team members.', 'doublescale'), 400);
			}

			$this->validate_team_calendar($members);

			$calendar = CalendarModel::create(
				array(
					'user_id'     => get_current_user_id(),
					'name'        => $name,
					'description' => $description,
					'type'        => 'team',
				)
			);

			$calendar->timezone = $timezone;
			$calendar->syncTeamMembers($members);

			$wpdb->query('COMMIT');

			return new WP_REST_Response($calendar, 200);
		} catch (Exception $e) {
			$wpdb->query('ROLLBACK');
			error_log('Booking Calendar Controller Error in create_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			// Honor explicit HTTP status codes set on the exception (e.g. 400
			// for client validation failures); fall back to 500 for unhandled
			// server errors.
			$code   = (int) $e->getCode();
			$status = ($code >= 400 && $code < 600) ? $code : 500;
			return new WP_Error('rest_calendar_error', $e->getMessage(), array('status' => $status));
		}
	}

	/**
	 * Check if a given request has access to create items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function create_item_permissions_check($request)
	{
		return current_user_can('doublescale_booking_manage_all_calendars');
	}

	/**
	 * Delete calendars
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_items($request)
	{
		try {
			$ids = $request->get_param('ids');
			if (empty($ids)) {
				error_log('Booking Calendar Controller: No calendar IDs provided for deletion');
				return new WP_Error('rest_calendar_error', __('IDs are required', 'doublescale'), array('status' => 400));
			}

			CalendarModel::destroy($ids);

			return new WP_REST_Response(array('message' => __('Calendars deleted successfully', 'doublescale')), 200);
		} catch (Exception $e) {
			error_log('Booking Calendar Controller Error in delete_items: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			return new WP_Error('rest_calendar_error', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Check if a given request has access to delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function delete_items_permissions_check($request)
	{
		return current_user_can('doublescale_booking_manage_all_calendars');
	}

	/**
	 * Get a single calendar
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item($request)
	{
		try {
			$id       = $request->get_param('id');
			$calendar = CalendarModel::find($id);

			if (! $calendar) {
				error_log('Booking Calendar Controller: Calendar not found with ID: ' . $id);
				return new WP_Error('rest_calendar_error', __('Calendar not found', 'doublescale'), array('status' => 404));
			}

			return new WP_REST_Response($calendar, 200);
		} catch (Exception $e) {
			error_log('Booking Calendar Controller Error in get_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			return new WP_Error('rest_calendar_error', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Check if a given request has access to get a single item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function get_item_permissions_check($request)
	{
		$id = $request->get_param('id');
		return Capabilities::can_read_calendar($id);
	}

	/**
	 * Get item team
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item_team($request)
	{
		try {
			$id       = $request->get_param('id');
			$calendar = CalendarModel::select('id')->find($id);

			if (! $calendar) {
				error_log('Booking Calendar Controller: Calendar not found for team retrieval with ID: ' . $id);
				return new WP_Error('rest_calendar_error', __('Calendar not found', 'doublescale'), array('status' => 404));
			}

			$calendar_team = $calendar->getTeamMembers();

			$users = array();
			foreach ($calendar_team as $teamId) {
				$user = UserModel::where('ID', $teamId)->first();
				if ($user) {
					$user_avatar_url = get_avatar_url($user->ID);
					$users[]         = array(
						'ID'           => $user->ID,
						'display_name' => $user->display_name,
						'user_email'   => $user->user_email,
						'user_login'   => $user->user_login,
						'image'        => $user_avatar_url,
					);
				}
			}

			return new WP_REST_Response($users, 200);
		} catch (Exception $e) {
			error_log('Booking Calendar Controller Error in get_item_team: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			return new WP_Error('rest_team_error', $e->getMessage(), array('status' => 500));
		}
	}


	/**
	 * Update a calendar
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item($request)
	{
		try {
			$id             = $request->get_param('id');
			$name           = $request->get_param('name');
			$description    = $request->get_param('description');
			$members        = $request->get_param('members');
			$timezone       = $request->get_param('timezone');
			$integrations   = $request->get_param('integrations');
			$avatar         = $request->get_param('avatar');
			$featured_image = $request->get_param('featured_image');
			$slug           = $request->get_param('slug');

			$calendar = CalendarModel::find($id);
			if (isset($calendar->team_members)) {
				unset($calendar->team_members);
			}

			if (! $calendar) {
				error_log('Booking Calendar Controller: Calendar not found for update with ID: ' . $id);
				return new WP_Error('rest_calendar_error', __('Calendar not found', 'doublescale'), array('status' => 404));
			}

			if ($members && 'team' === $calendar->type) {
				if (empty($members)) {
					error_log('Booking Calendar Controller: Team members cannot be empty for calendar ID: ' . $id);
					return new WP_Error('rest_calendar_error', __("Team members can't be empty", 'doublescale'), array('status' => 400));
				}

				$calendars = CalendarModel::whereIn('user_id', $members)
					->where('type', 'host')
					->get();

				if ($calendars->count() !== count($members)) {
					error_log('Booking Calendar Controller: Invalid host selection for team calendar ID: ' . $id);
					return new WP_Error('rest_calendar_error', __('Please make sure that you selected the right hosts', 'doublescale'), array('status' => 400));
				}
			}

			$updated = array(
				'name'        => $name,
				'description' => $description,
			);

			if (! empty($slug)) {
				$exists = CalendarModel::where('slug', $slug)->where('id', '!=', $id)->first();
				if ($exists) {
					error_log('Booking Calendar Controller: Calendar slug already exists: ' . $slug);
					return new WP_Error('rest_calendar_error', __('Calendar slug already exists', 'doublescale'), array('status' => 400));
				}

				$updated['slug'] = $slug;
			}

			$updated = array_filter($updated);

			$calendar->update($updated);

			if (! empty($timezone)) {
				$calendar->timezone = $timezone;
			}

			if (! empty($integrations)) {
				$calendar->integrations = $integrations;
			}

			if ($members && 'team' === $calendar->type) {
				$calendar->syncTeamMembers($members);
			}

			if (! empty($avatar)) {
				$calendar->avatar = $avatar;
			}

			if (! empty($featured_image)) {
				$calendar->featured_image = $featured_image;
			}

			$calendar->save();

			return new WP_REST_Response($calendar, 200);
		} catch (Exception $e) {
			error_log('Booking Calendar Controller Error in update_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			return new WP_Error('rest_calendar_error', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Check if a given request has access to update a single item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function update_item_permissions_check($request)
	{
		$id = $request->get_param('id');
		return Capabilities::can_manage_calendar($id);
	}

	/**
	 * Delete a calendar
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item($request)
	{
		try {
			$id       = $request->get_param('id');
			$calendar = CalendarModel::find($id);

			if (! $calendar) {
				error_log('Booking Calendar Controller: Calendar not found for deletion with ID: ' . $id);
				return new WP_Error('rest_calendar_error', __('Calendar not found', 'doublescale'), array('status' => 404));
			}

			$calendar->delete();

			return new WP_REST_Response(array('message' => __('Calendar deleted successfully', 'doublescale')), 200);
		} catch (Exception $e) {
			error_log('Booking Calendar Controller Error in delete_item: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			return new WP_Error('rest_calendar_error', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Check if a given request has access to delete a single item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function delete_item_permissions_check($request)
	{
		$id = $request->get_param('id');
		return Capabilities::can_manage_calendar($id);
	}

	/**
	 * Clone events from a calendar to another
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function clone_events($request)
	{
		try {
			$id       = $request->get_param('id');
			$event_id = $request->get_param('event_id');

			$calendar = CalendarModel::find($id);
			if (! $calendar) {
				error_log('Booking Calendar Controller: Calendar not found for event cloning with ID: ' . $id);
				return new WP_Error('rest_calendar_error', __('Calendar not found', 'doublescale'), array('status' => 404));
			}

			if (! $event_id) {
				error_log('Booking Calendar Controller: No event IDs provided for cloning');
				return new WP_Error('rest_calendar_error', __('Event are required', 'doublescale'), array('status' => 400));
			}

			$event = EventModel::find($event_id)->first();
			if (! $event) {
				error_log('Booking Calendar Controller: Event not found for cloning with ID: ' . $event_id);
				return new WP_Error('rest_calendar_error', __('Event not found', 'doublescale'), array('status' => 404));
			}

			$columns = array(
				'name',
				'description',
				'type',
				'duration',
				'color',
			);

			$meta = array(
				'availability',
				'location',
				'limits',
				'email_notifications',
				'sms_notifications',
				'additional_settings',
				'group_settings',
				'event_range',
				'advanced_settings',
				'payments_settings',
			);

			$eventData                = Arr::only($event->toArray(), $columns);
			$eventData['calendar_id'] = $calendar->id;
			$eventData['user_id']     = $calendar->user_id;

			$cloned_event = EventModel::create($eventData);
			if ($cloned_event->id) {
				foreach ($meta as $key) {
					$cloned_event->{$key} = $event->get_meta($key, null);
				}
				$cloned_event->save();
			}

			return new WP_REST_Response(array('message' => __('Events cloned successfully', 'doublescale')), 200);
		} catch (Exception $e) {
			error_log('Booking Calendar Controller Error in clone_events: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			return new WP_Error('rest_calendar_error', $e->getMessage(), array('status' => 500));
		}
	}

	/**
	 * Check if a given request has access to clone events
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function clone_events_permissions_check($request)
	{
		$id = $request->get_param('id');
		return Capabilities::can_manage_calendar($id);
	}



	/**
	 * Validate team calendar requirements.
	 *
	 * Members must each correspond to an existing host calendar — i.e. they must already
	 * be CRM team members (auto-provisioned via {@see BookingProvisioner}).
	 */
	private function validate_team_calendar($members)
	{
		if (empty($members)) {
			error_log('Booking Calendar Controller: Team members are required for team calendar');
			throw new Exception(__('Team members are required', 'doublescale'), 400);
		}

		$valid_members = CalendarModel::whereIn('user_id', $members)
			->where('type', 'host')
			->pluck('ID');

		if (count($valid_members) !== count($members)) {
			error_log('Booking Calendar Controller: Invalid team member selection. Expected: ' . count($members) . ', Found: ' . count($valid_members));
			throw new Exception(__('Invalid team member selection', 'doublescale'), 400);
		}
	}

	/**
	 * Get calendar integrations
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item_integrations($request)
	{
		try {
			$calendar_id = $request->get_param('id');
			$calendar    = CalendarModel::find($calendar_id);

			if (! $calendar) {
				error_log('Booking Calendar Controller: Calendar not found for integrations with ID: ' . $calendar_id);
				return new WP_Error('rest_calendar_error', __('Calendar not found', 'doublescale'), array('status' => 404));
			}

			$connected_integrations = array();

			// Check if integrations are available
			if (! IntegrationsHelper::has_integrations()) {
				return rest_ensure_response(IntegrationsHelper::get_default_integrations());
			}

			$integrations = IntegrationsManager::instance()->get_integrations();

			// IntegrationsManager is empty until the legacy namespace refactor in
			// Booking/Integrations/* lands (see Module::register_integrations()).
			// Fall back to the helper defaults so the conferencing UI doesn't
			// render every provider as "Upgrade to Pro" — this IS the consolidated
			// pro plugin, so pro availability is implied. Mark each provider as
			// pro-available; everything else stays "not connected" (defaults).
			if (empty($integrations)) {
				$defaults = IntegrationsHelper::get_default_integrations('event');
				foreach ($defaults as $slug => $integration_data) {
					$defaults[$slug]['has_pro_version'] = true;
				}
				return rest_ensure_response($defaults);
			}

			$calendar_ids = array($calendar_id);
			if (in_array($calendar->type, array('team'), true)) {
				$team_user_ids = array_map(
					'intval',
					array_filter((array) $calendar->getTeamMembers())
				);
				$calendar_ids = $team_user_ids;

				$host_filter = $request->get_param('host_user_ids');
				if ($host_filter !== null && $host_filter !== '') {
					$requested = array_filter(
						array_map(
							'intval',
							is_array($host_filter)
								? $host_filter
								: explode(',', (string) $host_filter)
						)
					);
					$team_set = array_fill_keys($team_user_ids, true);
					$subset   = array_values(
						array_filter(
							$requested,
							static function ($uid) use ($team_set) {
								return isset($team_set[$uid]);
							}
						)
					);
					if (! empty($subset)) {
						$calendar_ids = $subset;
					}
				}
			}

			foreach ($integrations as $integration_class) {
				$integration         = new $integration_class();
				$all_connected       = true;
				$has_accounts        = false;
				$global_settings     = $integration->get_settings();
				$set_global_settings = false;
				$teams_enabled       = false;
				$has_get_started     = false;
				$has_pro_version     = true;
				$team_members_setup  = true;
				$slug                = $integration->slug;

				if ($slug == 'zoom') {
					$app_credentials = Arr::get($global_settings, 'app_credentials', null);
					if ($app_credentials && is_array($app_credentials) && ! empty($app_credentials['client_id']) && ! empty($app_credentials['client_secret'])) {
						$set_global_settings = true;
					} else {
						$set_global_settings = false;
					}
				} else {
					$app = Arr::get($global_settings, 'app', null);
					if ($app && is_array($app) && ! empty($app['cache_time'])) {
						$set_global_settings = true;
					} else {
						$set_global_settings = false;
					}
				}

				foreach ($calendar_ids as $member_or_calendar_id) {
					if ($calendar->type === 'team') {
						$host_calendar = CalendarModel::where('user_id', $member_or_calendar_id)->where('type', 'host')->first();
						if (! $host_calendar) {
							$all_connected = false;
							$team_members_setup = false;
							continue;
						}
					} else {
						$host_calendar = CalendarModel::find($member_or_calendar_id);
					}

					if (! $host_calendar) {
						$all_connected = false;
						continue;
					}

					$integration->set_host($host_calendar);
					$accounts            = $integration->accounts->get_accounts();
					$has_stored_accounts = IntegrationsHelper::calendar_meta_has_integration_accounts($accounts);

					if (! $has_stored_accounts) {
						$all_connected = false;
						if (in_array($calendar->type, array('team'), true) && $slug !== 'zoom') {
							$team_members_setup = false;
						}
					} else {
						$has_accounts = true;
						if ($slug === 'outlook' && ! in_array($calendar->type, array('team'), true)) {
							foreach ($accounts as $account) {
								if (isset($account['config']['default_calendar'])) {
									$teams_enabled = isset($account['config']['settings']['enable_teams']) &&
										$account['config']['settings']['enable_teams'] === true;
									break;
								}
							}
						}

						if (in_array($calendar->type, array('team'), true) && $slug !== 'zoom') {
							$has_default_calendar = false;
							foreach ($accounts as $account) {
								if (
									isset($account['config']['default_calendar']) &&
									! empty($account['config']['default_calendar']['calendar_id'])
								) {
									$has_default_calendar = true;
									break;
								}
							}
							if (! $has_default_calendar) {
								$team_members_setup = false;
							}
							if ($slug === 'outlook') {
								$member_teams_enabled = false;
								foreach ($accounts as $account) {
									if (
										isset($account['config']['settings']['enable_teams']) &&
										$account['config']['settings']['enable_teams'] === true
									) {
										$member_teams_enabled = true;
										break;
									}
								}
								if (! $member_teams_enabled) {
									$team_members_setup = false;
								}
							}
						}
					}

					if (in_array($calendar->type, array('team'), true) && $slug === 'zoom') {
						$has_zoom_ready = false;
						foreach ($accounts as $account) {
							if (IntegrationsHelper::zoom_account_ready_for_conferencing($account)) {
								$has_zoom_ready = true;
								break;
							}
						}
						if (! $has_zoom_ready) {
							$team_members_setup = false;
						}
					}
				}

				if ($calendar->type === 'team') {
					$teams_enabled = true;
				}

				$connected_integrations[$slug] = array(
					'name'               => $integration->name,
					'connected'          => $all_connected,
					'has_accounts'       => $has_accounts,
					'has_settings'       => $set_global_settings,
					'teams_enabled'      => $teams_enabled,
					'has_get_started'    => $has_get_started,
					'has_pro_version'    => $has_pro_version,
					'team_members_setup' => $team_members_setup,
				);
			}

			return rest_ensure_response($connected_integrations);
		} catch (Exception $e) {
			error_log('Booking Calendar Controller Error in get_item_integrations: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine());
			return new WP_Error('rest_calendar_error', $e->getMessage(), array('status' => 500));
		}
	}
};
