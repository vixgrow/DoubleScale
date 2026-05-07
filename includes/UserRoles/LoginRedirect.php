<?php

/**
 * Class LoginRedirect
 *
 * Handles login redirection for CRM user roles
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\UserRoles;

defined( 'ABSPATH' ) || exit;

/**
 * LoginRedirect class
 *
 * Redirects CRM Manager and Sales Rep users to the CRM dashboard after login
 */
final class LoginRedirect {

	/**
	 * CRM dashboard page slug
	 */
	public const CRM_DASHBOARD_SLUG = 'doublescale';

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var LoginRedirect
	 */
	private static $instance;

	/**
	 * LoginRedirect Instance.
	 *
	 * Instantiates or reuses an instance of LoginRedirect.
	 *
	 * @since 1.0.0
	 *
	 * @return LoginRedirect
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
	 * @param string             $redirect_to           The redirect destination URL.
	 * @param string             $requested_redirect_to The requested redirect destination URL passed as a parameter.
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

		if ( $this->user_has_crm_role( $user ) ) {
			return $this->get_redirect_url_for_user( $user );
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
			UserRoles::CRM_MANAGER,
			UserRoles::SALES_MANAGER,
			UserRoles::SALES_REP,
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
	 * Get the appropriate redirect URL based on user role
	 *
	 * Sales Rep and Sales Manager are redirected to the pipeline page.
	 * CRM Manager is redirected to the CRM dashboard.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_User $user The user object.
	 * @return string The redirect URL.
	 */
	private function get_redirect_url_for_user( \WP_User $user ) {
		$sales_roles = array(
			UserRoles::SALES_MANAGER,
			UserRoles::SALES_REP,
		);

		foreach ( $user->roles as $role ) {
			if ( in_array( $role, $sales_roles, true ) ) {
				return admin_url( 'admin.php?page=' . self::CRM_DASHBOARD_SLUG . '&path=sales-pipeline' );
			}
		}

		return admin_url( 'admin.php?page=' . self::CRM_DASHBOARD_SLUG );
	}
}

