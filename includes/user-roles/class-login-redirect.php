<?php

/**
 * Class Login_Redirect
 *
 * Handles login redirection for CRM user roles
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\User_Roles;

defined( 'ABSPATH' ) || exit;

/**
 * Login_Redirect class
 *
 * Redirects CRM Manager and Sales Rep users to the CRM dashboard after login
 */
final class Login_Redirect {

	/**
	 * CRM dashboard page slug
	 */
	public const CRM_DASHBOARD_SLUG = 'quillcrm';

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Login_Redirect
	 */
	private static $instance;

	/**
	 * Login_Redirect Instance.
	 *
	 * Instantiates or reuses an instance of Login_Redirect.
	 *
	 * @since 1.0.0
	 *
	 * @return Login_Redirect
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		$this->init_hooks();
	}

	/**
	 * Initialize hooks
	 *
	 * @since 1.0.0
	 */
	private function init_hooks() {
		add_filter( 'login_redirect', array( $this, 'redirect_crm_users' ), 10, 3 );
	}

	/**
	 * Redirect CRM users to CRM dashboard after login
	 *
	 * @since 1.0.0
	 *
	 * @param string           $redirect_to           The redirect destination URL.
	 * @param string           $requested_redirect_to The requested redirect destination URL passed as a parameter.
	 * @param \WP_User|\WP_Error $user                  WP_User object if login was successful, WP_Error object otherwise.
	 * @return string The redirect URL.
	 */
	public function redirect_crm_users( $redirect_to, $requested_redirect_to, $user ) {
		// Check if user logged in successfully.
		if ( ! $user instanceof \WP_User ) {
			return $redirect_to;
		}

		// If a specific redirect was requested (not default admin), honor it.
		if ( ! empty( $requested_redirect_to ) && $requested_redirect_to !== admin_url() ) {
			return $redirect_to;
		}

		// Check if user has a CRM role (CRM Manager or Sales Rep).
		if ( $this->user_has_crm_role( $user ) ) {
			return $this->get_crm_dashboard_url();
		}

		return $redirect_to;
	}

	/**
	 * Check if user has a CRM-specific role
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_User $user The user object.
	 * @return bool True if user has a CRM role.
	 */
	private function user_has_crm_role( \WP_User $user ) {
		$crm_roles = array(
			User_Roles::CRM_MANAGER,
			User_Roles::SALES_REP,
		);

		// Check if any of the user's roles match CRM roles.
		foreach ( $user->roles as $role ) {
			if ( in_array( $role, $crm_roles, true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get the CRM dashboard URL
	 *
	 * @since 1.0.0
	 *
	 * @return string The CRM dashboard URL.
	 */
	private function get_crm_dashboard_url() {
		return admin_url( 'admin.php?page=' . self::CRM_DASHBOARD_SLUG );
	}
}

