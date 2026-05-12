<?php
/**
 * Unified module facade (merged free + Pro registries when Pro is active).
 * Delegates active checks to {@see doublescale_is_module_active()}.
 *
 * Lives in the free plugin so the base CRM owns the API; Pro layers registries and tasks.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core;

use DoubleScale\Core\Database\MigrationRunner;

defined( 'ABSPATH' ) || exit;

final class ModuleManager {

	/**
	 * Legacy Action Scheduler pairs (fallback when {@see ModuleInterface::scheduledHooks()} is empty).
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

		$sync = static function ( array $old, array $new ): void {
			self::sync_lifecycle_from_option_delta( $old, $new );
			self::flushCache();
		};

		add_action(
			'update_option_doublescale_enabled_modules',
			static function ( $old, $value ) use ( $sync ): void {
				$sync(
					is_array( $old ) ? $old : array(),
					is_array( $value ) ? $value : array()
				);
			},
			10,
			2
		);

		add_action(
			'add_option_doublescale_enabled_modules',
			static function ( $_option, $value ) use ( $sync ): void {
				$sync(
					array(),
					is_array( $value ) ? $value : array()
				);
			},
			10,
			2
		);
	}

	/**
	 * @param array<string, bool|string|int> $old_value Previous option value.
	 * @param array<string, bool|string|int> $new_value New option value.
	 */
	public static function sync_lifecycle_from_option_delta( array $old_value, array $new_value ): void {
		$slugs = array_unique( array_merge( array_keys( $old_value ), array_keys( $new_value ) ) );
		foreach ( $slugs as $slug ) {
			$slug = (string) $slug;
			$was_on = ! isset( $old_value[ $slug ] ) || (bool) $old_value[ $slug ];
			$now_on = ! isset( $new_value[ $slug ] ) || (bool) $new_value[ $slug ];
			if ( $was_on && ! $now_on ) {
				self::deactivateModule( $slug );
			} elseif ( ! $was_on && $now_on ) {
				self::activateModule( $slug );
			}
		}
	}

	public static function activateModule( string $slug ): void {
		$module = self::getModule( $slug );
		if ( ! $module instanceof ModuleInterface ) {
			return;
		}
		MigrationRunner::run_for_module( $module );
		$module->onActivate();
	}

	public static function deactivateModule( string $slug ): void {
		$module = self::getModule( $slug );
		if ( ! $module instanceof ModuleInterface ) {
			return;
		}
		$module->onDeactivate();
		self::clearScheduledTasksForModule( $slug );
	}

	public static function isEnabled( string $slug ): bool {
		return doublescale_is_module_enabled( $slug );
	}

	/**
	 * @since 1.13.x
	 */
	public static function isActive( string $slug ): bool {
		return doublescale_is_module_active( $slug );
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
	 * @return ModuleInterface|null
	 */
	public static function getModule( string $slug ): ?ModuleInterface {
		if ( ! class_exists( \DoubleScale\Core\PluginKernel::class, false ) ) {
			return null;
		}
		$m = \DoubleScale\Core\PluginKernel::instance()->get_module_registry()->get( $slug );

		return $m instanceof ModuleInterface ? $m : null;
	}

	/**
	 * Merged module map; Pro modules share the free kernel registry after discovery.
	 *
	 * @return array<string, ModuleInterface>
	 */
	public static function all(): array {
		if ( ! class_exists( \DoubleScale\Core\PluginKernel::class, false ) ) {
			return array();
		}

		return \DoubleScale\Core\PluginKernel::instance()->get_module_registry()->all();
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
		if ( ! class_exists( \DoubleScale\Pro\Modules\Tasks\Tasks::class ) ) {
			return;
		}

		$pairs = array();
		$mod   = self::getModule( $slug );
		if ( $mod instanceof ModuleInterface ) {
			$pairs = $mod->scheduledHooks();
		}
		if ( array() === $pairs && isset( self::TASK_HOOKS_BY_MODULE[ $slug ] ) ) {
			$pairs = self::TASK_HOOKS_BY_MODULE[ $slug ];
		}
		if ( array() === $pairs ) {
			return;
		}
		foreach ( $pairs as $pair ) {
			if ( ! isset( $pair[0], $pair[1] ) ) {
				continue;
			}
			( new \DoubleScale\Pro\Modules\Tasks\Tasks( (string) $pair[0] ) )->unschedule_all( (string) $pair[1] );
		}
	}
}
