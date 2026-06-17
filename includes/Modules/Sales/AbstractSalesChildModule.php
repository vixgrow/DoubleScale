<?php
/**
 * Shared behavior for Sales child sub-features (proposals, invoices, contracts).
 *
 * Effective state = Sales parent on AND documents ready AND own stored intent
 * (missing key defaults to on, like the pipeline child).
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;

/**
 * AbstractSalesChildModule class.
 */
abstract class AbstractSalesChildModule extends AbstractModule {

	/**
	 * @return array<int, string>
	 */
	public function dependencies(): array {
		return array( 'core', 'contacts', 'sales' );
	}

	public function is_toggleable(): bool {
		return true;
	}

	/**
	 * Child effective state = parent Sales on AND documents ready AND own intent.
	 *
	 * @return bool
	 */
	public function is_enabled(): bool {
		$stored = get_option( 'doublescale_enabled_modules', array() );
		$intent = ! is_array( $stored )
			|| ! array_key_exists( $this->slug(), $stored )
			|| (bool) $stored[ $this->slug() ];

		$intent = (bool) apply_filters( 'doublescale_module_enabled_' . $this->slug(), $intent );
		if ( ! $intent ) {
			return false;
		}

		if ( function_exists( 'doublescale_sales_documents_ready' ) && ! doublescale_sales_documents_ready() ) {
			return false;
		}

		if ( ! function_exists( 'doublescale_is_module_active' ) ) {
			return true;
		}

		return doublescale_is_module_active( 'sales' );
	}

	public function migrations(): array {
		if ( function_exists( 'doublescale_sales_documents_ready' ) && ! doublescale_sales_documents_ready() ) {
			return array();
		}

		$files = $this->child_migration_files();
		sort( $files );

		return $files;
	}

	public function boot( Container $container ): void {
		if ( ! $this->is_enabled() ) {
			return;
		}

		parent::boot( $container );
		$this->boot_child( $container );
	}

	/**
	 * Absolute paths to migration files owned by this child.
	 *
	 * @return array<int, string>
	 */
	abstract protected function child_migration_files(): array;

	/**
	 * Child-specific boot (frontend handlers, cron, menus, etc.).
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	abstract protected function boot_child( Container $container ): void;

	/**
	 * @param string $basename Migration filename without directory.
	 * @return string
	 */
	protected function child_migration_path( string $basename ): string {
		return $this->module_dir() . '/Migrations/' . $basename;
	}

	/**
	 * @deprecated Use child_migration_path().
	 * @param string $basename Migration filename without directory.
	 * @return string
	 */
	protected function sales_migration_path( string $basename ): string {
		return $this->child_migration_path( $basename );
	}

	/**
	 * Register a recurring Action Scheduler job under the sales group.
	 *
	 * @param string   $hook     Hook name.
	 * @param callable $callback Callback.
	 * @param int      $interval Interval in seconds.
	 * @return void
	 */
	protected function register_recurring_sales_task( string $hook, callable $callback, int $interval ): void {
		$lock_key = 'doublescale_register_tasks_lock_' . $hook;
		if ( get_transient( $lock_key ) ) {
			return;
		}
		set_transient( $lock_key, 1, MINUTE_IN_SECONDS );

		$tasks = new \DoubleScale\Core\Tasks( 'doublescale_sales' );
		$tasks->register_callback( $hook, $callback );

		if ( false === $tasks->get_next_timestamp( $hook ) ) {
			$tasks->schedule_recurring( time(), $interval, $hook );
		}
	}
}
