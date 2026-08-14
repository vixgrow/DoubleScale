<?php
/**
 * The Abilities API ships in WordPress 6.9. On anything older the functions do
 * not exist, so every entry point into this layer must check before calling one
 * — an unguarded call is a fatal error on the front end, not a missing feature.
 *
 * We test for the functions rather than comparing $wp_version because the real
 * question is "is the API here", which is also false on a 6.9+ site where
 * another plugin removed it, and can be true on a build that backports it.
 *
 * This greps the source instead of running the code: the functions DO exist in
 * this test environment, so the guarded branch is unreachable at runtime and
 * only a static check can prove the guard is still written.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class AbilitiesVersionGuardTest extends TestCase {

	/**
	 * Core functions that only exist on WordPress 6.9+.
	 */
	private const GUARDED_FUNCTIONS = array(
		'wp_register_ability',
		'wp_register_ability_category',
		'wp_get_abilities',
		'wp_get_ability',
	);

	/**
	 * Every abilities source file, free and Pro.
	 *
	 * @return array<int, string>
	 */
	private function source_files(): array {
		$roots = array(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Core/Abilities',
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules',
			dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/includes/Modules',
		);

		$files = array();
		foreach ( $roots as $root ) {
			if ( ! is_dir( $root ) ) {
				continue;
			}

			$iterator = new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator( $root, \FilesystemIterator::SKIP_DOTS )
			);

			foreach ( $iterator as $file ) {
				if ( 'php' === $file->getExtension() ) {
					$files[] = $file->getPathname();
				}
			}
		}

		return $files;
	}

	/**
	 * @return array<string, array{0: string, 1: string}>
	 */
	public function guarded_call_provider(): array {
		$cases = array();

		foreach ( $this->source_files() as $path ) {
			$source = (string) file_get_contents( $path );

			foreach ( self::GUARDED_FUNCTIONS as $function ) {
				// A call site is `foo(` not preceded by `function_exists( '`.
				if ( ! preg_match( '/(?<![\'"a-z_])' . $function . '\s*\(/', $source ) ) {
					continue;
				}

				$key           = str_replace( DOUBLESCALE_PLUGIN_DIR, '', $path ) . ' :: ' . $function;
				$cases[ $key ] = array( $path, $function );
			}
		}

		$this->assertNotEmpty( $cases );

		return $cases;
	}

	/**
	 * A file that calls one of these functions must also test for it.
	 *
	 * @dataProvider guarded_call_provider
	 *
	 * @param string $path     Absolute file path.
	 * @param string $function Function name.
	 */
	public function test_call_site_is_guarded_by_function_exists( string $path, string $function ): void {
		$source = (string) file_get_contents( $path );

		$this->assertMatchesRegularExpression(
			"/function_exists\(\s*'" . $function . "'\s*\)/",
			$source,
			basename( $path ) . " calls {$function}() without a function_exists() guard;"
				. ' on WordPress < 6.9 that is a fatal error.'
		);
	}

	/**
	 * maybe_hook() is the single entry point into the layer. It must bail before
	 * it attaches either abilities listener, so nothing downstream runs on an
	 * unsupported WordPress.
	 *
	 * Scoped to maybe_hook() deliberately: init() attaches its own `init` hook
	 * unconditionally and correctly — that listener is what performs the check.
	 */
	public function test_bootstrap_guards_before_hooking(): void {
		$path   = DOUBLESCALE_PLUGIN_DIR . 'includes/Core/Abilities/AbilitiesBootstrap.php';
		$source = (string) file_get_contents( $path );

		$start = strpos( $source, 'function maybe_hook' );
		$this->assertNotFalse( $start, 'AbilitiesBootstrap::maybe_hook() is the documented entry point.' );

		$body = substr( $source, $start );

		$guard_at = strpos( $body, "function_exists( 'wp_register_ability' )" );
		$hook_at  = strpos( $body, "add_action( 'wp_abilities_api" );

		$this->assertNotFalse( $guard_at, 'maybe_hook() must check for the Abilities API.' );
		$this->assertNotFalse( $hook_at, 'maybe_hook() must register the abilities hooks.' );
		$this->assertLessThan(
			$hook_at,
			$guard_at,
			'maybe_hook() attaches an abilities listener before checking the API exists.'
		);
	}
}
