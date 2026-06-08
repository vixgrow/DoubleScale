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
		)
	);
}

/**
 * Bootstraps the plugin inside the test environment.
 *
 * @return void
 */
function _doublescale_tests_manually_load_plugin() {
	_doublescale_tests_enable_all_modules();
	require dirname( __DIR__, 2 ) . '/doublescale.php';
}

tests_add_filter( 'muplugins_loaded', '_doublescale_tests_manually_load_plugin' );

// Start the WordPress test environment. This brings in WP_UnitTestCase and friends.
require $_tests_dir . '/includes/bootstrap.php';

// Make sure the IntegrationTestCase base class is autoloadable.
require_once __DIR__ . '/IntegrationTestCase.php';
