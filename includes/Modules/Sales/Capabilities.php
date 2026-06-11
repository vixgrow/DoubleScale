<?php
/**
 * Sales module capabilities.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales;

defined( 'ABSPATH' ) || exit;

use WP_Roles;
use WP_User;
use DoubleScale\Core\UserRoles\UserRoles;

/**
 * Capabilities helper for the Sales module.
 */
class Capabilities {

	private const CAPS_SYNC_VERSION = '2026-06-10-sales-v1';

	/**
	 * @return string[]
	 */
	public static function get_sales_capability_slugs(): array {
		return array(
			'doublescale_view_sales',
			'doublescale_manage_all_sales',
			'doublescale_manage_own_sales',
		);
	}

	/**
	 * @return bool
	 */
	public static function current_user_can( string $capability ): bool {
		if ( is_multisite() && is_super_admin() ) {
			return true;
		}
		return current_user_can( $capability );
	}

	/**
	 * @return bool
	 */
	public static function can_view_sales(): bool {
		return self::current_user_can( 'doublescale_view_sales' )
			|| self::current_user_can( 'doublescale_manage_all_sales' )
			|| self::current_user_can( 'doublescale_manage_own_sales' )
			|| self::current_user_can( 'doublescale_manage' );
	}

	/**
	 * @return bool
	 */
	public static function can_manage_all_sales(): bool {
		return self::current_user_can( 'doublescale_manage_all_sales' )
			|| self::current_user_can( 'doublescale_manage' );
	}

	/**
	 * @return array<string, bool>
	 */
	public static function get_role_capability_map(): array {
		return array(
			UserRoles::SALES_MANAGER => array(
				'doublescale_view_sales'       => true,
				'doublescale_manage_all_sales' => true,
			),
			UserRoles::SALES_REP => array(
				'doublescale_view_sales'       => true,
				'doublescale_manage_own_sales' => true,
			),
			UserRoles::CRM_MANAGER => array(
				'doublescale_view_sales'       => true,
				'doublescale_manage_all_sales' => true,
			),
		);
	}

	/**
	 * @return void
	 */
	public static function sync_capabilities_for_user_roles(): void {
		$stored = get_option( 'doublescale_sales_caps_sync_version', '' );
		if ( self::CAPS_SYNC_VERSION === $stored ) {
			return;
		}

		$roles = new WP_Roles();
		foreach ( self::get_role_capability_map() as $role_slug => $caps ) {
			$role = $roles->get_role( $role_slug );
			if ( ! $role ) {
				continue;
			}
			foreach ( $caps as $cap => $grant ) {
				if ( $grant ) {
					$role->add_cap( $cap, true );
				} else {
					$role->remove_cap( $cap );
				}
			}
		}

		$admin_role = get_role( 'administrator' );
		if ( $admin_role ) {
			foreach ( self::get_sales_capability_slugs() as $cap ) {
				$admin_role->add_cap( $cap, true );
			}
		}

		update_option( 'doublescale_sales_caps_sync_version', self::CAPS_SYNC_VERSION );
	}

	/**
	 * @return void
	 */
	public static function ensure_capabilities_synced(): void {
		self::sync_capabilities_for_user_roles();
	}

	/**
	 * @param int $user_id User id.
	 * @return bool
	 */
	public static function user_can_manage_record( int $user_id, ?int $assigned_user_id ): bool {
		if ( self::can_manage_all_sales() ) {
			return true;
		}
		if ( ! self::current_user_can( 'doublescale_manage_own_sales' ) ) {
			return false;
		}
		return (int) $assigned_user_id === $user_id;
	}
}
