<?php

/**
 * Class Permissions
 *
 * This class is responsible for handling CRM permissions
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\User_Roles;


/**
 * Permissions class
 *
 * Handles role-based permission checking for the CRM system
 */
final class Permissions {





	/**
	 * Check if user is a CRM Manager/Admin
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool True if user is CRM manager
	 */
	public static function is_crm_manager( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		return in_array( $user_role, array( User_Roles::CRM_MANAGER, User_Roles::ADMINISTRATOR ) ) ? true : false;
	}

	/**
	 * Check if user is a Sales Manager
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool True if user is sales manager
	 */
	public static function is_sales_manager( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		return in_array( $user_role, array( User_Roles::SALES_MANAGER ) ) ? true : false;
	}

	/**
	 * Check if user is a Sales Rep
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool True if user is sales rep
	 */
	public static function is_sales_rep( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		return in_array( $user_role, array( User_Roles::SALES_REP ) ) ? true : false;
	}


	/**
	 * Check if user has basic CRM access
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool True if user has CRM access
	 */
	public static function has_crm_manager_access( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		// Check if user has one of the allowed roles
		return in_array( $user_role, array( User_Roles::CRM_MANAGER, User_Roles::ADMINISTRATOR ) ) ? true : false;
	}

	/**
	 * Check if user has sales manager access (can manage all deals)
	 *
	 * Sales Manager, CRM Manager, and Administrator all have this access
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool True if user has sales manager access
	 */
	public static function has_sales_manager_access( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		// Check if user has one of the allowed roles
		return in_array( $user_role, array( User_Roles::CRM_MANAGER, User_Roles::ADMINISTRATOR, User_Roles::SALES_MANAGER ) ) ? true : false;
	}

	/**
	 * Check if user has sales rep access
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool True if user has sales rep access
	 */
	public static function has_sales_rep_access( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		// Check if user has one of the allowed roles (includes Sales Manager)
		return in_array( $user_role, array( User_Roles::CRM_MANAGER, User_Roles::ADMINISTRATOR, User_Roles::SALES_MANAGER, User_Roles::SALES_REP ) ) ? true : false;
	}

	/**
	 * Check if user has a CRM role
	 *
	 * @since 1.0.0
	 *
	 * @param int $user_id User ID
	 * @return bool True if user has a CRM role
	 */
	public static function check_user_has_role( $user_id ) {
		$user_role = self::get_user_role( $user_id );
		return in_array( $user_role, array( User_Roles::CRM_MANAGER, User_Roles::SALES_MANAGER, User_Roles::SALES_REP ) ) ? true : false;
	}


	// helper methods

	/**
	 * Set current user ID
	 *
	 * @since 1.0.0
	 *
	 * @param int $user_id User ID
	 * @return int User ID
	 */
	public static function set_current_user_id( $user_id ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}
		return $user_id;
	}

	/**
	 * Get user role
	 *
	 * @since 1.0.0
	 *
	 * @param int $user_id User ID
	 * @return string User role
	 */
	public static function get_user_role( $user_id ) {
		$user_id = self::set_current_user_id( $user_id );

		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return User_Roles::NONE;
		}

		$roles = (array) $user->roles;

		// Priority order: Administrator > CRM Manager > Sales Manager > Sales Rep
		$priority = array(
			User_Roles::ADMINISTRATOR,
			User_Roles::CRM_MANAGER,
			User_Roles::SALES_MANAGER,
			User_Roles::SALES_REP,
		);

		foreach ( $priority as $role ) {
			if ( in_array( $role, $roles ) ) {
				return $role; // return highest role
			}
		}

		return User_Roles::NONE;
	}
}
