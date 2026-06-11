<?php
/**
 * Sales module bootstrap.
 *
 * Owns proposals and invoices with JSON line items.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Admin\AdminLoader;
use DoubleScale\Admin\MenuRegistry;
use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;
use DoubleScale\Modules\Sales\Renderer\ProposalFrontendHandler;

/**
 * Sales module.
 */
final class Module extends AbstractModule {

	public function slug(): string {
		return 'sales';
	}

	public function label(): string {
		return __( 'Sales', 'doublescale' );
	}

	public function description(): string {
		return __( 'Create proposals and invoices with line items, discounts, and customer billing.', 'doublescale' );
	}

	public function version(): string {
		return '1.0.0';
	}

	public function is_toggleable(): bool {
		return true;
	}

	public function dependencies(): array {
		return array( 'core', 'contacts' );
	}

	public function onActivate(): void {
		Capabilities::sync_capabilities_for_user_roles();
	}

	public function onDeactivate(): void {
		// Caps remain on roles; module toggle only hides routes/menu.
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestProposalController::class,
			Rest\Controllers\RestInvoiceController::class,
			Rest\Controllers\RestInvoicePaymentController::class,
			Rest\Controllers\RestContactSalesController::class,
			Rest\Controllers\RestInvoiceStripeController::class,
			Rest\Controllers\RestSalesUsersController::class,
			Rest\Controllers\RestSalesTaxController::class,
			Rest\Controllers\RestPublicProposalController::class,
		);
	}

	/**
	 * @return array<int, array{0: string, 1: string}>
	 */
	public function scheduledHooks(): array {
		return array(
			array( 'doublescale_sales', 'doublescale_sales_overdue_invoices' ),
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		Capabilities::ensure_capabilities_synced();

		add_action( 'init', array( $this, 'register_overdue_schedule' ) );

		new ProposalFrontendHandler();

		MenuRegistry::add(
			array(
				'page_title'      => __( 'Proposals', 'doublescale' ),
				'menu_title'      => __( 'Proposals', 'doublescale' ),
				'capability'      => 'doublescale_access',
				'slug'            => 'doublescale&path=sales/proposals',
				'callback'        => array( AdminLoader::class, 'page_wrapper' ),
				'position'        => 41,
				'group'           => 'sales',
				'requires_module' => 'sales',
			)
		);

		MenuRegistry::add(
			array(
				'page_title'      => __( 'Invoices', 'doublescale' ),
				'menu_title'      => __( 'Invoices', 'doublescale' ),
				'capability'      => 'doublescale_access',
				'slug'            => 'doublescale&path=sales/invoices',
				'callback'        => array( AdminLoader::class, 'page_wrapper' ),
				'position'        => 42,
				'group'           => 'sales',
				'requires_module' => 'sales',
			)
		);
	}

	/**
	 * Register hourly overdue-invoice cron via Action Scheduler.
	 *
	 * @return void
	 */
	public function register_overdue_schedule(): void {
		if ( get_transient( 'doublescale_register_tasks_lock_sales_overdue' ) ) {
			return;
		}
		set_transient( 'doublescale_register_tasks_lock_sales_overdue', 1, MINUTE_IN_SECONDS );

		$tasks = new \DoubleScale\Core\Tasks( 'doublescale_sales' );
		$tasks->register_callback(
			'doublescale_sales_overdue_invoices',
			static function () {
				( new Services\OverdueInvoices() )->run();
			}
		);

		if ( false === $tasks->get_next_timestamp( 'doublescale_sales_overdue_invoices' ) ) {
			$tasks->schedule_recurring( time(), HOUR_IN_SECONDS, 'doublescale_sales_overdue_invoices' );
		}
	}
}
