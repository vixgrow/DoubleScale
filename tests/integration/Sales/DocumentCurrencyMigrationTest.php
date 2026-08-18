<?php
/**
 * Nullable currency migration is display-neutral and idempotent.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\Database\NullableCurrencyColumn;
use DoubleScale\Core\ModuleManager;
use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class DocumentCurrencyMigrationTest extends IntegrationTestCase {

	/** @var int[] Contact ids created by this test, for manual cleanup. */
	private $created_contact_ids = array();

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		Settings::update( 'currency', array( 'currency' => 'EUR' ) );
	}

	/**
	 * Delete the rows this test committed.
	 *
	 * The ALTER TABLE below causes an implicit COMMIT, ending the transaction
	 * WP_UnitTestCase would otherwise roll back — so every invoice and contact
	 * created afterwards is permanent. Left behind they shift contact ids for
	 * later tests, which is how an unrelated portal-scoping assertion started
	 * seeing an extra timeline row.
	 */
	protected function tearDown(): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DELETE FROM `{$wpdb->prefix}doublescale_sales_invoices`" );

		foreach ( $this->created_contact_ids as $contact_id ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->delete( $wpdb->prefix . 'doublescale_contacts', array( 'id' => (int) $contact_id ) );
		}
		$this->created_contact_ids = array();

		parent::tearDown();
	}

	public function test_migration_is_display_neutral_and_does_not_reblank_explicit_drafts(): void {
		global $wpdb;

		$table = $wpdb->prefix . 'doublescale_sales_invoices';

		// Recreate the pre-migration column so ensure() actually runs.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "UPDATE `{$table}` SET `currency` = 'USD' WHERE `currency` IS NULL OR `currency` = ''" );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "ALTER TABLE `{$table}` MODIFY `currency` VARCHAR(10) NOT NULL DEFAULT 'USD'" );

		$sent   = current_time( 'mysql' );
		$matrix = array(
			array( 'stored' => 'USD', 'sent' => $sent ),
			array( 'stored' => 'EUR', 'sent' => $sent ),
			array( 'stored' => '', 'sent' => $sent ),
			array( 'stored' => 'USD', 'sent' => null ),
			array( 'stored' => 'EUR', 'sent' => null ),
			array( 'stored' => '', 'sent' => null ),
		);

		$ids       = array();
		$expected  = array();
		$global    = Settings::get_currency();

		foreach ( $matrix as $row ) {
			$invoice = $this->make_invoice(
				array(
					'status'   => $row['sent'] ? InvoiceStatus::UNPAID : InvoiceStatus::DRAFT,
					'currency' => '' === $row['stored'] ? 'USD' : $row['stored'],
					'sent_at'  => $row['sent'],
				)
			);
			if ( '' === $row['stored'] ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$wpdb->update( $table, array( 'currency' => '' ), array( 'id' => (int) $invoice->id ) );
			}

			$ids[] = (int) $invoice->id;
			$expected[ (int) $invoice->id ] = $this->historical_display( $row['stored'], $row['sent'], $global );
		}

		NullableCurrencyColumn::ensure( 'sales_invoices' );

		foreach ( $ids as $id ) {
			$invoice = InvoiceModel::find( $id );
			$this->assertNotNull( $invoice );
			$this->assertSame(
				$expected[ $id ],
				Settings::document_currency( $invoice->currency, $invoice->sent_at ),
				'Row ' . $id . ' display currency changed'
			);
		}

		$draft_id = $ids[3];
		$draft    = InvoiceModel::find( $draft_id );
		$draft->currency = 'GBP';
		$draft->save();

		NullableCurrencyColumn::ensure( 'sales_invoices' );
		NullableCurrencyColumn::ensure( 'sales_invoices' );
		NullableCurrencyColumn::ensure( 'sales_invoices' );

		$draft->refresh();
		$this->assertSame( 'GBP', (string) $draft->currency );
	}

	/**
	 * Remember a contact id so tearDown can delete the committed row.
	 *
	 * @param int $contact_id Contact id.
	 * @return int The same id, for inline use.
	 */
	private function track_contact( $contact_id ): int {
		$this->created_contact_ids[] = (int) $contact_id;

		return (int) $contact_id;
	}

	/**
	 * What the customer saw under the old drafts-follow-global read rule.
	 *
	 * @param string      $stored Stored column.
	 * @param string|null $sent_at Sent timestamp.
	 * @param string      $global Global currency.
	 * @return string
	 */
	private function historical_display( $stored, $sent_at, $global ): string {
		if ( ! empty( $sent_at ) ) {
			return '' !== $stored ? $stored : $global;
		}
		return $global;
	}

	/**
	 * @param array<string, mixed> $overrides Invoice attributes.
	 * @return InvoiceModel
	 */
	private function make_invoice( array $overrides = array() ): InvoiceModel {
		$defaults = array(
			'contact_id'     => $this->track_contact( $this->make_contact() ),
			'status'         => InvoiceStatus::DRAFT,
			'currency'       => 'USD',
			'discount_type'  => 'none',
			'discount_value' => 0,
			'line_items'     => array(
				array(
					'qty'    => 1,
					'rate'   => 100,
					'amount' => 100,
				),
			),
			'invoice_date'   => current_time( 'Y-m-d' ),
			'due_date'       => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
		);

		$invoice = new InvoiceModel();
		$invoice->fill( array_merge( $defaults, $overrides ) );
		$invoice->save();

		return $invoice->fresh();
	}

	private function ensure_sales_module(): void {
		$modules = get_option( 'doublescale_enabled_modules', array() );
		if ( empty( $modules['sales'] ) ) {
			$modules['sales'] = true;
			update_option( 'doublescale_enabled_modules', $modules );
		}

		ModuleManager::activateModule( 'sales' );
	}
}
