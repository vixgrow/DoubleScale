<?php
/**
 * Regression cover for the invoice-creation fatal.
 *
 * Reported from a live multisite subsite: the subsite's invoices table was
 * missing the `sections` column, so the INSERT failed, `save()` returned with
 * no row, `->fresh()` returned null, and `InvoiceShaper::shape()` fataled on
 * its non-nullable type hint:
 *
 *   Uncaught TypeError: InvoiceShaper::shape(): Argument #1 ($invoice) must be
 *   of type InvoiceModel, null given
 *
 * Two independent defects are covered here:
 *   1. The migration must self-heal the column on every boot (its proposal
 *      twin already does; the invoice one did not).
 *   2. A failed insert must surface as a clean error, never a PHP fatal.
 *
 * @package DoubleScale\Tests\Modules\Documents
 */

namespace DoubleScale\Tests\Modules\Documents;

use DoubleScale\Modules\Documents\Migrations\SalesInvoiceTableContentColumns;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group documents
 */
final class InvoiceCreateFailureTest extends TestCase {

	/**
	 * The migration must expose a static `ensure()` that is safe to call on
	 * every boot, so a site whose migration ledger already advanced past this
	 * version still gets the column. Without it a multisite subsite silently
	 * keeps a table that cannot accept an invoice.
	 */
	public function test_migration_exposes_a_bootable_ensure_hook(): void {
		$this->assertTrue(
			method_exists( SalesInvoiceTableContentColumns::class, 'ensure' ),
			'SalesInvoiceTableContentColumns::ensure() is what lets an already-migrated site self-heal the `sections` column.'
		);

		$reflection = new \ReflectionMethod( SalesInvoiceTableContentColumns::class, 'ensure' );
		$this->assertTrue( $reflection->isStatic(), 'ensure() must be static so boot_child() can call it directly.' );
		$this->assertTrue( $reflection->isPublic(), 'ensure() must be public to be callable from the module boot.' );
	}

	/**
	 * `run()` must keep working (it is the migration-ledger entry point) and
	 * must go through the same self-healing path.
	 */
	public function test_migration_run_still_exists_for_the_ledger(): void {
		$this->assertTrue( method_exists( SalesInvoiceTableContentColumns::class, 'run' ) );
	}

	/**
	 * The module boot must actually call the self-heal, or the migration being
	 * capable of healing changes nothing on a real site. Asserted against the
	 * source because boot_child() needs a full container to invoke.
	 */
	public function test_documents_module_boot_calls_the_invoice_self_heal(): void {
		$module_source = file_get_contents(
			dirname( __DIR__, 4 ) . '/includes/Modules/Documents/Module.php'
		);

		$this->assertNotFalse( $module_source, 'Documents Module.php must be readable.' );
		$this->assertStringContainsString(
			'SalesInvoiceTableContentColumns::ensure()',
			$module_source,
			'boot_child() must self-heal the invoice `sections` column, the way it already does for proposals.'
		);
	}

	/**
	 * The reported fatal: a failed insert leaves nothing to shape. The create
	 * path must not hand a null model to the shaper.
	 */
	public function test_invoice_controller_guards_against_a_null_model_after_save(): void {
		$controller_source = file_get_contents(
			dirname( __DIR__, 4 ) . '/includes/Modules/Documents/Rest/Controllers/RestInvoiceController.php'
		);

		$this->assertNotFalse( $controller_source, 'RestInvoiceController.php must be readable.' );

		// Every `->fresh(...)` result reaching the shaper must be null-checked
		// first. Before the fix these were passed straight through, so a failed
		// insert became "must be of type InvoiceModel, null given".
		$unguarded = preg_match_all(
			'/InvoiceShaper::shape\(\s*\$\w+->fresh\(/',
			$controller_source
		);

		$this->assertSame(
			0,
			$unguarded,
			'InvoiceShaper::shape() must never receive an unchecked ->fresh() result: a failed insert returns null and fatals on the type hint.'
		);
	}
}
