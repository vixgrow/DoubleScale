#!/usr/bin/env php
<?php
/**
 * Regenerate includes/includes-classmap.php from Composer’s classmap.
 *
 * Run after changing SMTP (or other classmap’d) files:
 *   composer dump-autoload -o
 *   php bin/generate-includes-classmap.php
 *
 * @package DoubleScale
 */

$root = dirname( __DIR__ );
$classmap_file = $root . '/vendor/composer/autoload_classmap.php';
if ( ! is_readable( $classmap_file ) ) {
	fwrite( STDERR, "Missing {$classmap_file}. Run: composer dump-autoload -o\n" );
	exit( 1 );
}

$map  = require $classmap_file;
$base = realpath( $root );
$out  = array();

foreach ( $map as $class => $path ) {
	if ( 0 !== strpos( $class, 'DoubleScale\\' ) ) {
		continue;
	}
	if ( 0 === strpos( $class, 'DoubleScale\\Tests\\' ) || 0 === strpos( $class, 'DoubleScale\\Vendor\\' ) ) {
		continue;
	}
	$real = realpath( $path );
	if ( ! $real || 0 !== strpos( $real, $base . '/includes/' ) ) {
		continue;
	}
	$out[ $class ] = ltrim( str_replace( $base, '', $real ), '/' );
}

ksort( $out );

$export = "<?php\n/**\n * Generated Composer classmap subset for DoubleScale\\* under includes/.\n *\n * Used when root vendor/ is not shipped (WordPress.org package). Regenerate with:\n *   composer dump-autoload -o && php bin/generate-includes-classmap.php\n *\n * @package DoubleScale\n */\n\ndefined( 'ABSPATH' ) || exit;\n\nreturn " . var_export( $out, true ) . ";\n";

$target = $root . '/includes/includes-classmap.php';
file_put_contents( $target, $export );
echo 'Wrote ' . count( $out ) . ' classes to includes/includes-classmap.php' . PHP_EOL;
