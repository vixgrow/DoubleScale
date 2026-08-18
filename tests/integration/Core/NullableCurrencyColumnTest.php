<?php
/**
 * NullableCurrencyColumn is the single migration engine behind all four
 * currency-bearing document tables: sales_invoices and sales_proposals in free,
 * sales_contracts and sales_credit_notes in Pro. The Pro migrations are thin
 * delegates that pass only a table name, so exercising the helper directly
 * covers them without requiring Pro to be installed.
 *
 * Driven against a dedicated fixture table rather than a real one. ALTER TABLE
 * implicitly commits the transaction WP_UnitTestCase wraps each test in, so
 * running the migration against a shared table would make every row created
 * before it permanent and leak into later tests — that actually happened here,
 * breaking an unrelated portal-scoping test and an Authorize.Net fixture. The
 * fixture table is created in setUpBeforeClass, which runs outside the
 * transaction, so the DDL has nothing to commit out from under us.
 *
 * @package DoubleScale\Tests\Integration\Core
 */

namespace DoubleScale\Tests\Integration\Core;

use DoubleScale\Core\Database\NullableCurrencyColumn;
use DoubleScale\Core\Settings\Settings;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class NullableCurrencyColumnTest extends IntegrationTestCase {

	/** @var string Logical table name (no prefix). */
	private $logical = 'currency_migration_fixture';

	/** @var string Fully qualified table name. */
	private $table = '';

	/**
	 * Create the fixture table outside the per-test transaction.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();

		global $wpdb;
		$table = $wpdb->prefix . 'doublescale_currency_migration_fixture';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS `{$table}`" );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query(
			"CREATE TABLE `{$table}` (
				`id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
				`currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
				`sent_at` DATETIME NULL DEFAULT NULL,
				PRIMARY KEY (`id`)
			)"
		);
	}

	/**
	 * Verify the fixture starts in the pre-migration shape every test, so
	 * ensure() always has real work to do.
	 */
	private function assert_fixture_is_legacy_shaped(): void {
		$this->assertSame(
			'NO',
			$this->column_null_flag(),
			'Fixture must start NOT NULL; tearDown failed to reset it.'
		);
	}

	/**
	 * Drop the fixture table once the class is done with it.
	 */
	public static function tearDownAfterClass(): void {
		global $wpdb;
		$table = $wpdb->prefix . 'doublescale_currency_migration_fixture';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS `{$table}`" );

		parent::tearDownAfterClass();
	}

	/**
	 * Reset the fixture before each test.
	 *
	 * The ALTER TABLE this performs implicitly commits, ending the transaction
	 * WP_UnitTestCase relies on for isolation. IntegrationTestCase restores the
	 * settings option in tearDown precisely because of tests like this one, so
	 * the currency set below cannot leak forward.
	 */
	protected function setUp(): void {
		parent::setUp();

		global $wpdb;
		$this->table = $wpdb->prefix . 'doublescale_' . $this->logical;

		$this->restore_legacy_column();

		Settings::update( 'currency', array( 'currency' => 'EUR' ) );
	}

	/**
	 * Drafts become NULL (inherit), sent rows keep their frozen code, and sent
	 * rows with a blank code are backfilled to the global.
	 */
	public function test_migration_splits_drafts_from_sent_rows(): void {
		$sent_usd   = $this->insert( 'USD', '2024-01-01 00:00:00' );
		$sent_blank = $this->insert( '', '2024-01-01 00:00:00' );
		$draft_usd  = $this->insert( 'USD', null );
		$draft_eur  = $this->insert( 'EUR', null );

		NullableCurrencyColumn::ensure( $this->logical );

		// Sent rows keep exactly what the customer saw.
		$this->assertSame( 'USD', $this->currency_of( $sent_usd ) );
		// Blank + sent fell back to global under the old rule; backfilled to it.
		$this->assertSame( 'EUR', $this->currency_of( $sent_blank ) );

		// Drafts were displaying the global, so they become NULL (inherit).
		$this->assertNull( $this->currency_of( $draft_usd ) );
		$this->assertNull( $this->currency_of( $draft_eur ) );

		// Inherit resolves to the global, and tracks it when it moves.
		$this->assertSame( 'EUR', Settings::document_currency( $this->currency_of( $draft_usd ), null ) );
		Settings::update( 'currency', array( 'currency' => 'GBP' ) );
		$this->assertSame( 'GBP', Settings::document_currency( $this->currency_of( $draft_usd ), null ) );
	}

	/**
	 * The column really is nullable afterwards — proving the widen step ran
	 * before the NULL writes rather than those writes being coerced.
	 */
	public function test_column_becomes_nullable(): void {
		$this->assertSame( 'NO', $this->column_null_flag() );

		NullableCurrencyColumn::ensure( $this->logical );

		$this->assertSame( 'YES', $this->column_null_flag() );
	}

	/**
	 * Re-running on every boot must never re-blank a draft the user has since
	 * set explicitly. This is the data-loss guard.
	 */
	public function test_rerun_does_not_reblank_an_explicit_draft(): void {
		$draft = $this->insert( 'USD', null );

		NullableCurrencyColumn::ensure( $this->logical );
		$this->assertNull( $this->currency_of( $draft ) );

		// User picks a currency on the draft after the migration.
		$this->set_currency( $draft, 'GBP' );

		NullableCurrencyColumn::ensure( $this->logical );
		NullableCurrencyColumn::ensure( $this->logical );
		NullableCurrencyColumn::ensure( $this->logical );

		$this->assertSame( 'GBP', $this->currency_of( $draft ) );
	}

	/**
	 * An unknown table must be a no-op, not a fatal — Pro modules (contracts,
	 * credit notes) can be inactive, leaving their tables absent.
	 */
	public function test_missing_table_is_a_noop(): void {
		NullableCurrencyColumn::ensure( 'sales_definitely_not_a_real_table' );

		$this->assertTrue( true, 'ensure() on a missing table must not fatal' );
	}

	/**
	 * Reset the fixture to its pre-migration shape so each test starts with a
	 * NOT NULL column and no rows.
	 *
	 * @return void
	 */
	private function restore_legacy_column(): void {
		global $wpdb;

		// DDL implicitly commits, so rows survive the transaction rollback and
		// must be cleared explicitly between tests.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DELETE FROM `{$this->table}`" );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "ALTER TABLE `{$this->table}` MODIFY `currency` VARCHAR(10) NOT NULL DEFAULT 'USD'" );
	}

	/**
	 * @param string      $currency Stored code.
	 * @param string|null $sent_at  Sent timestamp.
	 * @return int Inserted row ID.
	 */
	private function insert( string $currency, $sent_at ): int {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->insert(
			$this->table,
			array(
				'currency' => $currency,
				'sent_at'  => $sent_at,
			)
		);

		$id = (int) $wpdb->insert_id;
		$this->assertNotSame( 0, $id, 'Fixture insert failed: ' . $wpdb->last_error );

		return $id;
	}

	/**
	 * @param int    $id       Row ID.
	 * @param string $currency Code to store.
	 * @return void
	 */
	private function set_currency( int $id, string $currency ): void {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->update( $this->table, array( 'currency' => $currency ), array( 'id' => $id ) );
	}

	/**
	 * @param int $id Row ID.
	 * @return string|null Raw stored currency.
	 */
	private function currency_of( int $id ) {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_var( $wpdb->prepare( "SELECT `currency` FROM `{$this->table}` WHERE `id` = %d", $id ) );
	}

	/**
	 * @return string 'YES' or 'NO'.
	 */
	private function column_null_flag(): string {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$column = $wpdb->get_results( "SHOW COLUMNS FROM `{$this->table}` LIKE 'currency'", ARRAY_A );

		return strtoupper( (string) ( $column[0]['Null'] ?? '' ) );
	}
}
