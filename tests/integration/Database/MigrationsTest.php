<?php
/**
 * Data-driven migration regression tests.
 *
 * Bootstrap force-enables every toggleable module, so by the time these tests
 * run, every module's tables must exist. Instead of one test file per module
 * (with ~80% boilerplate overlap), this single class drives off a dataProvider
 * and queries information_schema for each (table, expected_column) pair.
 *
 * If you add a column to a migration, add it to the expectations below — the
 * test will fail loudly until both sides agree.
 *
 * @package DoubleScale\Tests\Integration\Database
 */

namespace DoubleScale\Tests\Integration\Database;

use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class MigrationsTest extends IntegrationTestCase {

	/**
	 * Each entry: [table_suffix, [required_column, ...]]
	 *
	 * @return array<string, array{0: string, 1: string[]}>
	 */
	public static function table_expectations(): array {
		return array(
			'contacts'        => array(
				'doublescale_contacts',
				array( 'id', 'hash_id', 'email', 'first_name', 'last_name', 'phone', 'email_status', 'sms_status', 'whatsapp_status', 'created_at', 'updated_at' ),
			),
			'activities'      => array(
				'doublescale_activities',
				array( 'id', 'created_at' ),
			),
			'logs'            => array(
				'doublescale_logs',
				array( 'id' ),
			),
			'campaigns'       => array(
				'doublescale_campaigns',
				array( 'id', 'name', 'status', 'type', 'parent_id', 'count', 'created_at', 'updated_at' ),
			),
			'automations'     => array(
				'doublescale_automations',
				array( 'id', 'name', 'trigger', 'status', 'created_at', 'updated_at' ),
			),
			'automation_versions' => array(
				'doublescale_automation_versions',
				array( 'id', 'automation_id', 'version', 'label', 'snapshot', 'created_by', 'created_at' ),
			),
			'bookings'        => array(
				'doublescale_bookings',
				array(
					'id',
					'hash_id',
					'calendar_id',
					'event_id',
					'start_time',
					'end_time',
					'slot_time',
					'status',
					'created_at',
					'updated_at',
					'__guest_or_contact__',
				),
			),
			'booking_events'  => array(
				'doublescale_booking_events',
				array( 'id', 'hash_id', 'calendar_id', 'user_id', 'name', 'slug', 'status', 'type', 'duration', 'visibility', 'created_at', 'updated_at' ),
			),
			'migrations'      => array(
				'doublescale_migrations',
				array( 'module', 'migration' ),
			),
		);
	}

	/**
	 * @dataProvider table_expectations
	 *
	 * @param string   $table_suffix Table name without prefix.
	 * @param string[] $columns      Required columns.
	 */
	public function test_table_exists_and_has_expected_columns( string $table_suffix, array $columns ): void {
		global $wpdb;
		$table = $wpdb->prefix . $table_suffix;

		// Table existence.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$found = $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" );
		$this->assertSame( $table, $found, "Table must exist: {$table}" );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$actual_columns = (array) $wpdb->get_col( "DESC `{$table}`" );

		foreach ( $columns as $col ) {
			if ( '__guest_or_contact__' === $col ) {
				$has_guest   = in_array( 'guest_id', $actual_columns, true );
				$has_contact = in_array( 'contact_id', $actual_columns, true );
				$this->assertTrue(
					$has_guest || $has_contact,
					"Table `{$table}` must have either `guest_id` (legacy) or `contact_id` (current). Actual columns: " . implode( ', ', $actual_columns )
				);
				continue;
			}
			$this->assertContains(
				$col,
				$actual_columns,
				"Table `{$table}` must have column `{$col}`. Actual columns: " . implode( ', ', $actual_columns )
			);
		}
	}

	public function test_migrations_table_records_at_least_one_run_migration(): void {
		global $wpdb;
		$table = $wpdb->prefix . 'doublescale_migrations';
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM `{$table}`" );
		$this->assertGreaterThan(
			0,
			$count,
			'Migrations table must record at least one run after activation.'
		);
	}

	public function test_migrations_for_every_enabled_module_have_run(): void {
		global $wpdb;
		$table = $wpdb->prefix . 'doublescale_migrations';

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$modules_with_migrations = (array) $wpdb->get_col(
			"SELECT DISTINCT module FROM `{$table}`"
		);

		// Bootstrap force-enables these; every one should have at least one
		// migration row.
		foreach ( array( 'contacts', 'activities' ) as $required ) {
			$this->assertContains(
				$required,
				$modules_with_migrations,
				"Module '{$required}' should have at least one row in the migrations table after activation."
			);
		}
	}
}
