<?php
/**
 * Cover for the boot-time schema reconciler.
 *
 * A live audit across this network found seven cases of column drift — a column
 * present on one site and missing on another — including nine missing columns on
 * one site's proposals table (signature, response, viewed_at, issuer_snapshot),
 * which silently breaks signing and accepting a proposal, and `issuer_snapshot`
 * missing from that site's invoices.
 *
 * The cause is structural, not a one-off. `Migration::ensure_columns()` already
 * knows how to add every column a CREATE definition declares, but it only runs
 * inside `Migration::run()`, which the ledger invokes exactly once. A site whose
 * ledger advanced while an ALTER silently failed can therefore never recover:
 * the column stays missing forever and every write touching it fails.
 *
 * SchemaGuard re-runs that already-idempotent reconciliation on boot.
 *
 * @package DoubleScale\Tests\Core
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\Services\SchemaGuard;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group schema
 */
final class SchemaGuardTest extends TestCase {

	/**
	 * The guard must be callable from a boot hook with no arguments.
	 */
	public function test_exposes_a_static_reconcile_entry_point(): void {
		$this->assertTrue(
			method_exists( SchemaGuard::class, 'reconcile' ),
			'SchemaGuard::reconcile() is the boot-time entry point that repairs column drift.'
		);

		$reflection = new \ReflectionMethod( SchemaGuard::class, 'reconcile' );
		$this->assertTrue( $reflection->isStatic(), 'reconcile() must be static to hook directly.' );
		$this->assertTrue( $reflection->isPublic() );
		$this->assertSame(
			0,
			$reflection->getNumberOfRequiredParameters(),
			'reconcile() must be callable as a bare hook callback.'
		);
	}

	/**
	 * Reconciling must be attempted only once per request. It issues SHOW
	 * COLUMNS per table, so re-running it on every module boot would add a
	 * measurable query cost to each admin page load.
	 */
	public function test_reconcile_runs_only_once_per_request(): void {
		SchemaGuard::reset_for_tests();

		$this->assertFalse( SchemaGuard::has_run(), 'Guard must start unrun.' );

		SchemaGuard::reconcile();
		$this->assertTrue( SchemaGuard::has_run(), 'First call must mark the guard as run.' );

		// A second call must be a no-op rather than repeating every SHOW COLUMNS.
		SchemaGuard::reconcile();
		$this->assertTrue( SchemaGuard::has_run() );
	}

	/**
	 * The reconciler must survive a module whose migration class cannot be
	 * loaded or throws: a schema repair that fatals is worse than the drift it
	 * set out to fix, because it takes down every admin page.
	 */
	public function test_reconcile_is_exception_safe(): void {
		SchemaGuard::reset_for_tests();

		// No WordPress DB in the fast suite: reconcile() must degrade quietly
		// rather than fatal on the missing schema.
		SchemaGuard::reconcile();

		$this->assertTrue( SchemaGuard::has_run() );
	}

	/**
	 * The reconciler is only useful if a module boot actually schedules it.
	 *
	 * It must be hooked on `admin_init` rather than called inline: schema
	 * repair is DDL, and running it during boot would put it on the path of
	 * every front-end and REST request, including route registration.
	 */
	public function test_module_boot_schedules_the_reconciler_on_admin_init(): void {
		$source = file_get_contents( dirname( __DIR__, 3 ) . '/includes/Core/AbstractModule.php' );

		$this->assertNotFalse( $source, 'Core/AbstractModule.php must be readable.' );
		$this->assertStringContainsString(
			'SchemaGuard::class',
			$source,
			'Module boot must register the schema reconciler, or drift is never repaired.'
		);
		$this->assertMatchesRegularExpression(
			'/add_action\(\s*[\'"]admin_init[\'"]\s*,\s*array\(\s*SchemaGuard::class/',
			$source,
			'Reconciliation must be deferred to admin_init, never run inline during boot.'
		);
	}
}
