<?php
/**
 * REST Api: User Management Controller
 *
 * @since 1.0.0
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core\UserRoles\Rest;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\UserRoles\Permissions;
use DoubleScale\Core\UserRoles\UserRoles;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * User Management REST Controller
 */
class RestUserManagementController extends RestController {

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'user-management';

	/**
	 * Register the routes for user management
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		// Get CRM users
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/users',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_crm_users' ),
					'permission_callback' => array( $this, 'check_admin_permissions' ),
				),
			)
		);

		// Get CRM users for frontend (with search and pagination)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/users/frontend',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_crm_users_frontend' ),
					'permission_callback' => array( $this, 'check_sales_rep_permissions' ),
					'args'                => array(
						'search'   => array(
							'description'       => 'Search term for user name or email',
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'per_page' => array(
							'description' => 'Number of users per page',
							'type'        => 'integer',
							'default'     => 50,
							'minimum'     => 1,
							'maximum'     => 100,
						),
						'page'     => array(
							'description' => 'Page number',
							'type'        => 'integer',
							'default'     => 1,
							'minimum'     => 1,
						),
						'orderby'  => array(
							'description' => 'Order by field',
							'type'        => 'string',
							'default'     => 'display_name',
							'enum'        => array( 'display_name', 'user_email', 'ID' ),
						),
						'order'    => array(
							'description' => 'Order direction',
							'type'        => 'string',
							'default'     => 'asc',
							'enum'        => array( 'asc', 'desc' ),
						),
					),
				),
			)
		);

		// Assign CRM role to user
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/users/(?P<id>[\d]+)/role',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'assign_crm_role' ),
					'permission_callback' => array( $this, 'check_admin_permissions' ),
					'args'                => array(
						'id'    => array(
							'required' => true,
							'type'     => 'integer',
						),
						// Accepts an array of roles (checkbox UI — a user can hold
						// several CRM roles). The legacy single `role` string is
						// still accepted for back-compat; see assign_crm_role().
						'roles' => array(
							'required' => false,
							'type'     => 'array',
							'items'    => array(
								'type' => 'string',
								'enum' => UserRoles::get_assignable_role_slugs(),
							),
						),
						'role'  => array(
							'required' => false,
							'type'     => 'string',
							'enum'     => array_merge( UserRoles::get_assignable_role_slugs(), array( UserRoles::NONE ) ),
						),
					),
				),
			)
		);

		// Add user by email and assign role
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/users',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'add_user_by_email' ),
					'permission_callback' => array( $this, 'check_admin_permissions' ),
					'args'                => array(
						'email' => array(
							'required' => true,
							'type'     => 'string',
							'format'   => 'email',
						),
						'roles' => array(
							'required' => true,
							'type'     => 'array',
							'items'    => array(
								'type' => 'string',
								'enum' => UserRoles::get_assignable_role_slugs(),
							),
						),
					),
				),
			)
		);

		// Delete user CRM role
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/users/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'remove_user_crm_role' ),
					'permission_callback' => array( $this, 'check_admin_permissions' ),
					'args'                => array(
						'id' => array(
							'required' => true,
							'type'     => 'integer',
						),
					),
				),
			)
		);
	}

	/**
	 * Get CRM users
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_crm_users( $request ) {
		$crm_roles = UserRoles::get_assignable_role_slugs();

		$users = get_users(
			array(
				'role__in' => $crm_roles,
			)
		);

		$formatted_users = array();

		foreach ( $users as $user ) {
			$user_crm_roles = array_values( array_intersect( $user->roles, $crm_roles ) );

			$formatted_users[] = array(
				'id'         => $user->ID,
				'name'       => $user->display_name,
				'email'      => $user->user_email,
				'user_login' => $user->user_login,
				'role'       => '',
				// Effective role = the highest-priority one the user holds, so a
				// user with CRM Manager + Sales Rep reports as CRM Manager.
				'crm_role'   => UserRoles::get_highest_role( $user_crm_roles ),
				'roles'      => $user_crm_roles,
			);
		}

		return new WP_REST_Response( $formatted_users, 200 );
	}

	/**
	 * Get CRM users for frontend with search and pagination
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_crm_users_frontend( $request ) {
		$search           = $request->get_param( 'search' );
		$per_page         = $request->get_param( 'per_page' ) ?: 50;
		$page             = $request->get_param( 'page' ) ?: 1;
		$orderby          = $request->get_param( 'orderby' ) ?: 'display_name';
		$order            = $request->get_param( 'order' ) ?: 'asc';
		$filter_crm_users = $request->get_param( 'filter_crm_users' ) ?: false;

		$user_args = array(
			'number'  => $per_page,
			'offset'  => ( $page - 1 ) * $per_page,
			'orderby' => $orderby,
			'order'   => strtoupper( $order ),
			'fields'  => 'all',
		);

		if ( ! empty( $search ) && strlen( $search ) >= 2 ) {
			$user_args['search']         = '*' . esc_attr( $search ) . '*';
			$user_args['search_columns'] = array( 'user_login', 'user_email', 'display_name' );
		}

		if ( $filter_crm_users ) {
			$user_args['role__in'] = array_merge( UserRoles::get_assignable_role_slugs(), array( UserRoles::ADMINISTRATOR ) );
		}

		$users = get_users( $user_args );

		$count_args = $user_args;
		unset( $count_args['number'] );
		unset( $count_args['offset'] );
		$count_args['fields'] = 'ID';
		$total_users          = count( get_users( $count_args ) );

		$formatted_users = array();
		foreach ( $users as $user ) {
			$formatted_users[] = array(
				'id'           => (int) $user->ID,
				'name'         => $user->display_name,
				'display_name' => $user->display_name,
				'email'        => $user->user_email,
				'username'     => $user->user_login,
				'roles'        => $user->roles,
				'avatar_urls'  => get_avatar_url( $user->ID ),
			);
		}

		$total_pages = ceil( $total_users / $per_page );

		return new WP_REST_Response(
			array(
				'users'      => $formatted_users,
				'pagination' => array(
					'total'        => $total_users,
					'per_page'     => $per_page,
					'current_page' => $page,
					'total_pages'  => $total_pages,
					'has_next'     => $page < $total_pages,
					'has_prev'     => $page > 1,
				),
			),
			200
		);
	}

	/**
	 * Add user by email and assign CRM role
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function add_user_by_email( $request ) {
		$email = sanitize_email( $request->get_param( 'email' ) );
		$roles = $request->get_param( 'roles' );

		if ( empty( $email ) || ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', 'Invalid email address.', array( 'status' => 400 ) );
		}

		if ( empty( $roles ) || ! is_array( $roles ) ) {
			return new WP_Error( 'invalid_roles', 'Invalid roles provided.', array( 'status' => 400 ) );
		}

		$user = get_user_by( 'email', $email );
		if ( ! $user ) {
			return new WP_Error( 'user_not_found', 'User not found.', array( 'status' => 404 ) );
		}

		$check_crm_role = Permissions::check_user_has_role( $user->ID );
		if ( $check_crm_role ) {
			return new WP_Error( 'user_already_has_crm_role', 'User already has a CRM role.', array( 'status' => 400 ) );
		}

		$crm_roles = UserRoles::get_assignable_role_slugs();

		// Add new CRM roles FIRST so listeners on doublescale_user_role_revoked
		// don't observe a transient zero-roles state if any of the existing roles
		// need to be removed afterward. (Same race as assign_crm_role.)
		foreach ( $roles as $role ) {
			if ( in_array( $role, $crm_roles, true ) && ! in_array( $role, (array) $user->roles, true ) ) {
				$user->add_role( $role );
				do_action( 'doublescale_user_role_assigned', $user->ID, $role );
			}
		}

		// Remove any CRM roles the user had that aren't in the new $roles set.
		foreach ( $crm_roles as $crm_role ) {
			if ( in_array( $crm_role, (array) $roles, true ) ) {
				continue;
			}
			if ( in_array( $crm_role, (array) $user->roles, true ) ) {
				$user->remove_role( $crm_role );
				do_action( 'doublescale_user_role_revoked', $user->ID, $crm_role );
			}
		}

		$assigned_crm_roles = array_values( array_intersect( $user->roles, $crm_roles ) );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'User roles assigned successfully.',
				'user'    => array(
					'id'       => $user->ID,
					'name'     => $user->display_name,
					'email'    => $user->user_email,
					'role'     => '',
					// Effective role = highest-priority of the assigned set.
					'crm_role' => UserRoles::get_highest_role( $assigned_crm_roles ),
					'roles'    => $assigned_crm_roles,
				),
			),
			201
		);
	}

	/**
	 * Assign CRM role to user
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function assign_crm_role( $request ) {
		$user_id = $request->get_param( 'id' );
		$roles   = $request->get_param( 'roles' );

		// Back-compat: accept a single `role` string when `roles[]` is absent.
		if ( ! is_array( $roles ) ) {
			$single = $request->get_param( 'role' );
			$roles  = ( $single && UserRoles::NONE !== $single ) ? array( $single ) : array();
		}

		$user = get_user_by( 'ID', $user_id );
		if ( ! $user ) {
			return new WP_Error( 'user_not_found', 'User not found.', array( 'status' => 404 ) );
		}

		$crm_roles = UserRoles::get_assignable_role_slugs();

		// Keep only valid assignable roles from the request.
		$target_roles = array_values( array_intersect( (array) $roles, $crm_roles ) );

		if ( empty( $target_roles ) ) {
			return new WP_Error( 'invalid_roles', 'Invalid roles provided.', array( 'status' => 400 ) );
		}

		// Add the new CRM roles FIRST so listeners on `doublescale_user_role_revoked`
		// observing "user still has a booking-eligible role" don't see a transient
		// zero-roles state during the revoke loop. Otherwise the booking module's
		// purge_host_data() listener triggers mid-swap and deletes the host's
		// calendar+availability before the new role is added.
		foreach ( $target_roles as $role ) {
			if ( ! in_array( $role, (array) $user->roles, true ) ) {
				$user->add_role( $role );
				do_action( 'doublescale_user_role_assigned', $user->ID, $role );
			}
		}

		// Remove any CRM roles the user had that aren't in the new target set.
		foreach ( $crm_roles as $crm_role ) {
			if ( in_array( $crm_role, $target_roles, true ) ) {
				continue;
			}
			if ( in_array( $crm_role, (array) $user->roles, true ) ) {
				$user->remove_role( $crm_role );
				do_action( 'doublescale_user_role_revoked', $user->ID, $crm_role );
			}
		}

		$assigned_crm_roles = array_values( array_intersect( $user->roles, $crm_roles ) );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'User role updated successfully.',
				'user'    => array(
					'id'       => $user->ID,
					// Effective role = highest-priority of the assigned set.
					'crm_role' => UserRoles::get_highest_role( $assigned_crm_roles ),
					'roles'    => $assigned_crm_roles,
				),
			),
			200
		);
	}

	/**
	 * Remove user CRM role
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function remove_user_crm_role( $request ) {
		$user_id = $request->get_param( 'id' );

		$user = get_user_by( 'ID', $user_id );
		if ( ! $user ) {
			return new WP_Error( 'user_not_found', 'User not found.', array( 'status' => 404 ) );
		}

		$crm_roles = UserRoles::get_assignable_role_slugs();

		foreach ( $crm_roles as $crm_role ) {
			if ( in_array( $crm_role, $user->roles, true ) ) {
				$user->remove_role( $crm_role );
				do_action( 'doublescale_user_role_revoked', $user->ID, $crm_role );
			}
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'User CRM access removed successfully.',
			),
			200
		);
	}

	/**
	 * Check admin permissions
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function check_admin_permissions( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check sales rep permissions (less restrictive for frontend usage)
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function check_sales_rep_permissions( $request ) {
		return Permissions::has_sales_rep_access();
	}
}
