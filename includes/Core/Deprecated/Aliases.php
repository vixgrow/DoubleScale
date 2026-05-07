<?php
/**
 * Lazy backward-compatible class aliases (legacy DoubleScale\ → DoubleScale\).
 *
 * @package DoubleScale\Core\Deprecated
 */

namespace DoubleScale\Core\Deprecated;

defined( 'ABSPATH' ) || exit;

class Aliases {

	/** @var array<string, string>|null */
	private static ?array $map = null;

	private static bool $registered = false;

	public static function register(): void {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		spl_autoload_register( array( __CLASS__, 'autoload' ), true, true );
	}

	public static function autoload( string $class ): void {
		$map = self::map();
		if ( ! isset( $map[ $class ] ) ) {
			return;
		}

		$new = $map[ $class ];

		if ( class_exists( $class, false ) ) {
			return;
		}

		if ( class_exists( $new, true ) || interface_exists( $new, true ) || trait_exists( $new, true ) ) {
			class_alias( $new, $class );
			self::notice( $class, $new );
		}
	}

	/**
	 * @return array<string, string> old FQCN => new FQCN
	 */
	public static function map(): array {
		if ( null !== self::$map ) {
			return self::$map;
		}
		$map_file   = __DIR__ . '/aliases-map.php';
		self::$map = is_file( $map_file ) ? (array) require $map_file : array();
		return self::$map;
	}

	private static function notice( string $old, string $new ): void {
		if ( ! \function_exists( 'apply_filters' ) ) {
			return;
		}
		$emit = \apply_filters(
			'doublescale_deprecation_notices',
			\defined( 'WP_DEBUG' ) && \WP_DEBUG
		);
		if ( ! $emit ) {
			return;
		}
		\trigger_error(
			sprintf(
				'DoubleScale: class %1$s is deprecated and will be removed in a future release. Use %2$s instead.',
				\esc_html( $old ),
				\esc_html( $new )
			),
			E_USER_DEPRECATED
		);
	}

	public static function reset_for_tests(): void {
		self::$registered = false;
		self::$map        = null;
	}
}
