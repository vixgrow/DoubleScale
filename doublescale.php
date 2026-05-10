<?php
/**
 * Plugin Name:       DoubleScale
 * Plugin URI:        https://www.doublescale.io/
 * Description:       DoubleScale (free) — modular CRM core. Smoke-test this entry during migration; production uses this after cutover from DoubleScale.
 * Version:           0.1.1-alpha
 * Author:            doublescale.io
 * Author URI:        https://www.doublescale.io
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       doublescale
 * Requires at least: 5.8
 * Requires PHP:      7.4
 *
 * @package DoubleScale
 */

defined( 'ABSPATH' ) || exit;

if ( defined( 'DOUBLESCALE_FREE_PLUGIN_LOADED' ) ) {
	return;
}
define( 'DOUBLESCALE_FREE_PLUGIN_LOADED', true );

if ( ! defined( 'DOUBLESCALE_PLUGIN_FILE' ) ) {
	define( 'DOUBLESCALE_PLUGIN_FILE', __FILE__ );
}
if ( ! defined( 'DOUBLESCALE_VERSION' ) ) {
	define( 'DOUBLESCALE_VERSION', '0.1.1-alpha' );
}
if ( ! defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
	define( 'DOUBLESCALE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}
if ( ! defined( 'DOUBLESCALE_PLUGIN_URL' ) ) {
	define( 'DOUBLESCALE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
}
if ( ! defined( 'DOUBLESCALE_PLUGIN_PATH' ) ) {
	define( 'DOUBLESCALE_PLUGIN_PATH', plugin_basename( __FILE__ ) );
}
if ( ! defined( 'DOUBLESCALE_PRO_PRICE_URL' ) ) {
	define( 'DOUBLESCALE_PRO_PRICE_URL', 'https://doublescale.io/pricing' );
}

require_once DOUBLESCALE_PLUGIN_DIR . 'dependencies/libraries/load.php';
require_once DOUBLESCALE_PLUGIN_DIR . 'dependencies/vendor/autoload.php';

if ( file_exists( DOUBLESCALE_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once DOUBLESCALE_PLUGIN_DIR . 'vendor/autoload.php';
}

if ( file_exists( DOUBLESCALE_PLUGIN_DIR . 'includes/Autoload.php' ) ) {
	require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Autoload.php';
}

if ( is_multisite() ) {
	register_activation_hook( __FILE__, array( DoubleScale\Database\Install::class, 'multisite_activate' ) );
	add_action( 'wpmu_new_blog', array( DoubleScale\Database\Install::class, 'activate_new_site' ) );
} else {
	register_activation_hook( __FILE__, array( DoubleScale\Database\Install::class, 'install' ) );
}

register_deactivation_hook( __FILE__, 'doublescale_deactivate' );

doublescale_bootstrap_register();

/**
 * Register the modular bootstrap on plugins_loaded.
 *
 * @return void
 */
function doublescale_bootstrap_register() {
	add_action(
		'plugins_loaded',
		static function () {
			if ( class_exists( DoubleScale\Database\Install::class ) ) {
				DoubleScale\Database\Install::ensure_db_ready();
			}

			if ( class_exists( DoubleScale\Core\HookShim::class ) ) {
				DoubleScale\Core\HookShim::register();
			}

			DoubleScale\Core\Bootstrap::init();

			/**
			 * Fires after DoubleScale (free) modular stack is initialized.
			 */
			do_action( 'doublescale_loaded' );
		},
		5
	);
}

/**
 * Deactivation: clear scheduled hooks using doublescale_* Action Scheduler groups.
 *
 * @return void
 */
function doublescale_deactivate() {
	wp_clear_scheduled_hook( 'doublescale_email_campaigns' );
	wp_clear_scheduled_hook( 'doublescale_email_sequences' );
	wp_clear_scheduled_hook( 'doublescale_daily3' );
	wp_clear_scheduled_hook( 'doublescale_daily4' );
	wp_clear_scheduled_hook( 'doublescale_cleanup_page_visits' );
}
