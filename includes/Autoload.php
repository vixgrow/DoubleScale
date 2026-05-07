<?php
/**
 * PSR-4 autoload fallback for DoubleScale\* (free plugin).
 *
 * Prefer Composer autoload. Mapping: DoubleScale\Foo\Bar -> includes/Foo/Bar.php
 *
 * @package DoubleScale
 */

namespace DoubleScale;

defined( 'ABSPATH' ) || exit;

spl_autoload_register(
	static function ( $class ) {
		$prefix = 'DoubleScale\\';
		if ( strpos( $class, $prefix ) !== 0 ) {
			return;
		}

		$relative = substr( $class, strlen( $prefix ) );
		$path     = __DIR__ . '/' . str_replace( '\\', '/', $relative ) . '.php';
		if ( is_file( $path ) ) {
			require_once $path;
		}
	}
);
