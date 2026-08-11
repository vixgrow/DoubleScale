<?php
/**
 * The three gates every DoubleScale ability passes through.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core\Abilities;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\UserRoles\Permissions;
use WP_Error;

/**
 * Gate 1 (module active), Gate 2 (role/capability), and the execute wrapper.
 *
 * Gate 3 (record ownership) cannot live here — it needs the query, so each
 * execute callback applies it. See DocumentAbilities / SupportAbilities.
 *
 * Kept separate from AbilityRegistrar so the fast test suite can exercise the
 * gates directly with stub modules and no database.
 */
final class AbilityGuard {

	/**
	 * Gate 1, evaluated LIVE rather than snapshotted at registration.
	 *
	 * Toggling a module never re-runs ModuleRegistry::boot(), so an ability
	 * registered while the module was on stays registered for the rest of the
	 * request. Since abilities are also reachable over REST, a stale
	 * registration would be a live exposure path — the permission_callback is
	 * the only thing evaluated per invocation, so the authoritative check
	 * belongs there.
	 *
	 * Always pass the LEAF slug ('documents', never 'sales'): the parent gate
	 * is already folded into the child's flag by
	 * doublescale_child_module_parent_map().
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Module slug.
	 * @return bool
	 */
	public static function module_active( string $slug ): bool {
		if ( ! function_exists( 'doublescale_is_module_active' ) ) {
			return true;
		}
		return doublescale_is_module_active( $slug );
	}

	/**
	 * Compose Gate 1 + Gate 2 into the permission_callback WP core will call.
	 *
	 * Order is deliberate: AI access first (broadest denial and it already
	 * returns a well-formed WP_Error), then live module state, then the
	 * module's own capability check.
	 *
	 * @since 1.0.0
	 *
	 * @param string        $name              Full ability name.
	 * @param string        $module_slug       Leaf module slug.
	 * @param callable|null $module_permission Module-specific capability check.
	 * @return callable
	 */
	public static function compose_permission( string $name, string $module_slug, $module_permission ): callable {
		return static function () use ( $name, $module_slug, $module_permission ) {
			$ai_access = Permissions::has_ai_access();
			if ( is_wp_error( $ai_access ) ) {
				return $ai_access;
			}

			if ( ! self::module_active( $module_slug ) ) {
				return new WP_Error(
					'doublescale_module_inactive',
					sprintf(
						/* translators: %s: module slug */
						__( 'The "%s" module is not active on this site.', 'doublescale' ),
						$module_slug
					),
					array(
						'status'  => 403,
						'module'  => $module_slug,
						'ability' => $name,
					)
				);
			}

			if ( is_callable( $module_permission ) && ! call_user_func( $module_permission ) ) {
				return new WP_Error(
					'doublescale_forbidden',
					__( 'You do not have permission to use this tool.', 'doublescale' ),
					array(
						'status'  => 403,
						'ability' => $name,
					)
				);
			}

			return true;
		};
	}

	/**
	 * Wrap an execute callback so no exception escapes to the caller.
	 *
	 * Two distinct problems this solves:
	 *
	 * 1. Without a definite failure signal an agent retries tools that
	 *    silently succeeded — duplicating whatever the tool did.
	 * 2. SQL and runtime messages leak table names, query fragments, and
	 *    filesystem paths. WP_DEBUG is enabled often enough on reachable
	 *    staging sites that gating the detail on that constant is not
	 *    protection, so the caller gets a correlation id and nothing else.
	 *
	 * @since 1.0.0
	 *
	 * @param string   $name     Full ability name.
	 * @param callable $callback Module execute callback.
	 * @return callable
	 */
	public static function wrap_execute( string $name, callable $callback ): callable {
		return static function ( $input = null ) use ( $name, $callback ) {
			try {
				return call_user_func( $callback, is_array( $input ) ? $input : array() );
			} catch ( \Throwable $e ) {
				$error_id = substr( md5( uniqid( 'ds_ability_', true ) ), 0, 12 );

				/**
				 * Fires on an unhandled ability exception, before the sanitised
				 * WP_Error is returned to the caller.
				 *
				 * @since 1.0.0
				 *
				 * @param \Throwable $e        The exception.
				 * @param string     $name     Full ability name.
				 * @param mixed      $input    Tool input parameters.
				 * @param string     $error_id Correlation id given to the caller.
				 */
				do_action( 'doublescale_ability_exception', $e, $name, $input, $error_id );

				self::log_exception( $e, $name, $error_id );

				return new WP_Error(
					'doublescale_ability_failed',
					__( 'The tool failed with an internal error. Quote the error_id to the site administrator so they can look it up in the logs.', 'doublescale' ),
					array(
						'status'   => 500,
						'ability'  => $name,
						'error_id' => $error_id,
					)
				);
			}
		};
	}

	/**
	 * Send the full exception record to the DoubleScale log.
	 *
	 * Never allowed to interfere with the response — a broken logger must not
	 * turn a handled tool failure into a fatal.
	 *
	 * @since 1.0.0
	 *
	 * @param \Throwable $e        The exception.
	 * @param string     $name     Full ability name.
	 * @param string     $error_id Correlation id.
	 * @return void
	 */
	private static function log_exception( \Throwable $e, string $name, string $error_id ): void {
		if ( ! function_exists( 'doublescale_get_logger' ) ) {
			return;
		}

		try {
			$logger = doublescale_get_logger();
			if ( ! is_object( $logger ) || ! method_exists( $logger, 'error' ) ) {
				return;
			}

			$logger->error(
				sprintf( 'Ability exception [%s] %s', $error_id, $name ),
				array(
					'error_id'  => $error_id,
					'ability'   => $name,
					'exception' => get_class( $e ),
					'message'   => $e->getMessage(),
					'file'      => $e->getFile(),
					'line'      => $e->getLine(),
					'trace'     => $e->getTraceAsString(),
				)
			);
		} catch ( \Throwable $ignored ) {
			// Logging must never escalate a handled failure.
			unset( $ignored );
		}
	}
}
