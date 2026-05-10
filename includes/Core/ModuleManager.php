<?php
/**
 * Unified module facade (merged free + Pro registries when Pro is active).
 * Delegates enabled checks to {@see doublescale_is_module_enabled()}.
 *
 * Lives in the free plugin so the base CRM owns the API; Pro layers registries and tasks.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core;

defined( 'ABSPATH' ) || exit;

final class ModuleManager {

	/**
	 * Action Scheduler short hooks cleared when a module turns off (Pro Tasks helper).
	 *
	 * @var array<string, array<int, array{0: string, 1: string}>>
	 */
	private const TASK_HOOKS_BY_MODULE = array(
		'campaigns'       => array(
			array( 'doublescale_campaigns', 'doublescale_email_campaigns' ),
			array( 'doublescale_campaigns', 'doublescale_sms_campaigns' ),
			array( 'doublescale_campaigns', 'doublescale_whatsapp_campaigns' ),
			array( 'doublescale_campaigns', 'doublescale_email_sequences' ),
		),
		'websitetracking' => array(
			array( 'doublescale_daily', 'doublescale_cleanup_page_visits' ),
		),
	);

	/** @var bool */
	private static $hooks_registered = false;

	/**
	 * Register global hooks (free Bootstrap calls once; safe if called again).
	 */
	public static function register_hooks(): void {
		if ( self::$hooks_registered ) {
			return;
		}
		self::$hooks_registered = true;

		add_action(
			'update_option_doublescale_enabled_modules',
			static function ( $old, $value ): void {
				self::clear_tasks_for_newly_disabled_modules( $old, $value );
				self::flushCache();
			},
			10,
			2
		);
	}

	/**
	 * @param mixed $old_value Previous option value.
	 * @param mixed $new_value New option value.
	 */
	private static function clear_tasks_for_newly_disabled_modules( $old_value, $new_value ): void {
		$old = is_array( $old_value ) ? $old_value : array();
		$new = is_array( $new_value ) ? $new_value : array();

		$slugs = array_unique( array_merge( array_keys( $old ), array_keys( $new ) ) );
		foreach ( $slugs as $slug ) {
			$was_on = ! isset( $old[ $slug ] ) || (bool) $old[ $slug ];
			$now_on = ! isset( $new[ $slug ] ) || (bool) $new[ $slug ];
			if ( $was_on && ! $now_on ) {
				self::clearScheduledTasksForModule( $slug );
			}
		}
	}

	public static function isEnabled( string $slug ): bool {
		return doublescale_is_module_enabled( $slug );
	}

	public static function isToggleable( string $slug ): bool {
		$m = self::getModule( $slug );
		return $m ? $m->is_toggleable() : false;
	}

	/**
	 * @template T
	 * @param callable(): T $callback
	 * @return T|null
	 */
	public static function whenEnabled( string $slug, callable $callback ) {
		if ( ! self::isEnabled( $slug ) ) {
			return null;
		}
		return $callback();
	}

	/**
	 * @return \DoubleScale\Core\ModuleInterface|\DoubleScale\Pro\Core\ModuleInterface|null
	 */
	public static function getModule( string $slug ): ?object {
		$pro = self::pro_registry_get( $slug );
		if ( $pro ) {
			return $pro;
		}
		return self::free_registry_get( $slug );
	}

	/**
	 * Merged module map; Pro wins on slug collision when Pro is loaded.
	 *
	 * @return array<string, \DoubleScale\Core\ModuleInterface|\DoubleScale\Pro\Core\ModuleInterface>
	 */
	public static function all(): array {
		$merged = array();
		if ( class_exists( \DoubleScale\Core\PluginKernel::class, false ) ) {
			foreach ( \DoubleScale\Core\PluginKernel::instance()->get_module_registry()->all() as $slug => $module ) {
				if ( 'automations' === $slug ) {
					continue;
				}
				$merged[ $slug ] = $module;
			}
		}
		if ( class_exists( \DoubleScale\Pro\Core\PluginKernel::class, false ) ) {
			foreach ( \DoubleScale\Pro\Core\PluginKernel::instance()->get_module_registry()->all() as $slug => $module ) {
				$merged[ $slug ] = $module;
			}
		}
		return $merged;
	}

	public static function flushCache(): void {
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}
	}

	/**
	 * Clears Action Scheduler hooks owned by a module when it is disabled (Pro Tasks).
	 */
	public static function clearScheduledTasksForModule( string $slug ): void {
		if ( empty( self::TASK_HOOKS_BY_MODULE[ $slug ] ) || ! class_exists( \DoubleScale\Pro\Modules\Tasks\Tasks::class ) ) {
			return;
		}
		foreach ( self::TASK_HOOKS_BY_MODULE[ $slug ] as $pair ) {
			( new \DoubleScale\Pro\Modules\Tasks\Tasks( $pair[0] ) )->unschedule_all( $pair[1] );
		}
	}

	private static function pro_registry_get( string $slug ): ?object {
		if ( ! class_exists( \DoubleScale\Pro\Core\PluginKernel::class, false ) ) {
			return null;
		}
		return \DoubleScale\Pro\Core\PluginKernel::instance()->get_module_registry()->get( $slug );
	}

	private static function free_registry_get( string $slug ): ?object {
		if ( ! class_exists( \DoubleScale\Core\PluginKernel::class, false ) ) {
			return null;
		}
		return \DoubleScale\Core\PluginKernel::instance()->get_module_registry()->get( $slug );
	}
}
