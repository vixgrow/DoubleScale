<?php

/**
 * Class Permissions
 *
 * This class is responsible for handling CRM permissions
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\UserRoles;

use DoubleScale\Core\Settings\Settings;

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
		return in_array( $user_role, array( UserRoles::CRM_MANAGER, UserRoles::ADMINISTRATOR ) ) ? true : false;
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
		return in_array( $user_role, array( UserRoles::SALES_MANAGER ) ) ? true : false;
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
		return in_array( $user_role, array( UserRoles::SALES_REP ) ) ? true : false;
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
		return in_array( $user_role, array( UserRoles::CRM_MANAGER, UserRoles::ADMINISTRATOR ) ) ? true : false;
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
		return in_array( $user_role, array( UserRoles::CRM_MANAGER, UserRoles::ADMINISTRATOR, UserRoles::SALES_MANAGER ) ) ? true : false;
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
		return in_array( $user_role, array( UserRoles::CRM_MANAGER, UserRoles::ADMINISTRATOR, UserRoles::SALES_MANAGER, UserRoles::SALES_REP ) ) ? true : false;
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
		return in_array( $user_role, array( UserRoles::CRM_MANAGER, UserRoles::SALES_MANAGER, UserRoles::SALES_REP ) ) ? true : false;
	}


	/**
	 * Check if user has AI access based on dynamic settings.
	 *
	 * NOTE: Unlike other has_*_access() methods which return plain bool,
	 * this returns bool|WP_Error because it serves as both:
	 * 1. A WordPress REST/Abilities permission_callback (supports WP_Error for detailed error responses)
	 * 2. An internal permission check (truthy = access granted)
	 *
	 * @since 1.5.0
	 *
	 * @param int|null $user_id User ID (null for current user).
	 * @return true|\WP_Error True if access granted, WP_Error with reason if denied.
	 */
	public static function has_ai_access( $user_id = null ) {
		$ai_settings = Settings::get( 'ai', array() );
		$access      = $ai_settings['access'] ?? self::default_ai_access();

		// Provider must be configured (hard requirement for everyone).
		if ( empty( $ai_settings['provider'] ) ) {
			return new \WP_Error( 'ai_not_configured', __( 'AI provider not configured.', 'doublescale'), array( 'status' => 400 ) );
		}

		$user_role = self::get_user_role( $user_id );

		// Administrators always have access regardless of the master switch.
		if ( UserRoles::ADMINISTRATOR === $user_role ) {
			return true;
		}

		// Master switch (only governs non-admin roles).
		if ( empty( $access['enabled'] ) ) {
			return new \WP_Error( 'ai_disabled', __( 'AI features are disabled.', 'doublescale'), array( 'status' => 403 ) );
		}

		$allowed_roles = $access['allowed_roles'] ?? array( UserRoles::CRM_MANAGER, UserRoles::ADMINISTRATOR );

		if ( ! in_array( $user_role, $allowed_roles, true ) ) {
			return new \WP_Error( 'ai_no_access', __( 'Your role does not have AI access.', 'doublescale'), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Default AI access settings (applied when keys are missing).
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	public static function default_ai_access() {
		return array(
			'enabled'       => true,
			'allowed_roles' => array(
				UserRoles::CRM_MANAGER,
				UserRoles::ADMINISTRATOR,
				UserRoles::SALES_MANAGER,
				UserRoles::SALES_REP,
			),
		);
	}

	/**
	 * Default AI data access settings.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	public static function default_ai_data_access() {
		return array(
			'crm_data'          => true,
			'conversation_data' => true,
			'campaign_data'     => true,
			'activity_data'     => true,
		);
	}

	/**
	 * Default AI data sources settings.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	public static function default_ai_data_sources() {
		return array(
			'business_profile'       => true,
			'brand_voice'            => '',
			'industry'               => '',
			'product_description'    => '',
			'ideal_customer_profile' => '',
			'custom_instructions'    => '',
		);
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
			return UserRoles::NONE;
		}

		// In multisite, super admins have full access regardless of per-site roles.
		if ( is_multisite() && is_super_admin( $user_id ) ) {
			return UserRoles::ADMINISTRATOR;
		}

		$roles = (array) $user->roles;

		// Priority order: Administrator > CRM Manager > Sales Manager > Sales Rep
		$priority = array(
			UserRoles::ADMINISTRATOR,
			UserRoles::CRM_MANAGER,
			UserRoles::SALES_MANAGER,
			UserRoles::SALES_REP,
		);

		foreach ( $priority as $role ) {
			if ( in_array( $role, $roles ) ) {
				return $role; // return highest role
			}
		}

		return UserRoles::NONE;
	}
}
