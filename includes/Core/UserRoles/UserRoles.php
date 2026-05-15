<?php

/**
 * Class UserRoles
 *
 * This class is responsible for handling the CRM user roles
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Core\UserRoles;



defined( 'ABSPATH' ) || exit;

/**
 * UserRoles class
 *
 * Manages the CRM role system:
 * - CRM Manager/Admin (doublescale_crm_manager)
 * - Sales Manager (doublescale_sales_manager)
 * - Sales Rep (doublescale_sales_rep)
 */
final class UserRoles {


	public const PREFIX        = 'doublescale_';
	public const CRM_MANAGER   = self::PREFIX . 'crm_manager';
	public const SALES_MANAGER = self::PREFIX . 'sales_manager';
	public const SALES_REP     = self::PREFIX . 'sales_rep';
	public const ADMINISTRATOR = 'administrator';
	public const NONE          = self::PREFIX . 'none';


	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var UserRoles
	 */
	private static $instance;

	/**
	 * User Roles Instance.
	 *
	 * Instantiates or reuses an instance of UserRoles.
	 *
	 * @since 1.0.0
	 *
	 * @return UserRoles
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
	public function __construct() {}



	/**
	 * WordPress admin setup
	 *
	 * Add CRM capabilities to WordPress administrators
	 *
	 * @since 1.0.0
	 */
	public static function add_roles_and_capabilities() {
		// CRM roles/caps are provisioned only when DoubleScale Pro is loaded.
		// Prevents accidental registration if this method is called without Pro.
		if ( ! defined( 'DOUBLESCALE_PRO_PLUGIN_FILE' ) ) {
			return;
		}

		$roles = self::get_roles();

		foreach ( $roles as $role => $label ) {
			if ( $role === UserRoles::CRM_MANAGER ) {
				$capabilities = self::get_crm_manager_capabilities();
			} elseif ( $role === UserRoles::SALES_MANAGER ) {
				$capabilities = self::get_sales_manager_capabilities();
			} elseif ( $role === UserRoles::SALES_REP ) {
				$capabilities = self::get_sales_rep_capabilities();
			}

			$capabilities = array_fill_keys( $capabilities, true );

			if ( ! get_role( $role ) ) {
				add_role( $role, $label, $capabilities );
			} else {
				$role_obj = get_role( $role );
				foreach ( $capabilities as $cap => $grant ) {
					$role_obj->add_cap( $cap, $grant );
				}
			}
		}

		// Add CRM capabilities to administrators
		$admin_role = get_role( 'administrator' );
		if ( $admin_role ) {
			$admin_capabilities = self::get_crm_manager_capabilities(); // Administrators get full CRM access
			foreach ( $admin_capabilities as $capability ) {
				$admin_role->add_cap( $capability, true );
			}
		}
	}

	/**
	 * Remove capabilities from role
	 *
	 * @since 1.0.0
	 *
	 * @param string $role Role name
	 */
	public static function remove_role_and_capabilities( $user_id ) {
		$user  = get_user_by( 'ID', $user_id );
		$roles = $user->roles;
		foreach ( $roles as $role ) {
			foreach ( self::all_capabilities() as $capability ) {
				$user->remove_cap( $capability );
			}
			$user->remove_role( $role );
		}
	}



	/**
	 * Get CRM capabilities grouped by role
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of capabilities organized by role
	 */
	private static function get_capabilities() {
		return array(
			'common'                  => array(
				'doublescale_access',           // Basic CRM access
				'doublescale_view_contacts',    // View contacts
				'doublescale_view_deals',       // View deals
				'doublescale_view_activities',  // View activities
				'read',                     // For Wordpress
			),
			UserRoles::SALES_REP     => array(
				'doublescale_edit_own_deals',     // Edit own deals
				'doublescale_create_deals',       // Create new deals (assigned to self)
				'doublescale_edit_own_contacts',  // Edit own contacts
				'doublescale_create_contacts',    // Create new contacts
				'doublescale_create_activities',  // Create activities
			),
			UserRoles::SALES_MANAGER => array(
				'doublescale_manage_deals',       // Manage all deals (CRUD for all deals)
				'doublescale_view_all_deals',     // View all deals (assigned to anyone)
				'doublescale_create_activities',  // Create activities
				'doublescale_manage_contacts',    // Manage all contacts (create, edit, delete)
				'doublescale_import_data',        // Import data
				'doublescale_export_data',        // Export data
			),
			UserRoles::CRM_MANAGER   => array(
				'doublescale_manage',             // Full CRM management
				'doublescale_manage_users',       // Manage CRM users
				'doublescale_manage_settings',    // Manage CRM settings
				'doublescale_manage_contacts',    // Manage all contacts
				'doublescale_manage_deals',       // Manage all deals
				'doublescale_view_all_deals',     // View all deals
				'doublescale_manage_pipelines',   // Manage pipelines
				'doublescale_manage_activities',  // Manage all activities
				'doublescale_view_reports',       // View reports
				'doublescale_export_data',        // Export data
				'doublescale_import_data',        // Import data
				'list_users',                  // For Wordpress List users
			),
		);
	}

	/**
	 * Get all capabilities
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of all capabilities
	 */
	public static function all_capabilities() {
		return array_merge(
			self::get_capabilities()['common'],
			self::get_capabilities()[ UserRoles::CRM_MANAGER ],
			self::get_capabilities()[ UserRoles::SALES_MANAGER ],
			self::get_capabilities()[ UserRoles::SALES_REP ]
		);
	}


	/**
	 * Get available CRM roles
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of CRM roles
	 */
	public static function get_roles() {
		return array(
			UserRoles::CRM_MANAGER   => __( 'CRM Manager', 'doublescale'),
			UserRoles::SALES_MANAGER => __( 'Sales Manager', 'doublescale'),
			UserRoles::SALES_REP     => __( 'Sales Rep', 'doublescale'),
		);
	}

	/**
	 * All CRM caps as associative array (cap => true) for multisite super-admin grants.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, bool>
	 */
	public static function get_all_caps() {
		return array_fill_keys( self::all_capabilities(), true );
	}

	/**
	 * Get CRM manager capabilities
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of CRM manager capabilities
	 */
	public static function get_crm_manager_capabilities() {
		return array_merge(
			self::get_capabilities()['common'],
			self::get_capabilities()[ UserRoles::CRM_MANAGER ],
			self::get_capabilities()[ UserRoles::SALES_REP ]
		);
	}

	/**
	 * Get sales manager capabilities
	 *
	 * Sales Manager has same base capabilities as Sales Rep but can manage all deals
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of sales manager capabilities
	 */
	public static function get_sales_manager_capabilities() {
		return array_merge(
			self::get_capabilities()['common'],
			self::get_capabilities()[ UserRoles::SALES_REP ],
			self::get_capabilities()[ UserRoles::SALES_MANAGER ]
		);
	}

	/**
	 * Get sales rep capabilities
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of sales rep capabilities
	 */
	public static function get_sales_rep_capabilities() {
		return array_merge(
			self::get_capabilities()['common'],
			self::get_capabilities()[ UserRoles::SALES_REP ]
		);
	}
}
