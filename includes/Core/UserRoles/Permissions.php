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

namespace DoubleScale\Core\UserRoles;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Contacts\Models\ContactModel;

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
	 * Check if user is a Support Manager
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool
	 */
	public static function is_support_manager( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		return UserRoles::SUPPORT_MANAGER === $user_role;
	}

	/**
	 * Check if user is a Support Agent
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool
	 */
	public static function is_support_agent( $user_id = null ) {
		$user_role = self::get_user_role( $user_id );
		return UserRoles::SUPPORT_AGENT === $user_role;
	}

	/**
	 * Check if the user may open the Support Settings page (mailboxes, SMTP
	 * identities, notification toggles). Granted to:
	 *   - Administrators (manage_options),
	 *   - CRM Managers (treated like an admin for Support),
	 *   - the Support Manager role.
	 *
	 * Support AGENTS are intentionally excluded: managing mailboxes (create /
	 * delete, SMTP sending identity, bulk ticket re-routing) is a manager-tier
	 * action. Agents are scoped to working their assigned tickets.
	 *
	 * Sales Manager / Sales Rep get NO support access unless an admin ALSO
	 * assigns them a support role. Mirrors the frontend route gate in
	 * `src/client/pages/support/index.tsx`.
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool
	 */
	public static function can_access_support_settings( $user_id = null ) {
		$user_id = self::set_current_user_id( $user_id );

		// Administrators and CRM Managers always have full support access.
		if ( user_can( $user_id, 'manage_options' ) || self::is_crm_manager( $user_id ) ) {
			return true;
		}

		// Role-membership check (NOT single-highest-role): a user who is e.g.
		// Sales Rep + Support Manager still gets settings access from the
		// Support Manager role. Capabilities merge across roles. Support AGENTS
		// are deliberately NOT included here — mailbox/channel configuration is
		// manager-tier (see method docblock).
		return self::user_has_role( UserRoles::SUPPORT_MANAGER, $user_id );
	}

	/**
	 * Check if the user can see and manage every support ticket (not just
	 * tickets assigned to them). Granted to administrators, CRM Managers, and
	 * Support Managers (NOT Sales Managers — support is exclusive to the support
	 * roles plus the CRM Manager / admin tier).
	 *
	 * Bypasses the `agent_user_id` ownership filter on Support REST routes.
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool
	 */
	public static function can_manage_all_tickets( $user_id = null ) {
		$user_id = self::set_current_user_id( $user_id );
		return user_can( $user_id, 'doublescale_manage_all_tickets' );
	}

	/**
	 * Check if the user can access the support module at all (read and reply
	 * to at least their own tickets). Granted to every CRM/Support role.
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool
	 */
	public static function has_support_access( $user_id = null ) {
		$user_id = self::set_current_user_id( $user_id );
		return user_can( $user_id, 'doublescale_view_support' );
	}

	/**
	 * Whether a logged-in support-capable user should be turned away from the
	 * customer portal shortcode (staff redirect instead of the SPA).
	 *
	 * Mirrors Fluent Support: agents without a customer identity are blocked,
	 * but a WP user whose email matches a CRM contact is treated as a customer
	 * and may use the portal even when they also hold support capabilities.
	 *
	 * @param int|null $user_id User ID (null for current user).
	 * @return bool
	 */
	public static function should_block_customer_portal( $user_id = null ) {
		$user_id = self::set_current_user_id( $user_id );
		if ( $user_id <= 0 || ! self::has_support_access( $user_id ) ) {
			return false;
		}

		$user = get_userdata( $user_id );
		if ( ! $user || empty( $user->user_email ) || ! is_email( $user->user_email ) ) {
			return true;
		}

		$email = strtolower( trim( (string) $user->user_email ) );

		return ! ContactModel::where( 'email', $email )->exists();
	}

	/**
	 * Check if the user's ONLY DoubleScale roles are support roles (no CRM
	 * Manager / Sales Manager / Sales Rep / Administrator). Used to scope the
	 * admin menu down to only the Support submenu for dedicated support staff.
	 *
	 * @param int|null $user_id User ID (null for current user)
	 * @return bool
	 */
	public static function is_support_only( $user_id = null ) {
		$user_id = self::set_current_user_id( $user_id );
		$user    = get_userdata( $user_id );
		if ( ! $user ) {
			return false;
		}

		if ( user_can( $user_id, 'manage_options' ) ) {
			return false; // Administrators / super-admins never get scoped down.
		}

		$roles             = (array) $user->roles;
		$broader_crm_roles = array(
			UserRoles::CRM_MANAGER,
			UserRoles::SALES_MANAGER,
			UserRoles::SALES_REP,
		);
		if ( array_intersect( $broader_crm_roles, $roles ) ) {
			return false;
		}

		$support_roles = array( UserRoles::SUPPORT_MANAGER, UserRoles::SUPPORT_AGENT );
		return (bool) array_intersect( $support_roles, $roles );
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
		return in_array( $user_role, UserRoles::get_assignable_role_slugs(), true );
	}


	/**
	 * Check if user has AI access based on dynamic settings.
	 *
	 * NOTE: Unlike other has_*_access() methods which return plain bool,
	 * this returns bool|WP_Error because it serves as both:
	 * 1. A WordPress REST/Abilities permission_callback (supports WP_Error for detailed error responses)
	 * 2. An internal permission check (truthy = access granted)
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for current user).
	 * @return true|\WP_Error True if access granted, WP_Error with reason if denied.
	 */
	public static function has_ai_access( $user_id = null ) {
		$ai_settings = Settings::get( 'ai', array() );
		$access      = $ai_settings['access'] ?? self::default_ai_access();

		// Provider must be configured (hard requirement for everyone).
		if ( empty( $ai_settings['provider'] ) ) {
			return new \WP_Error( 'ai_not_configured', __( 'AI provider not configured.', 'doublescale' ), array( 'status' => 400 ) );
		}

		$user_role = self::get_user_role( $user_id );

		// Administrators always have access regardless of the master switch.
		if ( UserRoles::ADMINISTRATOR === $user_role ) {
			return true;
		}

		// Master switch (only governs non-admin roles).
		if ( empty( $access['enabled'] ) ) {
			return new \WP_Error( 'ai_disabled', __( 'AI features are disabled.', 'doublescale' ), array( 'status' => 403 ) );
		}

		$allowed_roles = $access['allowed_roles'] ?? array( UserRoles::CRM_MANAGER, UserRoles::ADMINISTRATOR );

		if ( ! in_array( $user_role, $allowed_roles, true ) ) {
			return new \WP_Error( 'ai_no_access', __( 'Your role does not have AI access.', 'doublescale' ), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Default AI access settings (applied when keys are missing).
	 *
	 * @since 1.0.0
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
	 * @since 1.0.0
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
	 * @since 1.0.0
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

		// Priority order: Administrator > CRM Manager > Sales Manager > Sales Rep > Support Manager > Support Agent
		$priority = array(
			UserRoles::ADMINISTRATOR,
			UserRoles::CRM_MANAGER,
			UserRoles::SALES_MANAGER,
			UserRoles::SALES_REP,
			UserRoles::SUPPORT_MANAGER,
			UserRoles::SUPPORT_AGENT,
		);

		foreach ( $priority as $role ) {
			if ( in_array( $role, $roles ) ) {
				return $role; // return highest role
			}
		}

		return UserRoles::NONE;
	}

	/**
	 * Check whether the user actually HOLDS a given role — looking at ALL of
	 * their roles, not just the single highest one ({@see get_user_role()}).
	 *
	 * This is what makes capabilities merge across roles: a user who is both
	 * Sales Rep AND Support Manager returns true for BOTH
	 * `user_has_role(SALES_REP)` and `user_has_role(SUPPORT_MANAGER)`, so each
	 * role's permissions apply independently. Use this (not `is_*`/`get_user_role`)
	 * whenever a permission should be granted by the mere presence of a role.
	 *
	 * @param string   $role    Role slug to look for.
	 * @param int|null $user_id User ID (null for current user).
	 * @return bool
	 */
	public static function user_has_role( $role, $user_id = null ) {
		$user_id = self::set_current_user_id( $user_id );

		// Multisite super admins implicitly hold the administrator role.
		if ( UserRoles::ADMINISTRATOR === $role && is_multisite() && is_super_admin( $user_id ) ) {
			return true;
		}

		$user = get_userdata( $user_id );
		if ( ! $user ) {
			return false;
		}

		return in_array( $role, (array) $user->roles, true );
	}
}
