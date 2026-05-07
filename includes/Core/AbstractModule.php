<?php
/**
 * Convenience base class for modules.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core;

defined( 'ABSPATH' ) || exit;

abstract class AbstractModule implements ModuleInterface {

	public function label(): string {
		return ucfirst( $this->slug() );
	}

	public function description(): string {
		return '';
	}

	public function is_toggleable(): bool {
		return true;
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array( 'core' );
	}

	public function is_enabled(): bool {
		if ( ! $this->is_toggleable() ) {
			return true;
		}

		$stored  = get_option( 'doublescale_enabled_modules', array() );
		$default = ! isset( $stored[ $this->slug() ] ) || (bool) $stored[ $this->slug() ];

		return (bool) apply_filters( 'doublescale_module_enabled_' . $this->slug(), $default );
	}

	public function register( Container $container ): void {
	}

	public function boot( Container $container ): void {
		if ( $controllers = $this->restControllers() ) {
			add_action(
				'rest_api_init',
				static function () use ( $controllers ) {
					foreach ( $controllers as $class ) {
						( new $class() )->register_routes();
					}
				}
			);
		}
	}

	public function restControllers(): array {
		return array();
	}

	public function migrations(): array {
		$dir = $this->module_dir() . '/Migrations';
		if ( ! is_dir( $dir ) ) {
			return array();
		}
		$files = glob( $dir . '/*.php' ) ?: array();
		sort( $files );
		return $files;
	}

	protected function module_dir(): string {
		$ref = new \ReflectionClass( static::class );
		return \dirname( $ref->getFileName() );
	}

	protected function loadGlobs( array $patterns ): void {
		if ( ! defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
			return;
		}
		foreach ( $patterns as $rel ) {
			foreach ( glob( DOUBLESCALE_PLUGIN_DIR . $rel ) ?: array() as $file ) {
				require_once $file;
			}
		}
	}

	protected function loadManifest( string $manifest_path ): void {
		if ( ! is_file( $manifest_path ) ) {
			return;
		}

		$files = require $manifest_path;
		if ( ! is_array( $files ) ) {
			return;
		}

		foreach ( $files as $file ) {
			if ( is_file( $file ) ) {
				require_once $file;
			}
		}
	}

	protected function loadManifestOrGlobs( array $patterns, string $cache_key ): void {
		if ( ! function_exists( 'doublescale_get_manifest_path' ) ) {
			$this->loadGlobs( $patterns );
			return;
		}

		$manifest_path = doublescale_get_manifest_path( $cache_key );
		if ( $manifest_path && is_file( $manifest_path ) ) {
			$this->loadManifest( $manifest_path );
			return;
		}

		if ( $manifest_path && $this->buildManifest( $patterns, $manifest_path ) ) {
			$this->loadManifest( $manifest_path );
			return;
		}

		$this->loadGlobs( $patterns );
	}

	protected function loadModuleMergeTagFiles(): void {
		$dir = $this->module_dir() . '/MergeTags';
		if ( ! is_dir( $dir ) ) {
			return;
		}
		$it = new \RecursiveDirectoryIterator( $dir, \FilesystemIterator::SKIP_DOTS );
		$ri = new \RecursiveIteratorIterator( $it );
		$re = new \RegexIterator( $ri, '/\\.php$/' );
		foreach ( $re as $file ) {
			require_once $file->getPathname();
		}
	}

	protected function buildManifest( array $patterns, string $manifest_path ): bool {
		if ( ! defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
			return false;
		}
		$files = array();
		foreach ( $patterns as $rel ) {
			foreach ( glob( DOUBLESCALE_PLUGIN_DIR . $rel ) ?: array() as $file ) {
				$files[] = $file;
			}
		}
		sort( $files );

		$export = "<?php\n// Auto-generated manifest — do not edit.\nreturn " . var_export( $files, true ) . ";\n";
		$dir    = \dirname( $manifest_path );
		if ( $dir && ! is_dir( $dir ) && function_exists( 'wp_mkdir_p' ) ) {
			wp_mkdir_p( $dir );
		}
		if ( ! is_dir( $dir ) || ! is_writable( $dir ) ) {
			return false;
		}
		$ok = (bool) @\file_put_contents( $manifest_path, $export );

		return $ok && is_file( $manifest_path );
	}
}
