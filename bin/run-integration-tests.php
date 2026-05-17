#!/usr/bin/env php
<?php
/**
 * Runs the PHPUnit integration suite when the WordPress test library is present.
 *
 * Used by Composer `test:integration:maybe` so `test:all` does not fail on machines
 * that have not run {@see bin/install-wp-tests.sh}. Use `composer test:integration`
 * for a strict run (exits 1 if the test library is missing).
 *
 * @package DoubleScale
 */

declare( strict_types = 1 );

$plugin_root = dirname( __DIR__ );
$_tests_dir   = getenv( 'WP_TESTS_DIR' );

if ( ! is_string( $_tests_dir ) || '' === $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

$marker = $_tests_dir . '/includes/functions.php';
if ( ! is_file( $marker ) ) {
	fwrite(
		STDERR,
		"[integration] Skipping: WordPress test library not found at {$_tests_dir}\n"
		. "[integration] Set WP_TESTS_DIR or run: bash bin/install-wp-tests.sh\n"
	);
	exit( 0 );
}

$phpunit = $plugin_root . '/vendor/bin/phpunit';
if ( ! is_file( $phpunit ) ) {
	fwrite( STDERR, "[integration] PHPUnit not found at {$phpunit}\n" );
	exit( 1 );
}

$bootstrap = $plugin_root . '/tests/integration/bootstrap.php';
$cmd       = escapeshellarg( PHP_BINARY ) . ' '
	. escapeshellarg( $phpunit ) . ' '
	. '--bootstrap ' . escapeshellarg( $bootstrap ) . ' '
	. '--testsuite integration';

passthru( $cmd, $exit_code );
exit( is_int( $exit_code ) ? $exit_code : 1 );
