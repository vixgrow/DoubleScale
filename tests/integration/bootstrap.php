<?php
/**
 * PHPUnit bootstrap for the DoubleScale integration suite.
 *
 * Loads the WordPress core test library (installed via bin/install-wp-tests.sh),
 * hooks `muplugins_loaded` to require the plugin's main file, and force-enables
 * every toggleable module so each module's migrations run and its tables exist
 * before the first test.
 *
 * Required env vars:
 *   WP_TESTS_DIR — path to the WP core test lib (default: /tmp/wordpress-tests-lib)
 *
 * @package DoubleScale\Tests\Integration
 */

defined( 'ABSPATH' ) || true;

$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find {$_tests_dir}/includes/functions.php — did you run bin/install-wp-tests.sh?" . PHP_EOL;
	exit( 1 );
}

if ( ! is_file( $_tests_dir . '/wp-tests-config.php' ) ) {
	echo "Missing {$_tests_dir}/wp-tests-config.php" . PHP_EOL;
	echo 'WordPress integration tests need a DB config file in the test library directory.' . PHP_EOL;
	echo 'From this plugin root, run (adjust DB user/pass/host as needed):' . PHP_EOL;
	echo '  bash bin/install-wp-tests.sh wordpress_test root \'your_mysql_password\' 127.0.0.1 latest' . PHP_EOL;
	echo 'That script downloads the test suite and creates wp-tests-config.php from the official sample.' . PHP_EOL;
	echo 'If the suite is already there, copy the sample manually, then edit DB_* constants:' . PHP_EOL;
	echo "  curl -o \"{$_tests_dir}/wp-tests-config.php\" https://develop.svn.wordpress.org/trunk/wp-tests-config-sample.php" . PHP_EOL;
	exit( 1 );
}

require_once $_tests_dir . '/includes/functions.php';

/**
 * Force-enables every optional module before plugin boot so per-module
 * migrations run during activation. Without this, only the non-toggleable
 * tables (`contacts`, `activities`, `logs`) would exist, and module-specific
 * REST + service tests would fail on the first DB query.
 *
 * @return void
 */
function _doublescale_tests_enable_all_modules() {
	_doublescale_tests_activate_woocommerce();

	update_option(
		'doublescale_enabled_modules',
		array(
			'booking'     => true,
			'campaigns'   => true,
			'automations' => true,
			'emails'      => true,
			'smtp'        => true,
			'tracking'    => true,
			'support'     => true,
			// `sales` is the parent gate for `documents`; both must be on before
			// the plugin boots, or ModuleRegistry::boot() skips them and their
			// REST controllers never hook `rest_api_init` (every route 404s).
			'sales'       => true,
			'documents'   => true,
		)
	);
}

/**
 * Register WooCommerce as an active plugin so WordPress loads it itself.
 *
 * WooCommerce cannot simply be `require`d from `muplugins_loaded`: its Jetpack
 * autoloader calls wp_normalize_path() and inspects the active-plugin list
 * while resolving package paths, and bails out (returning early from
 * woocommerce.php) when loaded outside the normal plugin sequence. Putting it
 * in `active_plugins` lets wp-settings.php include it at the right moment.
 *
 * Optional by design: on a machine without WooCommerce the WC-backed tests skip
 * instead of failing, so the suite stays runnable everywhere.
 *
 * @return void
 */
function _doublescale_tests_activate_woocommerce() {
	if ( ! _doublescale_tests_woocommerce_file() ) {
		return;
	}

	$active = (array) get_option( 'active_plugins', array() );
	if ( ! in_array( 'woocommerce/woocommerce.php', $active, true ) ) {
		$active[] = 'woocommerce/woocommerce.php';
		update_option( 'active_plugins', $active );
	}
}

/**
 * Locate woocommerce.php.
 *
 * WP_PLUGIN_DIR points at the throwaway test install (/tmp/wordpress), not the
 * site this plugin lives in, so WooCommerce usually is not there. Fall back to
 * the sibling plugin directory of this repo — that is where a dev machine
 * actually has it installed.
 *
 * @return string|null Absolute path, or null when WooCommerce is unavailable.
 */
function _doublescale_tests_woocommerce_file() {
	$candidates = array(
		WP_PLUGIN_DIR . '/woocommerce/woocommerce.php',
		dirname( __DIR__, 3 ) . '/woocommerce/woocommerce.php',
	);

	foreach ( $candidates as $candidate ) {
		if ( is_readable( $candidate ) ) {
			return $candidate;
		}
	}

	return null;
}

/**
 * Bootstraps the plugin inside the test environment.
 *
 * @return void
 */
function _doublescale_tests_manually_load_plugin() {
	_doublescale_tests_enable_all_modules();

	$woocommerce = _doublescale_tests_woocommerce_file();
	if ( $woocommerce ) {
		require_once $woocommerce;
	}

	require dirname( __DIR__, 2 ) . '/doublescale.php';
}

/**
 * Install WooCommerce's tables once WP is loaded.
 *
 * WC_Install::install() is normally triggered by the activation hook, which
 * never fires here — without it wc_get_order()/wc_get_product() have no tables
 * to read and every WC-backed test errors on the first query.
 *
 * @return void
 */
function _doublescale_tests_install_woocommerce() {
	if ( ! class_exists( 'WC_Install' ) ) {
		return;
	}

	WC_Install::install();

	// Re-init the data stores against the freshly created tables.
	if ( function_exists( 'WC' ) && WC()->is_rest_api_request() === false ) {
		WC()->init();
	}
}

tests_add_filter( 'setup_theme', '_doublescale_tests_install_woocommerce' );

tests_add_filter( 'muplugins_loaded', '_doublescale_tests_manually_load_plugin' );

// Start the WordPress test environment. This brings in WP_UnitTestCase and friends.
require $_tests_dir . '/includes/bootstrap.php';

// Make sure the IntegrationTestCase base class is autoloadable.
require_once __DIR__ . '/IntegrationTestCase.php';
