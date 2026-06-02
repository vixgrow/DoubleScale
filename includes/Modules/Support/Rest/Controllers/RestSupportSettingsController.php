<?php
/**
 * REST controller for support-scoped settings.
 *
 * Routes registered (namespace `doublescale/v1`):
 *
 *   GET  /support/settings   Read the support settings blob (notifications).
 *   POST /support/settings   Update the support notification toggles.
 *
 * Why a dedicated endpoint instead of the global `/settings` route: the global
 * settings controller is gated on `has_crm_manager_access()` (CRM Manager +
 * Administrator only) and exposes EVERY module's settings. The Support Settings
 * page must be usable by every support-capable role (Support Manager / Support
 * Agent included), but those roles must not gain read/write access to other
 * modules' settings. This controller is gated on `has_support_access()` and
 * only ever touches the `support` key, so broadening access here can never leak
 * unrelated settings.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Settings\Settings;
use DoubleScale\Core\UserRoles\Permissions;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestSupportSettingsController class.
 */
class RestSupportSettingsController extends RestController {

	/**
	 * Route base. Combined with parent's $namespace gives
	 * `doublescale/v1/support/settings`.
	 *
	 * @var string
	 */
	protected $rest_base = 'support/settings';

	/**
	 * Customer-facing notification toggles and their defaults. Mirrors
	 * `NOTIFICATION_DEFAULTS` in the Support Settings page so both sides agree
	 * on the keys and on "enabled by default".
	 *
	 * @var array<string, bool>
	 */
	private const NOTIFICATION_DEFAULTS = array(
		'ticket_created_to_customer' => true,
		'reply_to_customer'          => true,
		'status_change_to_customer'  => true,
	);

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);
	}

	/**
	 * Read the support settings blob, with notification defaults applied so the
	 * UI always receives every known toggle (even before any save).
	 *
	 * @param WP_REST_Request $request Unused — present for the framework contract. // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_settings( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$disabled = $this->require_module( 'support' );
		if ( $disabled ) {
			return $disabled;
		}

		return new WP_REST_Response( $this->read_support_blob(), 200 );
	}

	/**
	 * Update the support notification toggles.
	 *
	 * Only the `notifications` sub-key is writable here — the rest of the
	 * support blob is read, merged, and written back untouched so this endpoint
	 * can never be used to clobber unrelated support settings. Each toggle is
	 * coerced to a strict bool; unknown keys are dropped.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_settings( $request ) {
		$disabled = $this->require_module( 'support' );
		if ( $disabled ) {
			return $disabled;
		}

		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}

		$incoming = isset( $params['notifications'] ) && is_array( $params['notifications'] )
			? $params['notifications']
			: array();

		// Start from current values (defaults applied), then overlay only the
		// known toggles present in the request — sanitized to bool.
		$current = $this->read_support_blob();
		$toggles = $current['notifications'];
		foreach ( self::NOTIFICATION_DEFAULTS as $key => $default ) {
			if ( array_key_exists( $key, $incoming ) ) {
				$toggles[ $key ] = (bool) rest_sanitize_boolean( $incoming[ $key ] );
			}
		}

		$blob                  = Settings::get( 'support', array() );
		$blob                  = is_array( $blob ) ? $blob : array();
		$blob['notifications'] = $toggles;
		Settings::update( 'support', $blob );

		return new WP_REST_Response( array( 'notifications' => $toggles ), 200 );
	}

	/**
	 * Read the `support` settings blob and guarantee a fully-populated
	 * `notifications` map (defaults filled in for any missing toggle).
	 *
	 * @return array{notifications: array<string, bool>}
	 */
	private function read_support_blob(): array {
		$blob   = Settings::get( 'support', array() );
		$blob   = is_array( $blob ) ? $blob : array();
		$stored = isset( $blob['notifications'] ) && is_array( $blob['notifications'] )
			? $blob['notifications']
			: array();

		$notifications = array();
		foreach ( self::NOTIFICATION_DEFAULTS as $key => $default ) {
			$notifications[ $key ] = array_key_exists( $key, $stored )
				? (bool) $stored[ $key ]
				: $default;
		}

		return array( 'notifications' => $notifications );
	}

	/**
	 * Access guard: Administrators, CRM Managers, and the support roles
	 * (Support Manager / Support Agent). Sales Manager / Sales Rep are excluded
	 * — matching the Support Settings page route gate.
	 *
	 * @param WP_REST_Request $request Unused — present for the framework contract. // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	 * @return bool|WP_Error
	 */
	public function permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( Permissions::can_access_support_settings() ) {
			return true;
		}
		return new WP_Error(
			'not_allowed',
			__( 'You do not have permission to access support settings.', 'doublescale' ),
			array( 'status' => 403 )
		);
	}
}
