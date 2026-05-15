<?php
/**
 * Plugin lifecycle: constants, dependency loading, activation, deactivation,
 * and the deferred kernel bootstrap. Keeps the main plugin file paper-thin.
 *
 * @package DoubleScale
 */

namespace DoubleScale;

defined( 'ABSPATH' ) || exit;

final class Lifecycle {

	/**
	 * Action Scheduler / WP-Cron hooks cleared on deactivation.
	 */
	private const SCHEDULED_HOOKS = array(
		'doublescale_email_campaigns',
		'doublescale_email_sequences',
		'doublescale_daily3',
		'doublescale_daily4',
		'doublescale_cleanup_page_visits',
	);

	/**
	 * Entry point. Called once from the main plugin file.
	 */
	public static function boot( string $plugin_file ): void {
		self::define_constants( $plugin_file );
		self::load_dependencies();
		self::register_hooks( $plugin_file );
	}

	/**
	 * Define plugin-wide constants.
	 */
	private static function define_constants( string $plugin_file ): void {
		$defaults = array(
			'DOUBLESCALE_PLUGIN_FILE'   => $plugin_file,
			'DOUBLESCALE_VERSION'       => '1.0.0',
			'DOUBLESCALE_PLUGIN_DIR'    => plugin_dir_path( $plugin_file ),
			'DOUBLESCALE_PLUGIN_URL'    => plugin_dir_url( $plugin_file ),
			'DOUBLESCALE_PLUGIN_PATH'   => plugin_basename( $plugin_file ),
			'DOUBLESCALE_PRO_PRICE_URL' => 'https://doublescale.io/pricing',
		);

		foreach ( $defaults as $name => $value ) {
			if ( ! defined( $name ) ) {
				define( $name, $value );
			}
		}
	}

	/**
	 * Require Composer + custom autoloaders.
	 */
	private static function load_dependencies(): void {
		$dir = DOUBLESCALE_PLUGIN_DIR;

		require_once $dir . 'includes/safe-redirect.php';
		require_once $dir . 'dependencies/libraries/load.php';
		require_once $dir . 'dependencies/vendor/autoload.php';

		if ( file_exists( $dir . 'vendor/autoload.php' ) ) {
			require_once $dir . 'vendor/autoload.php';
		}

		if ( file_exists( $dir . 'includes/Autoload.php' ) ) {
			require_once $dir . 'includes/Autoload.php';
		}
	}

	/**
	 * Register WordPress lifecycle hooks.
	 */
	private static function register_hooks( string $plugin_file ): void {
		if ( is_multisite() ) {
			register_activation_hook( $plugin_file, array( __CLASS__, 'on_multisite_activate' ) );
			add_action( 'wpmu_new_blog', array( __CLASS__, 'on_new_blog' ) );
		} else {
			register_activation_hook( $plugin_file, array( __CLASS__, 'on_activate' ) );
		}

		register_deactivation_hook( $plugin_file, array( __CLASS__, 'on_deactivate' ) );

		add_action( 'plugins_loaded', array( __CLASS__, 'on_plugins_loaded' ), 5 );
	}

	/**
	 * Single-site activation.
	 */
	public static function on_activate(): void {
		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::install();
		}
	}

	/**
	 * Multisite network activation.
	 */
	public static function on_multisite_activate(): void {
		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::multisite_activate();
		}
	}

	/**
	 * New blog hook on multisite.
	 *
	 * @param int $blog_id
	 */
	public static function on_new_blog( $blog_id ): void {
		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::activate_new_site( $blog_id );
		}
	}

	/**
	 * Deactivation: clear scheduled hooks owned by this plugin.
	 */
	public static function on_deactivate(): void {
		foreach ( self::SCHEDULED_HOOKS as $hook ) {
			wp_clear_scheduled_hook( $hook );
		}
	}

	/**
	 * Boot the modular kernel after WordPress finishes loading plugins.
	 */
	public static function on_plugins_loaded(): void {
		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::ensure_db_ready();
		}

		\DoubleScale\Core\Bootstrap::init();

		/**
		 * Fires after the DoubleScale (free) modular stack is fully initialized.
		 */
		do_action( 'doublescale_loaded' );
	}
}
