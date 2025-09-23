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
		return in_array( $user_role, array( User_Roles::CRM_MANAGER ) ) ? true : false;
	}

	/**
	 * Check if user is a Deal Owner
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool True if user is deal owner
	 */
	public static function is_deal_owner( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		return in_array( $user_role, array( User_Roles::DEAL_OWNER ) ) ? true : false;
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
	 * Check if user has deal owner access
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool True if user has deal owner access
	 */
	public static function has_deal_owner_access( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		// Check if user has one of the allowed roles
		return in_array( $user_role, array( User_Roles::CRM_MANAGER, User_Roles::ADMINISTRATOR, User_Roles::DEAL_OWNER ) ) ? true : false;
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
		return in_array( $user_role, array( User_Roles::CRM_MANAGER, User_Roles::DEAL_OWNER ) ) ? true : false;
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
		// Get current user ID if none passed
		$user_id = self::set_current_user_id( $user_id );
		// Get user data
		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return User_Roles::NONE;
		}
		// User roles (array)
		$roles = (array) $user->roles;
		return reset( $roles );
	}
}
