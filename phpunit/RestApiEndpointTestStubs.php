<?php
/**
 * Minimal WordPress REST API stubs for PHPUnit route registration tests.
 * Loaded only by {@see \DoubleScale\Tests\RestAllEndpointsRegistrationTest}.
 *
 * @package DoubleScale\Pro\Tests
 */

defined( 'ABSPATH' ) || exit;

/**
 * Every {@see register_rest_route()} call appends here for assertions.
 *
 * @var array<int, array{namespace: string, route: string, args: mixed}>
 */
$GLOBALS['__doublescale_phpunit_rest_registrations'] = array();

if ( ! class_exists( 'WP_REST_Server', false ) ) {
	class WP_REST_Server {
		public const READABLE   = 1;
		public const CREATABLE = 2;
		public const EDITABLE  = 4;
		public const DELETABLE = 8;
		public const ALLMETHODS = self::READABLE | self::CREATABLE | self::EDITABLE | self::DELETABLE;
	}
}

if ( ! class_exists( 'WP_REST_Request', false ) ) {
	class WP_REST_Request {
		/** @var array<string, mixed> */
		public $params = array();

		/**
		 * @param string $key
		 * @return mixed
		 */
		public function get_param( $key ) {
			return $this->params[ $key ] ?? null;
		}

		/**
		 * @param string $key
		 * @return string|null
		 */
		public function get_header( $key ) {
			unset( $key );
			return null;
		}
	}
}

if ( ! class_exists( 'WP_REST_Response', false ) ) {
	class WP_REST_Response {
		/** @var mixed */
		public $data;

		/** @var int */
		public $status = 200;

		/**
		 * @param mixed $data
		 * @param int   $status
		 */
		public function __construct( $data = null, $status = 200 ) {
			$this->data   = $data;
			$this->status = (int) $status;
		}
	}
}

if ( ! class_exists( 'WP_Error', false ) ) {
	class WP_Error {
		/** @var string */
		private $code = '';

		/** @var string */
		private $message = '';

		/**
		 * @param string|int $code
		 * @param string     $message
		 * @param mixed      $data Optional error data (WordPress parity; ignored by this stub).
		 */
		public function __construct( $code = '', $message = '', $data = '' ) {
			unset( $data );
			$this->code    = (string) $code;
			$this->message = (string) $message;
		}

		public function get_error_code(): string {
			return $this->code;
		}

		public function get_error_message(): string {
			return $this->message;
		}
	}
}

if ( ! function_exists( 'register_rest_route' ) ) {
	/**
	 * @param string               $namespace
	 * @param string               $route
	 * @param array<string, mixed> $args
	 * @return bool
	 */
	function register_rest_route( $namespace, $route, $args = array() ) {
		$GLOBALS['__doublescale_phpunit_rest_registrations'][] = array(
			'namespace' => (string) $namespace,
			'route'     => (string) $route,
			'args'      => $args,
		);
		return true;
	}
}

if ( ! function_exists( 'rest_get_endpoint_args_for_schema' ) ) {
	/**
	 * @param array<string, mixed> $schema
	 * @param string               $method
	 * @return array<string, mixed>
	 */
	function rest_get_endpoint_args_for_schema( $schema, $method = \WP_REST_Server::CREATABLE ) {
		unset( $schema, $method );
		return array();
	}
}

if ( ! function_exists( '__return_true' ) ) {
	function __return_true() {
		return true;
	}
}

if ( ! function_exists( '__return_false' ) ) {
	function __return_false() {
		return false;
	}
}

if ( ! function_exists( 'current_user_can' ) ) {
	function current_user_can( $capability, ...$args ) {
		unset( $capability, $args );
		return false;
	}
}

if ( ! function_exists( 'is_user_logged_in' ) ) {
	function is_user_logged_in() {
		return false;
	}
}

if ( ! function_exists( 'absint' ) ) {
	function absint( $maybeint ) {
		return (int) abs( (int) $maybeint );
	}
}

if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $str ) {
		return is_string( $str ) ? $str : (string) $str;
	}
}

if ( ! function_exists( 'rest_authorization_required_code' ) ) {
	function rest_authorization_required_code() {
		return 401;
	}
}
