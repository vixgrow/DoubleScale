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
		// Get all users with CRM roles or WordPress admin access
		$users = get_users(
			array(
				'role__in' => array( User_Roles::CRM_MANAGER, User_Roles::DEAL_OWNER ),
			)
		);

		$formatted_users = array();
		foreach ( $users as $user ) {
			$user_role = Permissions::get_user_role( $user->ID );

			$formatted_users[] = array(
				'id'         => $user->ID,
				'name'       => $user->display_name,
				'email'      => $user->user_email,
				'user_login' => $user->user_login,
				'role'       => User_Roles::get_roles()[ $user_role ],
				'crm_role'   => $user_role,
				'roles'      => $user->roles,
			);
		}

		return new WP_REST_Response( $formatted_users, 200 );
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
			return new WP_Error( 'user_not_found', 'User with this email does not exist. Please create the WordPress user first.', array( 'status' => 404 ) );
		}

		// check if user already has a CRM role
		$check_user_has_role = Permissions::check_user_has_role( $user->ID );
		if ( $check_user_has_role ) {
			return new WP_Error( 'user_already_has_crm_role', 'User already has a CRM role.', array( 'status' => 400 ) );
		}

		// Set specific role only
		$frontend_role = $roles[0];
		if ( $frontend_role === User_Roles::CRM_MANAGER ) {
			$user->set_role( User_Roles::CRM_MANAGER );
		} elseif ( $frontend_role === User_Roles::DEAL_OWNER ) {
			$user->set_role( User_Roles::DEAL_OWNER );
		}

		// Get role label for response

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'User role assigned successfully.',
				'user'    => array(
					'id'       => $user->ID,
					'name'     => $user->display_name,
					'email'    => $user->user_email,
					'role'     => User_Roles::get_roles()[ reset( $user->roles ) ],
					'crm_role' => reset( $user->roles ),
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

		// Set specific role
		User_Roles::remove_role_and_capabilities( $user->ID );
		if ( $role === User_Roles::CRM_MANAGER ) {
			$user->set_role( User_Roles::CRM_MANAGER );
		} elseif ( $role === User_Roles::DEAL_OWNER ) {
			$user->set_role( User_Roles::DEAL_OWNER );
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'User role updated successfully.',
				'user'    => array(
					'id'       => $user->ID,
					'crm_role' => reset( $user->roles ),
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

		// Remove CRM access via user meta
		User_Roles::remove_role_and_capabilities( $user->ID );

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
}
