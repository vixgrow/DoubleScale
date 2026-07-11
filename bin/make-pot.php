<?php
/**
 * Generate languages/doublescale.pot from PHP and JS/TS sources.
 *
 * Usage: php bin/make-pot.php
 *
 * @package DoubleScale
 */

declare( strict_types=1 );

$root = dirname( __DIR__ );
$out  = $root . '/languages/doublescale.pot';

$exclude_dirs = array(
	'node_modules',
	'vendor',
	'dependencies',
	'build',
	'dist',
	'tests',
	'phpunit',
	'.git',
);

$strings = array();

$scan_dirs = array(
	$root . '/includes',
	$root . '/src',
);

$files = array( $root . '/doublescale.php' );
foreach ( $scan_dirs as $dir ) {
	if ( ! is_dir( $dir ) ) {
		continue;
	}
	$iterator = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS )
	);
	foreach ( $iterator as $file ) {
		if ( ! $file->isFile() ) {
			continue;
		}
		$path = $file->getPathname();
		foreach ( $exclude_dirs as $excluded ) {
			if ( false !== strpos( $path, DIRECTORY_SEPARATOR . $excluded . DIRECTORY_SEPARATOR ) ) {
				continue 2;
			}
		}
		$ext = strtolower( $file->getExtension() );
		if ( ! in_array( $ext, array( 'php', 'js', 'jsx', 'ts', 'tsx' ), true ) ) {
			continue;
		}
		$files[] = $path;
	}
}

$patterns = array(
	'/(?:__|_e|esc_html__|esc_attr__|esc_html_e|esc_attr_e)\(\s*([\'"])(?:\\\\.|(?!\1)[^\\\\])*\1\s*,\s*[\'"]doublescale[\'"]\s*\)/',
	'/_n\(\s*([\'"])(?:\\\\.|(?!\1)[^\\\\])*\1\s*,\s*([\'"])(?:\\\\.|(?!\2)[^\\\\])*\2\s*,\s*[^,]+,\s*[\'"]doublescale[\'"]\s*\)/',
	'/_x\(\s*([\'"])(?:\\\\.|(?!\1)[^\\\\])*\1\s*,\s*([\'"])(?:\\\\.|(?!\2)[^\\\\])*\2\s*,\s*[\'"]doublescale[\'"]\s*\)/',
	'/\b__\(\s*([\'"])(?:\\\\.|(?!\1)[^\\\\])*\1\s*,\s*[\'"]doublescale[\'"]\s*\)/',
);

foreach ( $files as $file ) {
	$contents = file_get_contents( $file );
	if ( false === $contents ) {
		continue;
	}
	foreach ( $patterns as $pattern ) {
		if ( ! preg_match_all( $pattern, $contents, $matches, PREG_SET_ORDER ) ) {
			continue;
		}
		foreach ( $matches as $match ) {
			$raw = $match[0];
			if ( ! preg_match( '/([\'"])(?:\\\\.|(?!\\1)[^\\\\])*\1/', $raw, $msg ) ) {
				continue;
			}
			$string = stripcslashes( substr( $msg[0], 1, -1 ) );
			if ( '' === $string || is_merge_tag_only_string( $string ) ) {
				continue;
			}
			$strings[ $string ] = true;
		}
	}
}

ksort( $strings, SORT_NATURAL | SORT_FLAG_CASE );

if ( ! is_dir( dirname( $out ) ) ) {
	mkdir( dirname( $out ), 0755, true );
}

$pot  = "# Copyright (C) " . gmdate( 'Y' ) . " DoubleScale\n";
$pot .= "# This file is distributed under the same license as the DoubleScale plugin.\n";
$pot .= "msgid \"\"\n";
$pot .= "msgstr \"\"\n";
$pot .= "\"Project-Id-Version: DoubleScale " . extract_version( $root ) . "\\n\"\n";
$pot .= "\"Report-Msgid-Bugs-To: https://wordpress.org/support/plugin/doublescale/\\n\"\n";
$pot .= "\"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n\"\n";
$pot .= "\"Language-Team: LANGUAGE <LL@li.org>\\n\"\n";
$pot .= "\"MIME-Version: 1.0\\n\"\n";
$pot .= "\"Content-Type: text/plain; charset=UTF-8\\n\"\n";
$pot .= "\"Content-Transfer-Encoding: 8bit\\n\"\n";
$pot .= "\"X-Domain: doublescale\\n\"\n\n";

foreach ( array_keys( $strings ) as $string ) {
	$pot .= 'msgid "' . po_escape( (string) $string ) . "\"\n";
	$pot .= "msgstr \"\"\n\n";
}

file_put_contents( $out, $pot );

echo 'Generated ' . $out . ' with ' . count( $strings ) . " strings.\n";

/**
 * @param string $root Plugin root.
 */
function extract_version( string $root ): string {
	$main = $root . '/doublescale.php';
	if ( ! is_readable( $main ) ) {
		return '0.0.0';
	}
	if ( preg_match( '/^\s*\*\s*Version:\s*([^\s]+)/m', (string) file_get_contents( $main ), $m ) ) {
		return $m[1];
	}
	return '0.0.0';
}

/**
 * @param string $string Message id.
 */
function po_escape( string $string ): string {
	return str_replace( array( '\\', '"', "\n", "\r", "\t" ), array( '\\\\', '\\"', '\\n', '', '\\t' ), $string );
}

/**
 * Skip merge-tag placeholders and templates with no human-readable text.
 *
 * @param string $string Candidate msgid.
 */
function is_merge_tag_only_string( string $string ): bool {
	if ( preg_match( '/^\{\{[^{}]+\}\}$/', $string ) ) {
		return true;
	}

	$without_tags = preg_replace( '/\{\{[^{}]+\}\}/', '', $string );
	if ( ! is_string( $without_tags ) ) {
		return false;
	}

	// After removing merge tags, ignore whitespace and punctuation only.
	return '' === preg_replace( '/[\s\-–—:|,.\'"#©&]+/u', '', $without_tags );
}
