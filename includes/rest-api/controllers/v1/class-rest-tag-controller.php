<?php
/**
 * REST API: Tag Controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Tag_Model;

/**
 * Tag Controller class
 */
class REST_Tag_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'tags';

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
					'args'                => array(
						'keyword'    => array(
							'description' => __( 'Keyword to search.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'text-field',
						),
						'per_page'   => array(
							'description' => __( 'Number of items to fetch.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'page'       => array(
							'description' => __( 'Page number.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'ids'        => array(
							'description' => __( 'IDs of tags to fetch.', 'quillcrm' ),
							'type'        => 'array',
							'items'       => array(
								'type' => 'integer',
							),
						),
						'contact_id' => array(
							'description' => __( 'Contact ID.', 'quillcrm' ),
							'type'        => 'integer',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'deletes_item' ),
					'permission_callback' => array( $this, 'deletes_item_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'Tag IDs.', 'quillcrm' ),
							'type'        => 'array',
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
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
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
	 * Schema for the tag
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'tag',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'name'        => array(
					'description' => __( 'Name of the tag.', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'slug'        => array(
					'description' => __( 'An alphanumeric identifier for the tag.', 'quillcrm' ),
					'type'        => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_title',
					),
				),
				'description' => array(
					'description' => __( 'Description of the tag.', 'quillcrm' ),
					'type'        => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status'      => array(
					'description' => __( 'Status of the tag.', 'quillcrm' ),
					'type'        => 'string',
					'enum'        => array( 'active', 'inactive' ),
				),
				'created_at'  => array(
					'type'        => 'string',
					'description' => 'Created at',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'updated_at'  => array(
					'type'        => 'string',
					'description' => 'Updated at',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
			),
		);
	}

	/**
	 * Get a collection of items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		try {
			$per_page   = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page       = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$keyword    = $request->get_param( 'keyword' ) ?? '';
			$ids        = $request->get_param( 'ids' ) ?? array();
			$contact_id = $request->get_param( 'contact_id' ) ?? '';

			if ( ! empty( $ids ) ) {
				$tags = Tag_Model::whereIn( 'id', $ids )->paginate( $per_page, array( '*' ), 'page', $page );

				return new WP_REST_Response( $tags, 200 );
			}

			$tags = Tag_Model::query();

			if ( '' !== $keyword ) {
				$tags = $tags->where( 'name', 'LIKE', '%' . $keyword . '%' )
					->orWhere( 'description', 'LIKE', '%' . $keyword . '%' );
			}

			if ( '' !== $contact_id ) {
				$tags = $tags->whereDoesntHave(
					'contacts',
					function( $q ) use ( $contact_id ) {
						$q->where( 'contact_id', $contact_id );
					}
				);
			}

			$tags = $tags->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $tags, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_tag_cannot_read', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function get_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Create one item from the collection
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		try {
			$tag_data = $this->prepare_tag( $request );
			$tag      = Tag_Model::create( $tag_data );

			return new WP_REST_Response( $tag, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_tag_cannot_create', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to create items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function create_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get one item from the collection
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		try {
			$tag = Tag_Model::find( $request->get_param( 'id' ) );

			if ( ! $tag ) {
				return new WP_Error( 'rest_tag_cannot_read', __( 'Tag not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $tag, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_tag_cannot_read', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to get a specific item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function get_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Update one item from the collection
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		try {
			$tag_id = $request->get_param( 'id' );
			$tag    = Tag_Model::find( $tag_id );

			if ( ! $tag ) {
				return new WP_Error( 'rest_tag_cannot_update', __( 'Tag not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$tag_data = $this->prepare_tag( $request );
			$tag->update( $tag_data );

			return new WP_REST_Response( $tag, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_tag_cannot_update', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to update a specific item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function update_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Delete one item from the collection
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		try {
			$tag_id = $request->get_param( 'id' );
			$tag    = Tag_Model::find( $tag_id );

			if ( ! $tag ) {
				return new WP_Error( 'rest_tag_cannot_delete', __( 'Tag not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$tag->delete();

			return new WP_REST_Response( $tag, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_tag_cannot_delete', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to delete a specific item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function delete_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Delete multiple items from the collection
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function deletes_item( $request ) {
		try {
			$ids = $request->get_param( 'ids' );

			if ( empty( $ids ) ) {
				return new WP_Error( 'rest_tag_cannot_delete', __( 'No tags to delete.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$tags = Tag_Model::whereIn( 'id', $ids )->get();

			if ( ! $tags ) {
				return new WP_Error( 'rest_tag_cannot_delete', __( 'Tags not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			Tag_Model::whereIn( 'id', $ids )->delete();

			return new WP_REST_Response( $tags, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_tag_cannot_delete', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to delete multiple items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function deletes_item_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Prepare tag from request
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return array $tag The tag model.
	 */
	protected function prepare_tag( $request ) {
		$tag = array(
			'name'        => $request->get_param( 'name' ),
			'slug'        => $request->get_param( 'slug' ),
			'description' => $request->get_param( 'description' ),
			'status'      => $request->get_param( 'status' ),
		);

		foreach ( $tag as $key => $value ) {
			if ( ! $value ) {
				unset( $tag[ $key ] );
			}
		}

		return $tag;
	}
}
