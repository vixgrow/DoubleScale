<?php
/**
 * Extra WordPress stubs for {@see \DoubleScale\Tests\FreeStandaloneActivationTest} only.
 *
 * @package DoubleScale\Tests
 */

defined( 'ABSPATH' ) || exit;

$GLOBALS['__doublescale_phpunit_install_dbdelta'] = array();

if ( ! function_exists( 'dbDelta' ) ) {
	/**
	 * @param string|string[] $queries
	 * @return array<string, mixed>
	 */
	function dbDelta( $queries ) {
		$GLOBALS['__doublescale_phpunit_install_dbdelta'][] = $queries;
		return array();
	}
}

if ( ! function_exists( 'current_time' ) ) {
	/**
	 * @param string $type
	 * @param bool   $gmt
	 * @return int|string
	 */
	function current_time( $type = 'mysql', $gmt = false ) {
		unset( $gmt );
		return 'mysql' === $type ? '2000-01-01 00:00:00' : time();
	}
}

if ( ! function_exists( 'esc_sql' ) ) {
	/**
	 * @param string $sql
	 * @return string
	 */
	function esc_sql( $sql ) {
		return str_replace( array( "\0", "\r", "\n" ), '', (string) $sql );
	}
}

if ( ! function_exists( 'maybe_serialize' ) ) {
	/**
	 * @param mixed $data
	 * @return string
	 */
	function maybe_serialize( $data ) {
		return is_scalar( $data ) ? (string) $data : serialize( $data );
	}
}
