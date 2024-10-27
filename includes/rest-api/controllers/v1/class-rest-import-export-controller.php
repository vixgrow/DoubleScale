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
use QuillCRM\Import_Export\Security;

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
						'source'          => array(
							'required' => true,
							'type'     => 'string',
						),
						'offset'          => array(
							'required' => false,
							'type'     => 'integer',
						),
						'file_name'       => array(
							'required' => false,
							'type'     => 'string',
						),
						'mapping'         => array(
							'required'             => false,
							'type'                 => 'object',
							'additionalProperties' => true,
						),
						'lists_mapping'   => array(
							'required' => false,
							'type'     => 'array',
							'items'    => array(
								'type' => 'object',
							),
						),
						'tags_mapping'    => array(
							'required' => false,
							'type'     => 'array',
							'items'    => array(
								'type' => 'object',
							),
						),
						'lists'           => array(
							'required' => false,
							'type'     => 'array',
							'items'    => array(
								'type' => 'number',
							),
						),
						'tags'            => array(
							'required' => false,
							'type'     => 'array',
							'items'    => array(
								'type' => 'number',
							),
						),
						'status'          => array(
							'required' => false,
							'type'     => 'string',
						),
						'update_existing' => array(
							'required' => false,
							'type'     => 'boolean',
						),
					),
				),
			)
		);

		// Upload and analyze file
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/upload",
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'upload' ),
					'permission_callback' => array( $this, 'import_export_permissions_check' ),
				),
			)
		);

		// Get fluentcrm lists and tags
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/fluentcrm",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'fluentcrm' ),
					'permission_callback' => array( $this, 'import_export_permissions_check' ),
				),
			)
		);

		// Get funnelkit lists and tags
		register_rest_route(
			$this->namespace,
			"/{$this->rest_base}/wpfunnelkit",
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'funnelkit' ),
					'permission_callback' => array( $this, 'import_export_permissions_check' ),
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
	 * Upload
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function upload( $request ) {
		$file = $request->get_file_params();
		if ( ! $file ) {
			return new WP_Error( 'no_file', 'No file provided', array( 'status' => 400 ) );
		}

		// WP Filesystem.
		global $wp_filesystem;

		// Check if WP Filesystem is loaded.
		if ( empty( $wp_filesystem ) ) {
			require_once ABSPATH . '/wp-admin/includes/file.php';
			WP_Filesystem();
		}

		if ( ! Security::prepare_upload_dir() ) {
			return new WP_Error( 'filesystem_error', 'Failed to create upload directory', array( 'status' => 500 ) );
		}

		$upload_dir = Security::get_upload_dir();
		$file_name  = time() . '_' . $file['file']['name'];
		$file_path  = $upload_dir . '/' . $file_name;

		if ( ! $wp_filesystem->move( $file['file']['tmp_name'], $file_path ) ) {
			return new WP_Error( 'move_error', 'Failed to move file', array( 'status' => 500 ) );
		}

		$header_columns = $this->get_header_columns( $file_path );

		return new WP_REST_Response(
			array(
				'file_name'      => $file_name,
				'header_columns' => $header_columns,
			),
			200
		);
	}

	/**
	 * Get header columns
	 *
	 * @since 1.0.0
	 *
	 * @param string $file_path File path.
	 *
	 * @return array
	 */
	public function get_header_columns( $file_path ) {
		if ( ( $handle = fopen( $file_path, 'r' ) ) !== false ) {
			$column_names = fgetcsv( $handle );
			fclose( $handle );

			return $column_names;
		} else {
			return null;
		}
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
		$source          = $request->get_param( 'source' ) ?? 'csv';
		$offset          = $request->get_param( 'offset' ) ?? 0;
		$file_name       = $request->get_param( 'file_name' ) ?? '';
		$mapping         = $request->get_param( 'mapping' ) ?? array();
		$lists_mapping   = $request->get_param( 'lists_mapping' ) ?? array();
		$tags_mapping    = $request->get_param( 'tags_mapping' ) ?? array();
		$lists           = $request->get_param( 'lists' ) ?? array();
		$tags            = $request->get_param( 'tags' ) ?? array();
		$status          = $request->get_param( 'status' ) ?? 'subscribed';
		$update_existing = $request->get_param( 'update_existing' ) ?? false;
		$result          = array();

		$args     = array(
			'offset'          => $offset,
			'status'          => $status,
			'update_existing' => $update_existing,
			'lists_mapping'   => $lists_mapping,
			'tags_mapping'    => $tags_mapping,
			'lists'           => $lists,
			'tags'            => $tags,
		);
		$exporter = new Import( $args );
		if ( 'csv' === $source ) {
			$result = $exporter->import_from_csv( $file_name, $mapping );
		} else {
			$result = $exporter->import( $source );
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Get FluentCRM lists and tags
	 *
	 * @since 1.0.0
	 *
	 * @return WP_REST_Response
	 */
	public function fluentcrm() {
		$exporter = new Import();
		$result   = $exporter->get_fluentcrm_lists_and_tags();

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Get FunnelKit lists and tags
	 *
	 * @since 1.0.0
	 *
	 * @return WP_REST_Response
	 */
	public function funnelkit() {
		$exporter = new Import();
		$result   = $exporter->get_wpfunnels_lists_and_tags();

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
