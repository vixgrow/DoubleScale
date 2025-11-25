<?php

/**
 * REST API: User Management Controller
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\User_Roles\Permissions;
use QuillCRM\User_Roles\User_Roles;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * User Management REST Controller
 */
class REST_User_Management_Controller extends REST_Controller {


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
					'permission_callback' => array( $this, 'check_deal_owner_permissions' ),
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
						'id'   => array(
							'required' => true,
							'type'     => 'integer',
						),
						'role' => array(
							'required' => true,
							'type'     => 'string',
							'enum'     => array( User_Roles::CRM_MANAGER, User_Roles::DEAL_OWNER, User_Roles::NONE ),
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
								'enum' => array( User_Roles::CRM_MANAGER, User_Roles::DEAL_OWNER ),
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
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_crm_users( $request ) {
		// CRM roles we filter by
		$crm_roles = array(
			User_Roles::CRM_MANAGER,
			User_Roles::DEAL_OWNER,
		);

		// Get all users with CRM roles
		$users = get_users(
			array(
				'role__in' => $crm_roles,
			)
		);

		$formatted_users = array();

		foreach ( $users as $user ) {

			// Extract only CRM-related roles from the user's role list
			$user_crm_roles = array_values( array_intersect( $user->roles, $crm_roles ) );

			$formatted_users[] = array(
				'id'         => $user->ID,
				'name'       => $user->display_name,
				'email'      => $user->user_email,
				'user_login' => $user->user_login,
				'role'       => '',
				'crm_role'   => reset( $user_crm_roles ),
				'roles'      => $user->roles,
			);
		}

		return new WP_REST_Response( $formatted_users, 200 );
	}

	/**
	 * Get CRM users for frontend with search and pagination
	 *
	 * @since 1.0.0
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

		// Build user query arguments
		$user_args = array(
			'number'  => $per_page,
			'offset'  => ( $page - 1 ) * $per_page,
			'orderby' => $orderby,
			'order'   => strtoupper( $order ),
			'fields'  => 'all',
		);

		// Add search functionality
		if ( ! empty( $search ) && strlen( $search ) >= 2 ) {
			$user_args['search']         = '*' . esc_attr( $search ) . '*';
			$user_args['search_columns'] = array( 'user_login', 'user_email', 'display_name' );
		}

		if ( $filter_crm_users ) {
			$user_args['role__in'] = array( User_Roles::CRM_MANAGER, User_Roles::DEAL_OWNER, User_Roles::ADMINISTRATOR );
		}

		// Get users
		$users = get_users( $user_args );

		// Get total count for pagination (without limit)
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
			);
		}

		// Calculate pagination info
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
	 * @since 1.0.0
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

		// Check if user already exists
		$user = get_user_by( 'email', $email );
		if ( ! $user ) {
			return new WP_Error( 'user_not_found', 'User not found.', array( 'status' => 404 ) );
		}

		// Check if user already has a CRM role
		$check_crm_role = Permissions::check_user_has_role( $user->ID );
		if ( $check_crm_role ) {
			return new WP_Error( 'user_already_has_crm_role', 'User already has a CRM role.', array( 'status' => 400 ) );
		}

		// CRM roles we manage
		$crm_roles = array(
			User_Roles::CRM_MANAGER,
			User_Roles::DEAL_OWNER,
		);

		// Remove existing CRM roles only
		foreach ( $crm_roles as $crm_role ) {
			$user->remove_role( $crm_role );
		}

		// Add new CRM roles (no duplicates happen automatically)
		foreach ( $roles as $role ) {
			if ( in_array( $role, $crm_roles, true ) ) {
				$user->add_role( $role );
			}
		}

		// Get CRM-related roles assigned
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
					'crm_role' => reset( $assigned_crm_roles ),
				),
			),
			201
		);
	}


	/**
	 * Assign CRM role to user
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function assign_crm_role( $request ) {
		$user_id = $request->get_param( 'id' );
		$role    = $request->get_param( 'role' );

		$user = get_user_by( 'ID', $user_id );
		if ( ! $user ) {
			return new WP_Error( 'user_not_found', 'User not found.', array( 'status' => 404 ) );
		}

		// CRM roles list
		$crm_roles = array(
			User_Roles::CRM_MANAGER,
			User_Roles::DEAL_OWNER,
		);

		// Remove existing CRM roles
		foreach ( $crm_roles as $crm_role ) {
			$user->remove_role( $crm_role );
		}

		// Add the new CRM role
		if ( in_array( $role, $crm_roles, true ) ) {
			$user->add_role( $role );
		}

		// Get assigned CRM roles
		$assigned_crm_roles = array_values( array_intersect( $user->roles, $crm_roles ) );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'User role updated successfully.',
				'user'    => array(
					'id'       => $user->ID,
					'crm_role' => reset( $assigned_crm_roles ),
				),
			),
			200
		);
	}


	/**
	 * Remove user CRM role
	 *
	 * @since 1.0.0
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

		// CRM roles
		$crm_roles = array(
			User_Roles::CRM_MANAGER,
			User_Roles::DEAL_OWNER,
		);

		// Remove only CRM roles, keep everything else
		foreach ( $crm_roles as $crm_role ) {
			if ( in_array( $crm_role, $user->roles, true ) ) {
				$user->remove_role( $crm_role );
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
	 * Check deal owner permissions (less restrictive for frontend usage)
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function check_deal_owner_permissions( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
