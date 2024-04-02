<?php
/**
 * Class Custom_Fields_Group_Controller
 * This class is responsible for handling the custom fields group controller
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Custom_Fields_Group_Model;

/**
 * Custom_Fields_Group_Controller class
 */
class REST_Custom_Fields_Group_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'custom-fields-groups';

	/**
	 * Register the routes for the controller.
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
					'args'                => array(
						'new_group_id' => array(
							'description' => __( 'New group id to move the fields.', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
				),
			)
		);

		// Get fields for a group.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/fields',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the resource.', 'quillcrm' ),
						'type'        => 'integer',
						'required'    => true,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fields' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Get schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'custom_fields_group',
			'type'       => 'object',
			'properties' => array(
				'id'   => array(
					'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'name' => array(
					'description' => __( 'Name of the custom fields group.', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
				),
				'slug' => array(
					'description' => __( 'Slug of the custom fields group.', 'quillcrm' ),
					'type'        => 'string',
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
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		try {
			$groups = Custom_Fields_Group_Model::with( 'custom_fields' )->get();

			return new WP_REST_Response( $groups, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		try {
			$group_id = $request->get_param( 'id' );
			$group    = Custom_Fields_Group_Model::find( $group_id );

			if ( ! $group ) {
				return new WP_Error( 'error', __( 'Custom fields group not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $group, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_fields( $request ) {
		try {
			$group_id = $request->get_param( 'id' );
			$group    = Custom_Fields_Group_Model::find( $group_id );

			if ( ! $group ) {
				return new WP_Error( 'error', __( 'Custom fields group not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$fields = $group->custom_fields;

			return new WP_REST_Response( $fields, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function create_item( $request ) {
		try {
			$group = $this->prepare_group( $request );

			$group_id = Custom_Fields_Group_Model::create( $group );

			$group = Custom_Fields_Group_Model::find( $group_id );

			return new WP_REST_Response( $group, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {
		try {
			$group_id = $request->get_param( 'id' );
			$group    = Custom_Fields_Group_Model::find( $group_id );

			if ( ! $group ) {
				return new WP_Error( 'error', __( 'Custom fields group not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$group_data = $this->prepare_group( $request );

			$group->update( $group_data );

			$group = Custom_Fields_Group_Model::find( $group_id );

			return new WP_REST_Response( $group, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete_item( $request ) {
		try {
			$group_id = $request->get_param( 'id' );
			$group    = Custom_Fields_Group_Model::find( $group_id );

			if ( ! $group ) {
				return new WP_Error( 'error', __( 'Custom fields group not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// First move all the fields to the the given group.
			$new_group_id = $request->get_param( 'new_group_id' );
			$new_group    = Custom_Fields_Group_Model::find( $new_group_id );

			if ( ! $new_group ) {
				return new WP_Error( 'error', __( 'New group not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$fields = $group->custom_fields;
			// Use method to move fields to new group.
			$new_group->custom_fields()->associate( $fields );

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
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
	 * @return bool
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
	 * @return bool
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
	 * @return bool
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
	 * @return bool
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Prepare group from request
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return array $group The group model.
	 */
	protected function prepare_group( $request ) {
		$group = array(
			'name' => $request->get_param( 'name' ),
			'slug' => $request->get_param( 'slug' ),
		);

		foreach ( $group as $key => $value ) {
			if ( ! $value ) {
				unset( $group[ $key ] );
			}
		}

		return $group;
	}
}
