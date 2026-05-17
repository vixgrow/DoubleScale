<?php
/**
 * Integration test for \DoubleScale\Database\Install.
 *
 * Bootstrap already ran Install::install() once (via plugin boot), so these
 * tests verify the post-install state in real MySQL: all non-toggleable
 * tables exist, the migrations table is populated, and calling install()
 * again is idempotent (no duplicate migration rows).
 *
 * @package DoubleScale\Tests\Integration\Database
 */

namespace DoubleScale\Tests\Integration\Database;

use DoubleScale\Database\Install;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class InstallTest extends IntegrationTestCase {

	public function test_migration_tracking_table_exists(): void {
		global $wpdb;
		$table = $wpdb->prefix . 'doublescale_migrations';
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$found = $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" );
		$this->assertSame( $table, $found );
	}

	public function test_non_toggleable_tables_are_created(): void {
		global $wpdb;
		$required = array(
			'doublescale_contacts',
			'doublescale_activities',
			'doublescale_logs',
		);
		foreach ( $required as $suffix ) {
			$table = $wpdb->prefix . $suffix;
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$found = $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" );
			$this->assertSame( $table, $found, "Non-toggleable table missing: {$table}" );
		}
	}

	public function test_install_is_idempotent_for_migration_rows(): void {
		global $wpdb;
		$migrations_table = $wpdb->prefix . 'doublescale_migrations';

		// Reconcile ledger + schema (first call may backfill rows when tables pre-exist).
		Install::install();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$after_first = (int) $wpdb->get_var( "SELECT COUNT(*) FROM `{$migrations_table}`" );

		Install::install();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$after_second = (int) $wpdb->get_var( "SELECT COUNT(*) FROM `{$migrations_table}`" );

		$this->assertSame(
			$after_first,
			$after_second,
			'Consecutive Install::install() calls must not insert duplicate migration rows.'
		);
	}

	public function test_install_does_not_throw_when_run_twice(): void {
		$threw = false;
		try {
			Install::install();
			Install::install();
		} catch ( \Throwable $e ) {
			$threw = true;
		}
		$this->assertFalse( $threw, 'Install::install() must be safe to call repeatedly.' );
	}
}
