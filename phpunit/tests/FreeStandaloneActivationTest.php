<?php
/**
 * {@see \DoubleScale\Database\Install::install()} against a mocked {@see $wpdb} — no MySQL required.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use DoubleScale\Database\Install;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__ ) . '/install-test-stubs.php';

/**
 * Captures SQL for Install / MigrationRunner without a real database.
 */
final class FreeStandaloneActivationTest_WpdbMock {

	/** @var string */
	public $prefix = 'wp_';

	/** @var list<string> */
	public $queries = array();

	/** @var array<string, true> key "module|migration" */
	public $migration_keys = array();

	public function esc_like( $text ) {
		return addcslashes( (string) $text, '_%' );
	}

	/**
	 * @param string $query
	 * @param mixed  ...$args
	 * @return string
	 */
	public function prepare( $query, ...$args ) {
		$out = (string) $query;
		foreach ( $args as $arg ) {
			if ( is_int( $arg ) || is_float( $arg ) ) {
				$out = preg_replace( '/%d/', (string) (int) $arg, $out, 1 );
			} else {
				$out = preg_replace( '/%s/', "'" . esc_sql( (string) $arg ) . "'", $out, 1 );
			}
		}
		return $out;
	}

	/**
	 * @param string|null $query
	 * @param int         $x
	 * @param int         $y
	 * @return string|null
	 */
	public function get_var( $query = null, $x = 0, $y = 0 ) {
		unset( $x, $y );
		if ( null !== $query ) {
			$this->queries[] = (string) $query;
		}
		$q = (string) $query;
		if ( preg_match( '/SELECT\s+COUNT\(\*\).*FROM\s+`?[^`\s]+`?\s+WHERE\s+module\s*=\s*\'([^\']+)\'\s+AND\s+migration\s*=\s*\'([^\']+)\'/s', $q, $m ) ) {
			$key = $m[1] . '|' . $m[2];
			return isset( $this->migration_keys[ $key ] ) ? '1' : '0';
		}
		if ( preg_match( '/SHOW\s+TABLES\s+LIKE\s+\'([^\']+)\'/i', $q, $m ) ) {
			unset( $m );
			return null;
		}
		return null;
	}

	/**
	 * @param string $query
	 * @return int
	 */
	public function query( $query ) {
		$this->queries[] = (string) $query;
		return 0;
	}

	/**
	 * @param string               $table
	 * @param array<string, mixed> $data
	 * @param array<int, string>   $format
	 * @return int
	 */
	public function insert( $table, $data, $format = null ) {
		unset( $table, $format );
		if ( isset( $data['module'], $data['migration'] ) ) {
			$this->migration_keys[ (string) $data['module'] . '|' . (string) $data['migration'] ] = true;
		}
		return 1;
	}

	public function get_charset_collate(): string {
		return 'DEFAULT CHARSET=utf8';
	}

	/**
	 * @param string $pattern
	 * @return array<int, string>
	 */
	public function get_col( $pattern, $x = 0 ) {
		unset( $pattern, $x );
		return array();
	}
}

final class FreeStandaloneActivationTest extends TestCase {

	/** @var FreeStandaloneActivationTest_WpdbMock|null */
	private static $wpdb_backup = null;

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options']       = array();
		$GLOBALS['__doublescale_phpunit_transients']      = array();
		$GLOBALS['__doublescale_phpunit_install_dbdelta'] = array();

		self::$wpdb_backup           = $GLOBALS['wpdb'] ?? null;
		$GLOBALS['wpdb']             = new FreeStandaloneActivationTest_WpdbMock();
		$GLOBALS['wpdb']->prefix    = 'wp_';
		$GLOBALS['wpdb']->last_error = '';

		update_option( 'doublescale_legacy_renamed', 1, false );
		update_option( 'doublescale_settings_migrated', 1, false );
		update_option( 'doublescale_caps_migrated', 1, false );
	}

	protected function tearDown(): void {
		$GLOBALS['wpdb'] = self::$wpdb_backup;
		parent::tearDown();
	}

	public function test_install_creates_expected_tables_and_is_idempotent_for_migrations(): void {
		Install::install();

		$tables = array();
		foreach ( (array) $GLOBALS['__doublescale_phpunit_install_dbdelta'] as $chunk ) {
			$sql = is_array( $chunk ) ? implode( "\n", $chunk ) : (string) $chunk;
			if ( preg_match_all( '/CREATE TABLE(?:\\s+IF NOT EXISTS)?\\s+`?([a-zA-Z0-9_]+)`?\\s*\\(/i', $sql, $m ) ) {
				foreach ( $m[1] as $name ) {
					$tables[ $name ] = true;
				}
			}
		}

		$this->assertArrayHasKey( 'wp_doublescale_migrations', $tables, 'Migration tracking table must be created' );
		$this->assertGreaterThanOrEqual( 19, count( $tables ), 'Expected at least 19 DoubleScale tables (free schema)' );

		$first_migration_count = count( $GLOBALS['wpdb']->migration_keys );

		Install::install();

		$this->assertSame(
			$first_migration_count,
			count( $GLOBALS['wpdb']->migration_keys ),
			'Second install() must not insert duplicate migration rows'
		);
	}
}
