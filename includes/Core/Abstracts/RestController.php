<?php
/**
 * REST Controller
 *
 * This class extend `WP_REST_Controller` in order to include /batch endpoint
 * for all endpoints in Plugin REST Api.
 *
 * It's required to follow "Controller Classes" guide before extending this class:
 * <https://developer.wordpress.org/rest-api/extending-the-rest-api/controller-classes/>
 *
 * @class   RestController
 * @package DoubleScale\Pro
 * @subpackage RestApi
 * @see     https://developer.wordpress.org/rest-api/extending-the-rest-api/controller-classes/
 */

namespace DoubleScale\Core\Abstracts;

use WP_REST_Controller;

/**
 * Abstract Rest Controller Class
 *
 * @extends  WP_REST_Controller
 * @since  1.0.0
 */
abstract class RestController extends WP_REST_Controller {

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'doublescale/v1';

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = '';

	/**
	 * Returns the http error status
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_Error $wp_error Wordress Error.
	 *
	 * @return int Returns the http status recored in the specified $wp_error
	 */
	public function get_error_status( $wp_error ) {
		$error_code = $wp_error->get_error_code();
		$mappings   = array(
			'not_found'   => 404,
			'not_allowed' => 401,
		);
		$http_code  = isset( $mappings[ $error_code ] ) ? $mappings[ $error_code ] : 400;

		return $http_code;
	}
}
