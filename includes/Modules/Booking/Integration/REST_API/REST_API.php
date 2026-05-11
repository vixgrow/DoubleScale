<?php
/**
 * Legacy namespace entry point for integration REST bootstrapping.
 *
 * Canonical implementation: {@see \DoubleScale\Modules\Booking\Integration\Rest\REST_API}.
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Integration\REST_API;

defined( 'ABSPATH' ) || exit;

/**
 * Delegates to the Rest namespace implementation so PSR-4 resolves and child
 * integration classes (e.g. Google\Rest\REST_API) can extend this FQCN.
 */
class REST_API extends \DoubleScale\Modules\Booking\Integration\Rest\REST_API {

}
