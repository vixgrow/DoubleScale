<?php
/**
 * PHPUnit bootstrap for DoubleScale (free) — minimal WordPress stubs when WP is not loaded.
 *
 * @package DoubleScale\Tests
 */

$plugin_root = dirname( __DIR__ );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', $plugin_root . '/phpunit/wp-abspath/' );
}

if ( ! defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
	define( 'DOUBLESCALE_PLUGIN_DIR', rtrim( $plugin_root, '/\\' ) . '/' );
}

if ( ! defined( 'DOUBLESCALE_PLUGIN_URL' ) ) {
	define( 'DOUBLESCALE_PLUGIN_URL', 'http://example.test/wp-content/plugins/QuillCRM/' );
}

if ( ! defined( 'DOUBLESCALE_VERSION' ) ) {
	define( 'DOUBLESCALE_VERSION', '0.0.0-phpunit' );
}

// Minimal WP REST shim so PHPUnit can autoload REST controller classes without WordPress.
if ( ! class_exists( 'WP_REST_Server', false ) ) {
	class WP_REST_Server {
		public const READABLE   = 1;
		public const CREATABLE = 2;
		public const EDITABLE  = 4;
		public const DELETABLE = 8;
		public const ALLMETHODS = self::READABLE | self::CREATABLE | self::EDITABLE | self::DELETABLE;
	}
}

if ( ! class_exists( 'WP_REST_Controller', false ) ) {
	class WP_REST_Controller {
		/**
		 * @return void
		 */
		public function register_routes() {
		}

		/**
		 * @return array<string, mixed>
		 */
		public function get_collection_params() {
			return array();
		}

		/**
		 * @param int|string $method
		 * @return array<string, mixed>
		 */
		public function get_endpoint_args_for_item_schema( $method = WP_REST_Server::CREATABLE ) {
			unset( $method );
			return array();
		}

		/**
		 * @return array<string, mixed>
		 */
		public function get_context_param() {
			return array();
		}
	}
}

if ( ! function_exists( '__' ) ) {
	/**
	 * @param string $text
	 * @param string $domain
	 * @return string
	 */
	function __( $text, $domain = 'default' ) {
		unset( $domain );
		return $text;
	}
}

$GLOBALS['__doublescale_phpunit_options'] = array();

if ( ! function_exists( 'get_option' ) ) {
	/**
	 * @param mixed $default
	 * @return mixed
	 */
	function get_option( $option, $default = false ) {
		return array_key_exists( $option, $GLOBALS['__doublescale_phpunit_options'] )
			? $GLOBALS['__doublescale_phpunit_options'][ $option ]
			: $default;
	}
}

if ( ! function_exists( 'update_option' ) ) {
	function update_option( $option, $value, $autoload = null ) {
		unset( $autoload );
		$GLOBALS['__doublescale_phpunit_options'][ $option ] = $value;
		return true;
	}
}

if ( ! function_exists( 'delete_option' ) ) {
	function delete_option( $option ) {
		unset( $GLOBALS['__doublescale_phpunit_options'][ $option ] );
		return true;
	}
}

$GLOBALS['__doublescale_phpunit_hooks']   = array();
$GLOBALS['__doublescale_phpunit_filters'] = array();

if ( ! function_exists( 'add_action' ) ) {
	/**
	 * @param int $accepted_args Ignored; matches WordPress signature.
	 */
	function add_action( $hook_name, $callback, $priority = 10, $accepted_args = 1 ) {
		unset( $accepted_args );
		if ( ! isset( $GLOBALS['__doublescale_phpunit_hooks'][ $hook_name ] ) ) {
			$GLOBALS['__doublescale_phpunit_hooks'][ $hook_name ] = array();
		}
		$p = (int) $priority;
		if ( ! isset( $GLOBALS['__doublescale_phpunit_hooks'][ $hook_name ][ $p ] ) ) {
			$GLOBALS['__doublescale_phpunit_hooks'][ $hook_name ][ $p ] = array();
		}
		$GLOBALS['__doublescale_phpunit_hooks'][ $hook_name ][ $p ][] = $callback;
	}
}

if ( ! function_exists( 'do_action' ) ) {
	/**
	 * @param mixed ...$args
	 */
	function do_action( $hook_name, ...$args ) {
		if ( empty( $GLOBALS['__doublescale_phpunit_hooks'][ $hook_name ] ) ) {
			return;
		}
		ksort( $GLOBALS['__doublescale_phpunit_hooks'][ $hook_name ] );
		foreach ( $GLOBALS['__doublescale_phpunit_hooks'][ $hook_name ] as $callbacks ) {
			foreach ( (array) $callbacks as $cb ) {
				$cb( ...$args );
			}
		}
	}
}

if ( ! function_exists( 'add_filter' ) ) {
	/**
	 * @param int $accepted_args Ignored; matches WordPress signature.
	 */
	function add_filter( $hook_name, $callback, $priority = 10, $accepted_args = 1 ) {
		unset( $accepted_args );
		if ( ! isset( $GLOBALS['__doublescale_phpunit_filters'][ $hook_name ] ) ) {
			$GLOBALS['__doublescale_phpunit_filters'][ $hook_name ] = array();
		}
		$p = (int) $priority;
		if ( ! isset( $GLOBALS['__doublescale_phpunit_filters'][ $hook_name ][ $p ] ) ) {
			$GLOBALS['__doublescale_phpunit_filters'][ $hook_name ][ $p ] = array();
		}
		$GLOBALS['__doublescale_phpunit_filters'][ $hook_name ][ $p ][] = $callback;
	}
}

if ( ! function_exists( 'remove_filter' ) ) {
	/**
	 * @param mixed $callback Same instance as passed to add_filter.
	 */
	function remove_filter( $hook_name, $callback, $priority = 10 ) {
		$p = (int) $priority;
		if ( empty( $GLOBALS['__doublescale_phpunit_filters'][ $hook_name ][ $p ] ) ) {
			return false;
		}
		$callbacks = &$GLOBALS['__doublescale_phpunit_filters'][ $hook_name ][ $p ];
		foreach ( $callbacks as $i => $cb ) {
			if ( $cb === $callback ) {
				array_splice( $callbacks, $i, 1 );
				return true;
			}
		}
		return false;
	}
}

if ( ! function_exists( 'apply_filters' ) ) {
	/**
	 * @param mixed $value
	 * @param mixed ...$args
	 * @return mixed
	 */
	function apply_filters( $hook_name, $value, ...$args ) {
		if ( empty( $GLOBALS['__doublescale_phpunit_filters'][ $hook_name ] ) ) {
			return $value;
		}
		$carry = $value;
		ksort( $GLOBALS['__doublescale_phpunit_filters'][ $hook_name ] );
		foreach ( $GLOBALS['__doublescale_phpunit_filters'][ $hook_name ] as $callbacks ) {
			foreach ( (array) $callbacks as $cb ) {
				$carry = $cb( $carry, ...$args );
			}
		}
		return $carry;
	}
}

require_once $plugin_root . '/vendor/autoload.php';
require_once $plugin_root . '/includes/Autoload.php';
