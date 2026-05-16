<?php
/**
 * Database installation and legacy rename helpers.
 *
 * @package DoubleScale\Database
 */

namespace DoubleScale\Database;

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- transactional CRM/scheduler/campaign DB ops; persistent caching is impractical for write-heavy or per-request lookups (matches WooCommerce/FluentCRM precedent).

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

		MigrationRunner::run_all( self::migration_registry() );

		self::run_version_migrations();

		self::update_doublescale_version();

		delete_transient( 'doublescale_installing' );
	}

	private static function update_doublescale_version(): void {
		update_option( 'doublescale_version', DOUBLESCALE_VERSION );
	}

	private static function run_version_migrations(): void {
		$current_version = get_option( 'doublescale_version' );
		if ( ! $current_version ) {
			return;
		}

		do_action( 'doublescale_run_version_migrations', $current_version );
	}
}
