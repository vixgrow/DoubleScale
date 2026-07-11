<?php
/**
 * Generate JED-format JSON translation files for the admin JS bundle.
 *
 * WordPress's wp_set_script_translations() loads a JSON file named:
 *   {domain}-{locale}-{md5}.json
 * where the MD5 is hash of the relative path to the registered script.
 *
 * Since our custom make-pot.php doesn't emit #: file references, `wp i18n
 * make-json` can't split strings by source file. This script generates a
 * single JSON file containing ALL translated strings for the main admin
 * bundle (build/client/index.js).
 *
 * Usage: php bin/make-json-translations.php [locale]
 *   e.g.: php bin/make-json-translations.php pt_BR
 *         php bin/make-json-translations.php   (processes all .po files)
 *
 * @package DoubleScale
 */

declare( strict_types=1 );

$root     = dirname( __DIR__ );
$lang_dir = $root . '/languages';
$domain   = 'doublescale';
$script   = 'build/client/index.js';
$hash     = md5( $script );

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

foreach ( $po_files as $po_file ) {
	if ( ! file_exists( $po_file ) ) {
		fprintf( STDERR, "File not found: %s\n", $po_file );
		continue;
	}

	$basename = basename( $po_file, '.po' );
	if ( ! preg_match( '/^' . preg_quote( $domain, '/' ) . '-(.+)$/', $basename, $m ) ) {
		continue;
	}
	$locale = $m[1];

	$entries = parse_po_file( $po_file );
	if ( empty( $entries ) ) {
		fprintf( STDERR, "No translated entries in %s\n", $po_file );
		continue;
	}

	$header = extract_po_header( $po_file );

	$messages = array();
	foreach ( $entries as $entry ) {
		if ( '' === $entry['msgid'] || '' === $entry['msgstr'] ) {
			continue;
		}
		$key = $entry['msgid'];
		if ( ! empty( $entry['msgctxt'] ) ) {
			$key = $entry['msgctxt'] . "\x04" . $key;
		}

		if ( isset( $entry['msgid_plural'] ) ) {
			$messages[ $key ] = array( $entry['msgid_plural'], ...$entry['msgstr_plural'] );
		} else {
			$messages[ $key ] = array( $entry['msgstr'] );
		}
	}

	$jed = array(
		'translation-revision-date' => $header['PO-Revision-Date'] ?? gmdate( 'Y-m-d H:i' ) . '+0000',
		'generator'                 => 'doublescale/bin/make-json-translations',
		'source'                    => $script,
		'domain'                    => 'messages',
		'locale_data'               => array(
			'messages' => array_merge(
				array( '' => array( 'domain' => 'messages', 'lang' => str_replace( '_', '-', $locale ) ) ),
				$messages
			),
		),
	);

	$out_file = $lang_dir . '/' . $domain . '-' . $locale . '-' . $hash . '.json';
	file_put_contents( $out_file, json_encode( $jed, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) );
	printf( "Created %s (%d strings)\n", basename( $out_file ), count( $messages ) );
}

/**
 * Parse a .po file into an array of entries.
 */
function parse_po_file( string $path ): array {
	$content = file_get_contents( $path );
	$lines   = explode( "\n", $content );

	$entries = array();
	$current = array(
		'msgctxt'       => '',
		'msgid'         => '',
		'msgid_plural'  => null,
		'msgstr'        => '',
		'msgstr_plural' => array(),
	);
	$state   = '';

	foreach ( $lines as $line ) {
		$line = rtrim( $line, "\r" );

		if ( '' === $line ) {
			if ( '' !== $current['msgid'] || '' !== $current['msgstr'] ) {
				$entries[] = $current;
			}
			$current = array(
				'msgctxt'       => '',
				'msgid'         => '',
				'msgid_plural'  => null,
				'msgstr'        => '',
				'msgstr_plural' => array(),
			);
			$state = '';
			continue;
		}

		if ( '#' === $line[0] ) {
			continue;
		}

		if ( preg_match( '/^msgctxt\s+"(.*)"$/', $line, $m ) ) {
			$current['msgctxt'] = stripcslashes( $m[1] );
			$state              = 'msgctxt';
		} elseif ( preg_match( '/^msgid\s+"(.*)"$/', $line, $m ) ) {
			$current['msgid'] = stripcslashes( $m[1] );
			$state            = 'msgid';
		} elseif ( preg_match( '/^msgid_plural\s+"(.*)"$/', $line, $m ) ) {
			$current['msgid_plural'] = stripcslashes( $m[1] );
			$state                   = 'msgid_plural';
		} elseif ( preg_match( '/^msgstr\s+"(.*)"$/', $line, $m ) ) {
			$current['msgstr'] = stripcslashes( $m[1] );
			$state             = 'msgstr';
		} elseif ( preg_match( '/^msgstr\[(\d+)\]\s+"(.*)"$/', $line, $m ) ) {
			$current['msgstr_plural'][ (int) $m[1] ] = stripcslashes( $m[2] );
			$state                                   = 'msgstr_plural_' . $m[1];
		} elseif ( preg_match( '/^"(.*)"$/', $line, $m ) ) {
			$value = stripcslashes( $m[1] );
			if ( 'msgctxt' === $state ) {
				$current['msgctxt'] .= $value;
			} elseif ( 'msgid' === $state ) {
				$current['msgid'] .= $value;
			} elseif ( 'msgid_plural' === $state ) {
				$current['msgid_plural'] .= $value;
			} elseif ( 'msgstr' === $state ) {
				$current['msgstr'] .= $value;
			} elseif ( str_starts_with( $state, 'msgstr_plural_' ) ) {
				$idx = (int) substr( $state, 14 );
				$current['msgstr_plural'][ $idx ] = ( $current['msgstr_plural'][ $idx ] ?? '' ) . $value;
			}
		}
	}

	if ( '' !== $current['msgid'] || '' !== $current['msgstr'] ) {
		$entries[] = $current;
	}

	return $entries;
}

/**
 * Extract PO header fields.
 */
function extract_po_header( string $path ): array {
	$content = file_get_contents( $path );
	$headers = array();

	if ( preg_match( '/^msgid ""\nmsgstr "(.*?)"\n\n/ms', $content, $m ) ) {
		$raw = stripcslashes( $m[1] );
		foreach ( explode( "\n", $raw ) as $line ) {
			if ( strpos( $line, ':' ) !== false ) {
				list( $key, $val ) = explode( ':', $line, 2 );
				$headers[ trim( $key ) ] = trim( str_replace( '\n', '', $val ) );
			}
		}
	}

	return $headers;
}
