<?php
/**
 * Contract every module must implement.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core;

defined( 'ABSPATH' ) || exit;

interface ModuleInterface {

	public function slug(): string;

	public function label(): string;

	public function description(): string;

	public function is_toggleable(): bool;

	/**
	 * Semver-style version for this module (used by MigrationRunner).
	 */
	public function version(): string;

	/**
	 * @return string[]
	 */
	public function dependencies(): array;

	public function is_enabled(): bool;

	public function register( Container $container ): void;

	public function boot( Container $container ): void;

	/**
	 * @return string[]
	 */
	public function migrations(): array;

	/**
	 * @return class-string[]
	 */
	public function restControllers(): array;
}
