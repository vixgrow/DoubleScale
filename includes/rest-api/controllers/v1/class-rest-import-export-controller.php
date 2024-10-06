<?php
/**
 * REST API: Import_Export Controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use Exception;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Import_Export\Import;

/**
 * Import_Export Controller
 */
class Rest_Import_Export_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'import-export';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/export",
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'export' ),
					'permission_callback' => array( $this, 'import_export_permissions_check' ),
					'args'                => array(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/import",
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'import' ),
					'permission_callback' => array( $this, 'import_export_permissions_check' ),
					'args'                => array(
						'source' => array(
							'required' => true,
							'type'     => 'string',
						),
						'offset' => array(
							'required' => false,
							'type'     => 'integer',
						),
					),
				),
			)
		);
	}

	/**
	 * Export
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function export( $request ) {
		// $source = $request->get_param( 'source' ) ?? 'csv';
		// $page        = $request->get_param( 'page' ) ?? 1;
		// $result      = array();

		// if ( 'fluentcrm' === $source ) {
		// $exporter = new Import();
		// $result   = $exporter->import_from_fluentcrm( $page );
		// }

		// return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Import
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function import( $request ) {
		$source = $request->get_param( 'source' ) ?? 'csv';
		$offset = $request->get_param( 'offset' ) ?? 0;
		$result = array();

		if ( 'fluentcrm' === $source ) {
			$exporter = new Import();
			$result   = $exporter->import_from_fluentcrm( $offset );
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Import and export permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function import_export_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
