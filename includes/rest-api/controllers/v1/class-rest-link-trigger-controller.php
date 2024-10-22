<?php
/**
 * REST API: Link Trigger Controller
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
use QuillCRM\Models\Link_Trigger_Model;

/**
 * Link Trigger Controller class
 */
class REST_Link_Trigger_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'link-triggers';

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'keyword'  => array(
							'description' => __( 'Keyword to search.', 'quillcrm' ),
							'type'        => 'string',
						),
						'per_page' => array(
							'description' => __( 'Number of items to fetch.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'page'     => array(
							'description' => __( 'Page number.', 'quillcrm' ),
							'type'        => 'integer',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Item schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'link_trigger',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'name'        => array(
					'description' => __( 'Name of the link trigger.', 'quillcrm' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'hash'        => array(
					'description' => __( 'Unique hash for the link trigger.', 'quillcrm' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'status'      => array(
					'description' => __( 'Status of the link trigger.', 'quillcrm' ),
					'type'        => 'string',
					'enum'        => array( 'active', 'inactive' ),
					'context'     => array( 'view', 'edit', 'embed' ),
					'default'     => 'active',
				),
				'settings'    => array(
					'description' => __( 'Settings of the link trigger.', 'quillcrm' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'click_count' => array(
					'description' => __( 'Click count of the link trigger.', 'quillcrm' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'created_at'  => array(
					'description' => __( 'The date the link trigger was created.', 'quillcrm' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'updated_at'  => array(
					'description' => __( 'The date the link trigger was last updated.', 'quillcrm' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
			),
		);
	}

	/**
	 * Get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		$keyword  = $request->get_param( 'keyword' );
		$per_page = $request->get_param( 'per_page' ) ?: 10;
		$page     = $request->get_param( 'page' ) ?: 1;

		if ( $keyword ) {
			$link_triggers = Link_Trigger_Model::where( 'name', 'LIKE', '%' . $keyword . '%' )->orderBy( 'created_at', 'desc' )->paginate( $per_page, array( '*' ), $page );
		} else {
			$link_triggers = Link_Trigger_Model::orderBy( 'created_at', 'desc' )->paginate( $per_page, array( '*' ), $page );
		}

		return new WP_REST_Response( $link_triggers );
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		$id = $request->get_param( 'id' );

		$link_trigger = Link_Trigger_Model::find( $id );

		if ( ! $link_trigger ) {
			return new WP_Error( 'quillcrm_link_trigger_not_found', __( 'Link trigger not found.', 'quillcrm' ), array( 'status' => 404 ) );
		}

		return new WP_REST_Response( $link_trigger );
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		try {
			$link_trigger_data = $this->prepare_link_trigger( $request );
			$link_trigger      = Link_Trigger_Model::create( $link_trigger_data );

			return new WP_REST_Response( $link_trigger );
		} catch ( Exception $e ) {
			return new WP_Error( 'quillcrm_link_trigger_create_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$id = $request->get_param( 'id' );

		$link_trigger = Link_Trigger_Model::find( $id );

		if ( ! $link_trigger ) {
			return new WP_Error( 'quillcrm_link_trigger_not_found', __( 'Link trigger not found.', 'quillcrm' ), array( 'status' => 404 ) );
		}

		try {
			$link_trigger_data = $this->prepare_link_trigger( $request );
			$link_trigger->update( $link_trigger_data );

			return new WP_REST_Response( $link_trigger );
		} catch ( Exception $e ) {
			return new WP_Error( 'quillcrm_link_trigger_update_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		$id = $request->get_param( 'id' );

		$link_trigger = Link_Trigger_Model::find( $id );

		if ( ! $link_trigger ) {
			return new WP_Error( 'quillcrm_link_trigger_not_found', __( 'Link trigger not found.', 'quillcrm' ), array( 'status' => 404 ) );
		}

		try {
			$link_trigger->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( Exception $e ) {
			return new WP_Error( 'quillcrm_link_trigger_delete_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare link trigger
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	protected function prepare_link_trigger( $request ) {
		$link_trigger_data = array(
			'name'     => $request->get_param( 'name' ),
			'hash'     => wp_generate_password( 32, false ),
			'status'   => $request->get_param( 'status' ),
			'settings' => $request->get_param( 'settings' ),
		);

		foreach ( $link_trigger_data as $key => $value ) {
			if ( empty( $value ) ) {
				unset( $link_trigger_data[ $key ] );
			}
		}

		return $link_trigger_data;
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}


	/**
	 * Create item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Update item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Delete item permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
