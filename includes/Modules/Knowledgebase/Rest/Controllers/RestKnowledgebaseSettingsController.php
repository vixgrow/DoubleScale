<?php
/**
 * Knowledge Base settings REST controller (own slice, own route).
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Knowledgebase\Services\KnowledgebaseSettings;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestKnowledgebaseSettingsController class.
 */
class RestKnowledgebaseSettingsController extends RestController {

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = 'knowledgebase/settings';

	/**
	 * Authoring gate.
	 *
	 * @return bool
	 */
	public function can_manage(): bool {
		return current_user_can( 'doublescale_manage_knowledgebase' );
	}

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
					'permission_callback' => array( $this, 'can_manage' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'can_manage' ),
				),
			)
		);
	}

	/**
	 * GET /knowledgebase/settings
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|\WP_Error
	 */
	public function get_settings( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		return new WP_REST_Response( KnowledgebaseSettings::all(), 200 );
	}

	/**
	 * POST /knowledgebase/settings
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|\WP_Error
	 */
	public function update_settings( $request ) {
		$disabled = $this->require_module( 'knowledgebase' );
		if ( $disabled ) {
			return $disabled;
		}

		$incoming = $request->get_json_params();
		if ( ! is_array( $incoming ) ) {
			$incoming = (array) $request->get_params();
		}

		$saved = KnowledgebaseSettings::save( $incoming );

		return new WP_REST_Response(
			array(
				'success'  => true,
				'settings' => $saved,
			),
			200
		);
	}
}
