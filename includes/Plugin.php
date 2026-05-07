<?php
/**
 * Back-compat facade for code that still calls {@see Plugin::instance()}.
 * Canonical application object is {@see \DoubleScale\Core\PluginKernel}.
 *
 * @package DoubleScale
 */

namespace DoubleScale;

defined( 'ABSPATH' ) || exit;

/**
 * @mixin \DoubleScale\Core\PluginKernel
 */
final class Plugin {

	public static function instance(): \DoubleScale\Core\PluginKernel {
		return \DoubleScale\Core\PluginKernel::instance();
	}
}
