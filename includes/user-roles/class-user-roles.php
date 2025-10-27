<?php

/**
 * Class User_Roles
 *
 * This class is responsible for handling the CRM user roles
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\User_Roles;


/**
 * User_Roles class
 *
 * Manages the two-role CRM system:
 * - CRM Manager/Admin (quillcrm_crm_manager)
 * - Deal Owner (quillcrm_deal_owner)
 */
final class User_Roles {





	public const PREFIX        = 'quillcrm_';
	public const CRM_MANAGER   = self::PREFIX . 'crm_manager';
	public const DEAL_OWNER    = self::PREFIX . 'deal_owner';
	public const ADMINISTRATOR = 'administrator';
	public const NONE          = self::PREFIX . 'none';


	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var User_Roles
	 */
	private static $instance;

	/**
	 * User Roles Instance.
	 *
	 * Instantiates or reuses an instance of User_Roles.
	 *
	 * @since 1.0.0
	 *
	 * @return User_Roles
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
		$roles = self::get_roles();

		foreach ( $roles as $role => $label ) {
			if ( $role === User_Roles::CRM_MANAGER ) {
				$capabilities = self::get_crm_manager_capabilities();
			} elseif ( $role === User_Roles::DEAL_OWNER ) {
				$capabilities = self::get_deal_owner_capabilities();
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
			'common'                => array(
				'quillcrm_access',           // Basic CRM access
				'quillcrm_view_contacts',    // View contacts
				'quillcrm_view_deals',       // View deals
				'quillcrm_view_activities',  // View activities
				'read',                     // For Wordpress
			),
			User_Roles::DEAL_OWNER  => array(
				'quillcrm_edit_own_deals',     // Edit own deals
				'quillcrm_edit_own_contacts',  // Edit own contacts
				'quillcrm_create_activities',  // Create activities
			),
			User_Roles::CRM_MANAGER => array(
				'quillcrm_manage',             // Full CRM management
				'quillcrm_manage_users',       // Manage CRM users
				'quillcrm_manage_settings',    // Manage CRM settings
				'quillcrm_manage_contacts',    // Manage all contacts
				'quillcrm_manage_deals',       // Manage all deals
				'quillcrm_manage_pipelines',   // Manage pipelines
				'quillcrm_manage_activities',  // Manage all activities
				'quillcrm_view_reports',       // View reports
				'quillcrm_export_data',        // Export data
				'quillcrm_import_data',        // Import data
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
			self::get_capabilities()[ User_Roles::CRM_MANAGER ],
			self::get_capabilities()[ User_Roles::DEAL_OWNER ]
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
			User_Roles::CRM_MANAGER => __( 'CRM Manager', 'quillcrm' ),
			User_Roles::DEAL_OWNER  => __( 'Deal Owner', 'quillcrm' ),
		);
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
			self::get_capabilities()[ User_Roles::CRM_MANAGER ],
			self::get_capabilities()[ User_Roles::DEAL_OWNER ]
		);
	}

	/**
	 * Get deal owner capabilities
	 *
	 * @since 1.0.0
	 *
	 * @return array Array of deal owner capabilities
	 */
	public static function get_deal_owner_capabilities() {
		return array_merge(
			self::get_capabilities()['common'],
			self::get_capabilities()[ User_Roles::DEAL_OWNER ]
		);
	}
}
