<?php
/**
 * Database installation and legacy rename helpers.
 *
 * @package DoubleScale\Database
 */

namespace DoubleScale\Database;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Container;
use DoubleScale\Core\CoreModule;
use DoubleScale\Core\Database\MigrationRunner;
use DoubleScale\Core\ModuleRegistry;

/**
 * Install / upgrade entry for DoubleScale (free).
 */
class Install {

	private static function migration_registry(): ModuleRegistry {
		$container = new Container();
		$registry  = new ModuleRegistry( $container );
		$registry->register( new CoreModule() );
		$registry->discover( DOUBLESCALE_PLUGIN_DIR . 'includes/Modules' );

		return $registry;
	}

	/**
	 * Ensure critical tables exist before the kernel boots (plugins_loaded runs before init).
	 */
	public static function ensure_db_ready(): void {
		global $wpdb;

		$critical = array(
			$wpdb->prefix . 'doublescale_contacts',
		);

		foreach ( $critical as $table ) {
			$found = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
			if ( $found !== $table ) {
				self::install();
				return;
			}
		}
	}

	public static function init(): void {
		add_action( 'init', array( __CLASS__, 'check_version' ), 5 );
	}

	public static function check_version(): void {
		$current_version = get_option( 'doublescale_version' );
		$plugin_version  = DOUBLESCALE_VERSION;

		if ( version_compare( (string) $current_version, $plugin_version, '<' ) ) {
			self::install();
			do_action( 'doublescale_updated' );
		}
	}

	/**
	 * @param bool $network_wide Network activation flag.
	 */
	public static function multisite_activate( $network_wide ): void {
		global $wpdb;

		if ( is_multisite() && $network_wide ) {
			$blog_ids = $wpdb->get_col( "SELECT blog_id FROM $wpdb->blogs" );

			foreach ( $blog_ids as $blog_id ) {
				switch_to_blog( $blog_id );
				self::install();
				restore_current_blog();
			}
		} else {
			self::install();
		}
	}

	/**
	 * @param int $blog_id New blog ID.
	 */
	public static function activate_new_site( $blog_id ): void {
		if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		if ( is_plugin_active_for_network( plugin_basename( DOUBLESCALE_PLUGIN_FILE ) ) ) {
			switch_to_blog( $blog_id );
			self::install();
			restore_current_blog();
		}
	}

	public static function install(): void {
		if ( 'yes' === get_transient( 'doublescale_installing' ) ) {
			return;
		}

		set_transient( 'doublescale_installing', 'yes', MINUTE_IN_SECONDS * 10 );

		self::migrate_legacy_tables();
		MigrationRunner::run_all( self::migration_registry() );
		self::migrate_action_scheduler_groups();
		self::migrate_settings_option();
		self::migrate_capabilities();

		self::run_version_migrations();

		self::update_doublescale_version();

		delete_transient( 'doublescale_installing' );
	}

	private static function update_doublescale_version(): void {
		update_option( 'doublescale_version', DOUBLESCALE_VERSION );
	}

	/**
	 * Rename wp_{prefix}doublescale_* tables to wp_{prefix}doublescale_* when the target is absent.
	 */
	public static function migrate_legacy_tables(): void {
		if ( get_option( 'doublescale_legacy_renamed' ) ) {
			return;
		}

		global $wpdb;

		$pattern = $wpdb->esc_like( $wpdb->prefix . 'doublescale_' ) . '%';
		$tables  = $wpdb->get_col( $wpdb->prepare( 'SHOW TABLES LIKE %s', $pattern ) );

		foreach ( (array) $tables as $old_table ) {
			$new_table = str_replace( $wpdb->prefix . 'doublescale_', $wpdb->prefix . 'doublescale_', $old_table );
			$exists    = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $new_table ) );
			if ( $exists === $new_table ) {
				continue;
			}
			$ok = $wpdb->query( 'RENAME TABLE `' . esc_sql( $old_table ) . '` TO `' . esc_sql( $new_table ) . '`' );
			if ( false === $ok ) {
				continue;
			}
		}

		update_option( 'doublescale_legacy_renamed', 1, false );
	}

	/**
	 * Dev-only inverse of {@see migrate_legacy_tables()}.
	 */
	public static function rollback_legacy_tables(): void {
		if ( ! defined( 'DOUBLESCALE_DEV_ALLOW_LEGACY_TABLE_ROLLBACK' ) || ! DOUBLESCALE_DEV_ALLOW_LEGACY_TABLE_ROLLBACK ) {
			return;
		}
		if ( ! get_option( 'doublescale_legacy_renamed' ) ) {
			return;
		}

		global $wpdb;

		$pattern = $wpdb->esc_like( $wpdb->prefix . 'doublescale_' ) . '%';
		$tables  = $wpdb->get_col( $wpdb->prepare( 'SHOW TABLES LIKE %s', $pattern ) );

		foreach ( (array) $tables as $new_table ) {
			$old_table = str_replace( $wpdb->prefix . 'doublescale_', $wpdb->prefix . 'doublescale_', $new_table );
			$exists    = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $old_table ) );
			if ( $exists === $old_table ) {
				continue;
			}
			$wpdb->query( 'RENAME TABLE `' . esc_sql( $new_table ) . '` TO `' . esc_sql( $old_table ) . '`' );
		}

		delete_option( 'doublescale_legacy_renamed' );
	}

	public static function migrate_action_scheduler_groups(): void {
		global $wpdb;

		$groups = $wpdb->prefix . 'actionscheduler_groups';
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$found = $wpdb->get_var( "SHOW TABLES LIKE '{$groups}'" );
		if ( $found !== $groups ) {
			return;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "UPDATE {$groups} SET slug = REPLACE(slug, 'doublescale_', 'doublescale_') WHERE slug LIKE 'doublescale\_%'" );
	}

	public static function migrate_settings_option(): void {
		if ( get_option( 'doublescale_settings_migrated' ) ) {
			return;
		}

		$legacy = get_option( 'doublescale_settings', '__DOUBLESCALE_NO_LEGACY_SETTINGS__' );
		if ( '__DOUBLESCALE_NO_LEGACY_SETTINGS__' !== $legacy ) {
			$missing = '__DOUBLESCALE_SENTINEL__';
			if ( $missing === get_option( 'doublescale_settings', $missing ) ) {
				update_option( 'doublescale_settings', $legacy );
			}
		}

		update_option( 'doublescale_settings_migrated', 1, false );
	}

	public static function migrate_capabilities(): void {
		if ( get_option( 'doublescale_caps_migrated' ) ) {
			return;
		}

		global $wpdb;

		if ( function_exists( 'wp_roles' ) ) {
			foreach ( wp_roles()->roles as $role_name => $_role ) {
				$role = get_role( $role_name );
				if ( ! $role ) {
					continue;
				}
				foreach ( array_keys( $role->capabilities ) as $cap ) {
					if ( 0 === strpos( (string) $cap, 'doublescale_' ) ) {
						$new_cap = 'doublescale_' . substr( (string) $cap, strlen( 'doublescale_' ) );
						$role->remove_cap( $cap );
						$role->add_cap( $new_cap );
					}
				}
			}
		}

		$meta_key = $wpdb->prefix . 'capabilities';
		$user_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = %s",
				$meta_key
			)
		);

		foreach ( (array) $user_ids as $user_id ) {
			$caps = get_user_meta( (int) $user_id, $meta_key, true );
			if ( ! is_array( $caps ) ) {
				continue;
			}
			$new_caps = array();
			$changed  = false;
			foreach ( $caps as $cap => $grant ) {
				if ( 0 === strpos( (string) $cap, 'doublescale_' ) ) {
					$new_cap             = 'doublescale_' . substr( (string) $cap, strlen( 'doublescale_' ) );
					$new_caps[ $new_cap ] = $grant;
					$changed             = true;
				} else {
					$new_caps[ $cap ] = $grant;
				}
			}
			if ( $changed ) {
				update_user_meta( (int) $user_id, $meta_key, $new_caps );
			}
		}

		update_option( 'doublescale_caps_migrated', 1, false );
	}

	private static function run_version_migrations(): void {
		$current_version = get_option( 'doublescale_version' );
		if ( ! $current_version ) {
			return;
		}

		do_action( 'doublescale_run_version_migrations', $current_version );
	}
}
