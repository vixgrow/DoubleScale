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


	public const PREFIX          = 'doublescale_';
	public const CRM_MANAGER     = self::PREFIX . 'crm_manager';
	public const SALES_MANAGER   = self::PREFIX . 'sales_manager';
	public const SALES_REP       = self::PREFIX . 'sales_rep';
	public const SUPPORT_MANAGER = self::PREFIX . 'support_manager';
	public const SUPPORT_AGENT   = self::PREFIX . 'support_agent';
	public const ADMINISTRATOR   = 'administrator';
	public const NONE            = self::PREFIX . 'none';


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
		// Support roles are provisioned in the free plugin so customer-support
		// teams can be set up without owning a Pro license. CRM roles (Sales
		// Rep / Sales Manager / CRM Manager) remain gated to Pro, where the
		// CRM modules they depend on actually exist.
		$pro_active = defined( 'DOUBLESCALE_PRO_PLUGIN_FILE' );

		$roles = self::get_roles();

		foreach ( $roles as $role => $label ) {
			$is_support_role = in_array( $role, array( self::SUPPORT_AGENT, self::SUPPORT_MANAGER ), true );
			if ( ! $pro_active && ! $is_support_role ) {
				continue;
			}

			if ( $role === self::CRM_MANAGER ) {
				$capabilities = self::get_crm_manager_capabilities();
			} elseif ( $role === self::SALES_MANAGER ) {
				$capabilities = self::get_sales_manager_capabilities();
			} elseif ( $role === self::SALES_REP ) {
				$capabilities = self::get_sales_rep_capabilities();
			} elseif ( $role === self::SUPPORT_MANAGER ) {
				$capabilities = self::get_support_manager_capabilities();
			} elseif ( $role === self::SUPPORT_AGENT ) {
				$capabilities = self::get_support_agent_capabilities();
			} else {
				continue;
			}

			$capabilities = array_fill_keys( $capabilities, true );

			if ( ! get_role( $role ) ) {
				add_role( $role, $label, $capabilities );
			} else {
				$role_obj = get_role( $role );

				// Add the caps this role should currently have.
				foreach ( $capabilities as $cap => $grant ) {
					$role_obj->add_cap( $cap, $grant );
				}

				// SYNC: strip any DoubleScale cap the role still carries but is
				// no longer in its definition. Without this, removing a cap from
				// get_capabilities() would never take effect for already-
				// provisioned roles (add_cap is additive). Scoped to our own
				// `doublescale_` caps so we never touch WP/WC core capabilities
				// (e.g. `list_users`, `read`) the role legitimately holds.
				foreach ( self::all_capabilities() as $known_cap ) {
					if ( 0 !== strpos( $known_cap, self::PREFIX ) ) {
						continue; // Skip non-DoubleScale caps (read, list_users, …).
					}
					if ( ! isset( $capabilities[ $known_cap ] ) && $role_obj->has_cap( $known_cap ) ) {
						$role_obj->remove_cap( $known_cap );
					}
				}
			}
		}

		// Administrators always get every CRM + Support cap so they can see
		// the entire admin regardless of which roles are provisioned.
		$admin_role = get_role( 'administrator' );
		if ( $admin_role ) {
			$admin_capabilities = array_merge(
				self::get_crm_manager_capabilities(),
				self::get_support_manager_capabilities()
			);
			foreach ( array_unique( $admin_capabilities ) as $capability ) {
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
			'common'              => array(
				'doublescale_access',           // Basic CRM access (top-level menu + REST)
				'read',                         // For Wordpress
				'view_admin_dashboard',         // WP/WC: lets the user reach wp-admin
				                                // even when they don't have edit_posts
				                                // or manage_woocommerce. Required so
				                                // `WC_Admin::prevent_admin_access` and
				                                // `wc_disable_admin_bar` don't kick
				                                // CRM/Support users out to `/my-account/`.
			),
			'crm_common'          => array(
				'doublescale_view_contacts',    // View contacts
				'doublescale_view_deals',       // View deals
				'doublescale_view_activities',  // View activities
				// NOTE: Support is intentionally NOT granted to CRM roles.
				// Support access (view_support / manage_all_tickets /
				// reply_own_tickets) is exclusive to the dedicated support
				// roles. A CRM user (CRM Manager / Sales Manager / Sales Rep)
				// only sees the Support module if an admin ALSO assigns them a
				// support role. See get_capabilities() support_* entries.
			),
			'support_common'      => array(
				'doublescale_view_support',     // View support tickets (own-scope by default)
			),
			self::SALES_REP       => array(
				'doublescale_edit_own_deals',     // Edit own deals
				'doublescale_create_deals',       // Create new deals (assigned to self)
				'doublescale_edit_own_contacts',  // Edit own contacts
				'doublescale_create_contacts',    // Create new contacts
				'doublescale_create_activities',  // Create activities
				// Support caps removed — granted only by support roles.
			),
			self::SALES_MANAGER   => array(
				'doublescale_manage_deals',       // Manage all deals (CRUD for all deals)
				'doublescale_view_all_deals',     // View all deals (assigned to anyone)
				'doublescale_create_activities',  // Create activities
				'doublescale_manage_contacts',    // Manage all contacts (create, edit, delete)
				'doublescale_import_data',        // Import data
				'doublescale_export_data',        // Export data
				// Support caps removed — granted only by support roles.
			),
			self::CRM_MANAGER     => array(
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
				// CRM Manager is the org admin of the CRM — treated like a WP
				// admin for Support: full access (inbox, all tickets, settings)
				// WITHOUT needing a separate support role. Sales Manager / Sales
				// Rep do NOT get this; they still need an explicit support role.
				'doublescale_view_support',       // See the Support module
				'doublescale_manage_all_tickets', // See and manage every ticket
				'doublescale_reply_own_tickets',  // Reply on tickets
				'list_users',                  // For Wordpress List users
			),
			self::SUPPORT_AGENT   => array(
				'doublescale_reply_own_tickets',  // Reply on tickets assigned to self
			),
			self::SUPPORT_MANAGER => array(
				'doublescale_manage_all_tickets', // See and manage every support ticket
				'doublescale_reply_own_tickets',  // Reply on tickets assigned to self
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
		$caps = self::get_capabilities();
		return array_values(
			array_unique(
				array_merge(
					$caps['common'],
					$caps['crm_common'],
					$caps['support_common'],
					$caps[ self::CRM_MANAGER ],
					$caps[ self::SALES_MANAGER ],
					$caps[ self::SALES_REP ],
					$caps[ self::SUPPORT_MANAGER ],
					$caps[ self::SUPPORT_AGENT ]
				)
			)
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
			self::CRM_MANAGER     => __( 'CRM Manager', 'doublescale' ),
			self::SALES_MANAGER   => __( 'Sales Manager', 'doublescale' ),
			self::SALES_REP       => __( 'Sales Rep', 'doublescale' ),
			self::SUPPORT_MANAGER => __( 'Support Manager', 'doublescale' ),
			self::SUPPORT_AGENT   => __( 'Support Agent', 'doublescale' ),
		);
	}

	/**
	 * Returns the list of role slugs that can be assigned through the Team
	 * settings UI / REST endpoints. Centralized so REST validation and UI
	 * stay in sync — any role added to {@see get_roles()} is automatically
	 * assignable.
	 *
	 * @return array<int, string>
	 */
	public static function get_assignable_role_slugs(): array {
		return array_keys( self::get_roles() );
	}

	/**
	 * Pick the highest-priority assignable role from a set of role slugs.
	 *
	 * Priority follows {@see get_roles()} order (highest → lowest):
	 * CRM Manager > Sales Manager > Sales Rep > Support Manager > Support Agent.
	 * When a user holds several DoubleScale roles (e.g. CRM Manager AND Sales
	 * Rep), this returns the one that should drive their effective permissions
	 * (CRM Manager). Administrator is intentionally NOT considered here — it is
	 * a WP role handled separately by {@see Permissions::get_user_role()}.
	 *
	 * @param array<int, string> $roles Role slugs to choose from (e.g. a user's roles).
	 * @return string|null The highest-priority assignable role, or null if none match.
	 */
	public static function get_highest_role( array $roles ): ?string {
		foreach ( self::get_assignable_role_slugs() as $role ) {
			if ( in_array( $role, $roles, true ) ) {
				return $role;
			}
		}
		return null;
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
		$caps = self::get_capabilities();
		return array_values(
			array_unique(
				array_merge(
					$caps['common'],
					$caps['crm_common'],
					$caps[ self::CRM_MANAGER ],
					$caps[ self::SALES_REP ]
				)
			)
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
		$caps = self::get_capabilities();
		return array_values(
			array_unique(
				array_merge(
					$caps['common'],
					$caps['crm_common'],
					$caps[ self::SALES_REP ],
					$caps[ self::SALES_MANAGER ]
				)
			)
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
		$caps = self::get_capabilities();
		return array_values(
			array_unique(
				array_merge(
					$caps['common'],
					$caps['crm_common'],
					$caps[ self::SALES_REP ]
				)
			)
		);
	}

	/**
	 * Get support manager capabilities
	 *
	 * Support Manager can see and act on every ticket and is not bound by
	 * `agent_user_id` ownership.
	 *
	 * @return array
	 */
	public static function get_support_manager_capabilities() {
		$caps = self::get_capabilities();
		return array_values(
			array_unique(
				array_merge(
					$caps['common'],
					$caps['support_common'],
					$caps[ self::SUPPORT_MANAGER ]
				)
			)
		);
	}

	/**
	 * Get support agent capabilities
	 *
	 * Support Agent only sees tickets where they are the assigned agent and
	 * can reply / change status on those tickets.
	 *
	 * @return array
	 */
	public static function get_support_agent_capabilities() {
		$caps = self::get_capabilities();
		return array_values(
			array_unique(
				array_merge(
					$caps['common'],
					$caps['support_common'],
					$caps[ self::SUPPORT_AGENT ]
				)
			)
		);
	}

	/**
	 * Provision DoubleScale roles on existing installs without requiring a
	 * plugin re-activation or version bump. Idempotent: stamps an option so
	 * subsequent boots are a no-op. Bumping {@see ROLES_PROVISION_VERSION}
	 * forces re-provisioning when role/cap definitions change.
	 *
	 * @return void
	 */
	public static function ensure_provisioned() {
		$option_key      = 'doublescale_roles_provisioned';
		$current_version = (string) get_option( $option_key, '' );
		if ( self::ROLES_PROVISION_VERSION === $current_version ) {
			return;
		}

		self::add_roles_and_capabilities();
		update_option( $option_key, self::ROLES_PROVISION_VERSION, false );
	}

	/**
	 * Bump this string when the role-to-capability map changes so existing
	 * installs re-run {@see add_roles_and_capabilities()} on next boot.
	 */
	private const ROLES_PROVISION_VERSION = '2026-05-25-view-admin-dashboard';

	/**
	 * Allow logged-in users with any DoubleScale role to bypass WooCommerce's
	 * "coming soon" mode. WC otherwise only lets `manage_woocommerce` holders
	 * through, which 404-style-blocks our CRM / Support users from reaching
	 * `wp-admin/admin.php?page=doublescale`.
	 *
	 * Wired from {@see CoreModule::boot()} alongside {@see LoginRedirect}.
	 *
	 * @return void
	 */
	public static function register_woocommerce_bypass() {
		add_filter(
			'woocommerce_coming_soon_exclude',
			static function ( $exclude ) {
				if ( $exclude || ! is_user_logged_in() ) {
					return $exclude;
				}

				$user = wp_get_current_user();
				if ( ! $user instanceof \WP_User ) {
					return $exclude;
				}

				$doublescale_roles = array_keys( self::get_roles() );
				if ( array_intersect( $doublescale_roles, (array) $user->roles ) ) {
					return true;
				}

				return $exclude;
			}
		);

		// WC's `WC_Admin::prevent_admin_access` redirects any user without
		// `edit_posts` / `manage_woocommerce` / `view_admin_dashboard` to
		// `/my-account/` on every admin pageload. CRM Manager has full
		// edit_posts via WP, but Support Agent / Support Manager (and any
		// future read-only CRM role) do not — they'd otherwise get bounced
		// straight back to the storefront. Short-circuit that filter for
		// every DoubleScale role.
		add_filter(
			'woocommerce_prevent_admin_access',
			static function ( $prevent ) {
				if ( ! $prevent || ! is_user_logged_in() ) {
					return $prevent;
				}

				$user = wp_get_current_user();
				if ( ! $user instanceof \WP_User ) {
					return $prevent;
				}

				$doublescale_roles = array_keys( self::get_roles() );
				if ( array_intersect( $doublescale_roles, (array) $user->roles ) ) {
					return false;
				}

				return $prevent;
			}
		);

		// Symmetric fix for WC's admin bar suppression. Same caps check as
		// {@see prevent_admin_access}, but applied to the toolbar that
		// shows site-wide at the top of every page. Without this, a Support
		// Agent / Manager sees no admin bar on the frontend even though
		// they have wp-admin access.
		add_filter(
			'show_admin_bar',
			static function ( $show ) {
				if ( $show || ! is_user_logged_in() ) {
					return $show;
				}

				$user = wp_get_current_user();
				if ( ! $user instanceof \WP_User ) {
					return $show;
				}

				$doublescale_roles = array_keys( self::get_roles() );
				if ( array_intersect( $doublescale_roles, (array) $user->roles ) ) {
					return true;
				}

				return $show;
			},
			999
		);
	}
}
