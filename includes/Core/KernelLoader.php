<?php
/**
 * Boots the full DoubleScale kernel once per request when required.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core;

defined( 'ABSPATH' ) || exit;

final class KernelLoader {

	/** @var bool */
	private static $booted = false;

	public static function is_booted(): bool {
		return self::$booted;
	}

	/**
	 * Boot vendor stack, PluginKernel, and fire doublescale_ready.
	 */
	public static function boot_full(): void {
		if ( self::$booted ) {
			return;
		}

		\DoubleScale\Lifecycle::load_vendor_dependencies();

		if ( function_exists( 'doublescale_pro_load_vendor_stack' ) ) {
			doublescale_pro_load_vendor_stack();
		}

		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::ensure_db_ready();
		}

		Bootstrap::init();

		if ( get_option( 'doublescale_needs_task_cleanup' ) ) {
			delete_option( 'doublescale_needs_task_cleanup' );
			if ( class_exists( Tasks::class ) ) {
				Tasks::cleanup_old_tasks();
			}
		}

		self::$booted = true;

		/** Fires after the DoubleScale modular stack is fully initialized. */
		do_action( 'doublescale_ready' );
	}

	/**
	 * Public API for deferred boot paths (integrations, future lazy hooks).
	 */
	public static function ensure_booted(): void {
		self::boot_full();
	}
}
