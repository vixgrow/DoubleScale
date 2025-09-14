<?php

/**
 * REST API: class REST_Custom_Field_Controller
 * This class is responsible for handling the custom field controller
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
use QuillCRM\Models\Custom_Field_Model;
use Illuminate\Support\Str;

/**
 * Custom_Field_Controller class
 */
class REST_Custom_Field_Controller extends REST_Controller {







	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'custom-fields';

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
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'Custom field IDs.', 'quillcrm' ),
							'type'        => 'array',
							'items'       => array(
								'type' => 'integer',
							),
							'required'    => true,
						),
					),
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
			 'title'      => 'custom_field',
			 'type'       => 'object',
			 'properties' => array(
				 'id'         => array(
					 'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					 'type'        => 'integer',
					 'readonly'    => true,
				 ),
				 'name'       => array(
					 'description' => __( 'Name of the custom field.', 'quillcrm' ),
					 'type'        => 'string',
					 'required'    => true,
					 'args'        => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'type'       => array(
					 'description' => __( 'Type of the custom field.', 'quillcrm' ),
					 'type'        => 'string',
					 'required'    => true,
					 'enum'        => array(
						 'text',
						 'textarea',
						 'select',
						 'checkbox',
						 'radio',
						 'date',
						 'number',
						 'email',
						 'url',
						 'file',
					 ),
				 ),
				 'attributes' => array(
					 'description' => __( 'Attributes of the custom field.', 'quillcrm' ),
					 'type'        => 'array',
					 'items'       => array(
						 'type'       => 'object',
						 'properties' => array(
							 'label' => array(
								 'description' => __( 'Label of the attribute.', 'quillcrm' ),
								 'type'        => 'string',
								 'required'    => true,
								 'args'        => array(
									 'sanitize_callback' => 'sanitize_text_field',
								 ),
							 ),
							 'value' => array(
								 'description' => __( 'Value of the attribute.', 'quillcrm' ),
								 'type'        => 'string',
								 'required'    => true,
								 'args'        => array(
									 'sanitize_callback' => 'sanitize_text_field',
								 ),
							 ),
						 ),
					 ),
				 ),
				 'group_id'   => array(
					 'description' => __( 'Group ID of the custom field.', 'quillcrm' ),
					 'type'        => 'integer',
					 'required'    => true,
				 ),
				 'scope'      => array(
					 'type'        => 'string',
					 'description' => 'Scope',
					 'required'    => true,
					 'enum'        => array( 'contact', 'deal' ),
				 ),
				 'created_at' => array(
					 'type'        => 'string',
					 'description' => 'Created at',
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'readonly'    => true,
				 ),
				 'updated_at' => array(
					 'type'        => 'string',
					 'description' => 'Updated at',
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'readonly'    => true,
				 ),
			 ),
		 );
	}

	/**
	 * Get all custom fields
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		try {
			$custom_fields = Custom_Field_Model::all();

			return new WP_REST_Response( $custom_fields, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_custom_field_get_items', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get a custom field
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		try {
			$custom_field_id = $request->get_param( 'id' );
			$custom_field    = Custom_Field_Model::find( $custom_field_id );

			if ( ! $custom_field ) {
				return new WP_Error( 'rest_custom_field_get_item', __( 'Custom field not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $custom_field, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_custom_field_get_item', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create a custom field
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		try {
			xdebug_break();
			$custom_field_data = $this->prepare_custom_field( $request );

			// Ensure we have a slug in the data
			if ( ! isset( $custom_field_data['slug'] ) || empty( $custom_field_data['slug'] ) ) {
				// Use the same Str class that's used in the model
				$slug = Str::slug( $custom_field_data['name'] );
				if ( empty( $slug ) ) {
					$slug = 'custom-field-' . time();
				}

				if ( Custom_Field_Model::where( 'slug', $slug )->exists() ) {
					return new WP_Error( 'rest_custom_field_create_item', __( 'Slug already exists', 'quillcrm' ), array( 'status' => 400 ) );
				}

				$custom_field_data['slug'] = $slug;
			}

			try {
				// Create the custom field
				$custom_field = Custom_Field_Model::create( $custom_field_data );

				// Check if the custom field was created successfully
				if ( ! $custom_field || ! isset( $custom_field->id ) || $custom_field->id === 0 ) {
					return new WP_Error( 'rest_custom_field_create_item', __( 'Failed to create custom field', 'quillcrm' ), array( 'status' => 500 ) );
				}

				// Refresh the model from database to ensure we have the correct data
				$custom_field = Custom_Field_Model::find( $custom_field->id );
			} catch ( \Exception $e ) {
				return new WP_Error( 'rest_custom_field_create_item', $e->getMessage(), array( 'status' => 500 ) );
			}

			return new WP_REST_Response( $custom_field, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_custom_field_create_item', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update a custom field
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		try {
			$custom_field_id = $request->get_param( 'id' );
			$custom_field    = Custom_Field_Model::find( $custom_field_id );

			if ( ! $custom_field ) {
				return new WP_Error( 'rest_custom_field_update_item', __( 'Custom field not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$custom_field_data = $this->prepare_custom_field( $request );
			$custom_field->update( $custom_field_data );

			return new WP_REST_Response( $custom_field, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_custom_field_update_item', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete a custom field
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		try {
			$custom_field_id = $request->get_param( 'id' );
			$custom_field    = Custom_Field_Model::find( $custom_field_id );

			if ( ! $custom_field ) {
				return new WP_Error( 'rest_custom_field_delete_item', __( 'Custom field not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$custom_field->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_custom_field_delete_item', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare custom field data
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return array
	 */
	public function prepare_custom_field( $request ) {
		$custom_field_data = array(
			'name'       => $request->get_param( 'name' ),
			'type'       => $request->get_param( 'type' ),
			'attributes' => $request->get_param( 'attributes' ),
			'group_id'   => $request->get_param( 'group_id' ) ? $request->get_param( 'group_id' ) : 0,
			'scope'      => $request->get_param( 'scope' ),
		);

		foreach ( $custom_field_data as $key => $value ) {
			if ( empty( $value ) && 'group_id' !== $key ) {
				unset( $custom_field_data[ $key ] );
			}
		}

		return $custom_field_data;
	}

	/**
	 * Delete multiple custom fields
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_items( $request ) {
		try {
			$ids = $request->get_param( 'ids' );

			if ( empty( $ids ) ) {
				return new WP_Error( 'rest_custom_field_delete_items', __( 'No custom field IDs provided', 'quillcrm' ), array( 'status' => 400 ) );
			}

			$custom_fields = Custom_Field_Model::whereIn( 'id', $ids )->get();

			if ( $custom_fields->isEmpty() ) {
				return new WP_Error( 'rest_custom_field_delete_items', __( 'Custom fields not found', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Delete the custom fields using whereIn and delete method
			Custom_Field_Model::whereIn( 'id', $ids )->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_custom_field_delete_items', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to get a custom field
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to create a custom field
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to update a custom field
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to delete a custom field
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Check if a given request has access to delete multiple custom fields
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool
	 */
	public function delete_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}
}
