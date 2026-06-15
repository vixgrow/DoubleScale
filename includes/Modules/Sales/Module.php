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
use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Core\Container;
use DoubleScale\Core\Payment\GatewayManager;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Sales\Constants\ProposalStatus;
use DoubleScale\Modules\Sales\Models\ProposalModel;
use DoubleScale\Modules\Sales\Renderer\InvoiceFrontendHandler;
use DoubleScale\Modules\Sales\Renderer\ProposalFrontendHandler;
use DoubleScale\Modules\Sales\Rest\ProposalShaper;
use DoubleScale\Modules\Sales\Services\ConvertProposalToInvoice;

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
		// Sales owns the shared SALES_REP / SALES_MANAGER roles (co-used by the
		// Pro pipeline child module): create them on enable — the caps sync
		// below only patches roles that already exist.
		\DoubleScale\Core\UserRoles\UserRoles::provision_crm_roles();
		Capabilities::sync_capabilities_for_user_roles();
	}

	public function onDeactivate(): void {
		// Role definitions are removed only when no owning module still needs
		// them; user assignments persist for re-enable.
		\DoubleScale\Core\UserRoles\UserRoles::enforce_module_scoped_roles();
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestProposalController::class,
			Rest\Controllers\RestInvoiceController::class,
			Rest\Controllers\RestInvoicePaymentController::class,
			Rest\Controllers\RestPaymentController::class,
			Rest\Controllers\RestContactSalesController::class,
			Rest\Controllers\RestInvoiceOnlinePaymentController::class,
			Rest\Controllers\RestSalesUsersController::class,
			Rest\Controllers\RestSalesTaxController::class,
			Rest\Controllers\RestPublicProposalController::class,
			Rest\Controllers\RestPublicInvoiceController::class,
			Rest\Controllers\RestSalesSettingsController::class,
			Rest\Controllers\RestSalesAnalyticsController::class,
		);
	}

	/**
	 * @return array<int, array{0: string, 1: string}>
	 */
	public function scheduledHooks(): array {
		return array(
			array( 'doublescale_sales', 'doublescale_sales_overdue_invoices' ),
			array( 'doublescale_sales', 'doublescale_sales_expiring_proposals' ),
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		Capabilities::ensure_capabilities_synced();

		GatewayManager::instance();

		add_action( 'init', array( $this, 'register_overdue_schedule' ) );

		new ProposalFrontendHandler();
		new InvoiceFrontendHandler();

		add_action( 'doublescale_sales_proposal_accepted', array( $this, 'auto_convert_accepted_proposal' ), 10, 1 );
		add_action( 'doublescale_sales_invoice_paid', array( $this, 'on_invoice_paid' ), 10, 1 );

		add_filter( 'doublescale_mail_merge_tag_groups', array( $this, 'register_merge_tag_groups' ) );

		require_once $this->module_dir() . '/MergeTags/AbstractSalesMergeTag.php';
		$this->loadModuleMergeTagFiles();

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

		MenuRegistry::add(
			array(
				'page_title'      => __( 'Payments', 'doublescale' ),
				'menu_title'      => __( 'Payments', 'doublescale' ),
				'capability'      => 'doublescale_access',
				'slug'            => 'doublescale&path=sales/payments',
				'callback'        => array( AdminLoader::class, 'page_wrapper' ),
				'position'        => 43,
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

		$tasks->register_callback(
			'doublescale_sales_expiring_proposals',
			static function () {
				( new Services\ExpiringProposals() )->run();
			}
		);

		if ( false === $tasks->get_next_timestamp( 'doublescale_sales_expiring_proposals' ) ) {
			$tasks->schedule_recurring( time(), DAY_IN_SECONDS, 'doublescale_sales_expiring_proposals' );
		}
	}

	/**
	 * Notify sales rep when an invoice is paid.
	 *
	 * @param \DoubleScale\Modules\Sales\Models\InvoiceModel $invoice Invoice.
	 * @return void
	 */
	public function on_invoice_paid( $invoice ): void {
		if ( ! $invoice instanceof \DoubleScale\Modules\Sales\Models\InvoiceModel ) {
			return;
		}
		( new Services\SalesRepNotifications() )->notify_invoice_paid( $invoice );
	}

	/**
	 * When a customer accepts a proposal, create a draft invoice automatically.
	 *
	 * @param ProposalModel $proposal Proposal.
	 * @return void
	 */
	public function auto_convert_accepted_proposal( ProposalModel $proposal ): void {
		if ( ProposalStatus::ACCEPTED !== (string) $proposal->status ) {
			return;
		}

		if ( ProposalShaper::get_linked_invoice_id( $proposal ) ) {
			return;
		}

		$invoice = ( new ConvertProposalToInvoice() )->convert( $proposal );
		if ( is_wp_error( $invoice ) ) {
			if ( function_exists( 'doublescale_get_logger' ) ) {
				doublescale_get_logger()->error(
					'Auto invoice conversion failed after proposal acceptance',
					array(
						'source'      => 'sales-proposal-accept',
						'proposal_id' => (int) $proposal->id,
						'error'       => $invoice->get_error_message(),
					)
				);
			}
			return;
		}

		if ( class_exists( ActivityModel::class ) ) {
			ActivityModel::create(
				array(
					'contact_id'    => (int) $proposal->contact_id,
					'activity_type' => ActivityTypes::STATUS_CHANGED,
					'data'          => array(
						'title'       => __( 'Invoice created from proposal', 'doublescale' ),
						'type'        => 'system',
						'note'        => sprintf(
							/* translators: 1: proposal number, 2: invoice number */
							__( 'Proposal %1$s was accepted and converted to invoice %2$s.', 'doublescale' ),
							(string) $proposal->proposal_number,
							(string) $invoice->invoice_number
						),
						'proposal_id' => (int) $proposal->id,
						'invoice_id'  => (int) $invoice->id,
					),
					'user_id'       => null,
				)
			);
		}

		do_action( 'doublescale_sales_proposal_converted_to_invoice', $proposal, $invoice );
	}

	/**
	 * Restrict the Sales merge-tag group to sales lifecycle triggers.
	 *
	 * @param array<string, array<string, mixed>> $groups Merge tag groups.
	 * @return array<string, array<string, mixed>>
	 */
	public function register_merge_tag_groups( array $groups ): array {
		$disabled = ! function_exists( 'doublescale_is_module_active' )
			|| ! doublescale_is_module_active( 'sales' );

		$groups['sales'] = array(
			'name'        => __( 'Sales', 'doublescale' ),
			'mergeTags'   => isset( $groups['sales']['mergeTags'] ) ? $groups['sales']['mergeTags'] : array(),
			'triggers'    => array(
				'proposal_sent',
				'proposal_declined',
				'proposal_accepted',
				'proposal_converted_to_invoice',
				'invoice_sent',
				'invoice_paid',
			),
			'is_disabled' => $disabled,
		);

		return $groups;
	}
}
