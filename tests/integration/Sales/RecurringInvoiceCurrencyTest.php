<?php
/**
 * Recurring invoices must pin the template's explicit currency.
 *
 * Spawned invoices are created as DRAFTS via DuplicateInvoice. Under the old
 * drafts-follow-global read rule every spawn silently re-floated to the current
 * global currency; under NULL-means-inherit an explicit choice must survive each
 * cycle, and a template that inherits must keep inheriting.
 *
 * This guards a behaviour that currently works only because DuplicateInvoice
 * copies the RAW column. Adding InvoiceModel::getCurrencyAttribute() would bake
 * the resolved global into every spawn and break it silently — this test is the
 * tripwire for that.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Services\DuplicateInvoice;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class RecurringInvoiceCurrencyTest extends IntegrationTestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->ensure_sales_module();
		Settings::update( 'currency', array( 'currency' => 'EUR' ) );
	}

	/**
	 * An explicit template currency survives repeated spawns even when the
	 * global setting changes underneath it.
	 */
	public function test_explicit_template_currency_is_pinned_across_spawns(): void {
		$template = $this->make_invoice( array( 'currency' => 'USD' ) );

		$first = ( new DuplicateInvoice() )->duplicate( $template );

		// The global moves after the recurrence was set up.
		Settings::update( 'currency', array( 'currency' => 'GBP' ) );

		$second = ( new DuplicateInvoice() )->duplicate( $template );

		// Raw column is pinned, not re-floated to the global.
		$this->assertSame( 'USD', (string) $first->currency );
		$this->assertSame( 'USD', (string) $second->currency );

		// And what the customer actually sees is USD, not the new global.
		$this->assertSame(
			'USD',
			Settings::document_currency( $first->currency, $first->sent_at )
		);
		$this->assertSame(
			'USD',
			Settings::document_currency( $second->currency, $second->sent_at )
		);

		// Spawns are drafts — the pin must not depend on sent_at.
		$this->assertEmpty( $first->sent_at );
		$this->assertEmpty( $second->sent_at );
	}

	/**
	 * A template that inherits (NULL) keeps inheriting: its spawns follow
	 * whatever the global currency is at spawn time.
	 */
	public function test_inheriting_template_keeps_following_the_global(): void {
		$template = $this->make_invoice( array( 'currency' => null ) );
		$this->force_null_currency( (int) $template->id );
		$template->refresh();

		$before = ( new DuplicateInvoice() )->duplicate( $template );

		Settings::update( 'currency', array( 'currency' => 'GBP' ) );

		$after = ( new DuplicateInvoice() )->duplicate( $template );

		// Raw column stays NULL — inherit is copied as inherit, never baked.
		$this->assertTrue( null === $before->currency || '' === $before->currency );
		$this->assertTrue( null === $after->currency || '' === $after->currency );

		// Display follows the global at read time, before and after the change.
		$this->assertSame(
			'GBP',
			Settings::document_currency( $before->currency, $before->sent_at )
		);
		$this->assertSame(
			'GBP',
			Settings::document_currency( $after->currency, $after->sent_at )
		);
	}

	/**
	 * Force a raw NULL currency, bypassing model defaults.
	 *
	 * @param int $invoice_id Invoice ID.
	 * @return void
	 */
	private function force_null_currency( int $invoice_id ): void {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->update(
			$wpdb->prefix . 'doublescale_sales_invoices',
			array( 'currency' => null ),
			array( 'id' => $invoice_id )
		);
	}

	/**
	 * @param array<string, mixed> $overrides Invoice attributes.
	 * @return InvoiceModel
	 */
	private function make_invoice( array $overrides = array() ): InvoiceModel {
		$defaults = array(
			'contact_id'     => $this->make_contact(),
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
