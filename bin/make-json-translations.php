<?php
/**
 * Generate JED-format JSON translation files for the admin JS bundle.
 *
 * WordPress's wp_set_script_translations() loads a JSON file named:
 *   {domain}-{locale}-{md5}.json
 * where the MD5 is hash of the relative path to the registered script.
 *
 * This script generates one JSON file per registered script handle, each
 * containing ALL translated strings for the domain.
 *
 * Serving the full table to every handle is deliberate rather than a
 * limitation: strings live in ~19 content-hashed async chunks that are never
 * registered with WordPress, so there is no handle whose md5 could point at
 * them. Folding everything into each entry bundle's JSON is what makes
 * lazy-loaded routes (e.g. the booking calendar) translatable at all.
 *
 * Usage: php bin/make-json-translations.php [locale]
 *   e.g.: php bin/make-json-translations.php pt_BR
 *         php bin/make-json-translations.php   (processes all .po files)
 *
 * Saving a .po in Loco Translate also rebuilds these files automatically
 * via the loco_file_written hook.
 *
 * @package DoubleScale
 */

declare( strict_types=1 );

$root = dirname( __DIR__ );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', $root . '/' );
}

require_once $root . '/includes/I18n/JedJsonCompiler.php';

$lang_dir = $root . '/languages';
$domain   = \DoubleScale\I18n\JedJsonCompiler::DOMAIN;
$scripts  = \DoubleScale\I18n\JedJsonCompiler::free_scripts();

$locale_arg = isset( $argv[1] ) ? $argv[1] : null;

if ( $locale_arg ) {
	$po_files = array( $lang_dir . '/' . $domain . '-' . $locale_arg . '.po' );
} else {
	$po_files = glob( $lang_dir . '/' . $domain . '-*.po' );
}

if ( empty( $po_files ) ) {
	fprintf( STDERR, "No .po files found.\n" );
	exit( 1 );
}

$failed = false;
foreach ( $po_files as $po_file ) {
	if ( ! is_readable( $po_file ) ) {
		fprintf( STDERR, "File not found: %s\n", $po_file );
		$failed = true;
		continue;
	}

	$basename = basename( $po_file, '.po' );
	if ( ! preg_match( '/^' . preg_quote( $domain, '/' ) . '-(.+)$/', $basename, $m ) ) {
		continue;
	}
	$locale = $m[1];
	$count  = \DoubleScale\I18n\JedJsonCompiler::compile( $locale, $lang_dir, $scripts, array( $po_file ) );
	if ( $count < 1 ) {
		fprintf( STDERR, "No translated entries in %s\n", $po_file );
		$failed = true;
		continue;
	}
	foreach ( $scripts as $script ) {
		printf(
			"Created %s (%d strings) -> %s\n",
			$domain . '-' . $locale . '-' . md5( $script ) . '.json',
			$count,
			$script
		);
	}
}

if ( $failed ) {
	exit( 1 );
}
