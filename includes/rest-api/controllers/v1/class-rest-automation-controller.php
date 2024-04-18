<?php
/**
 * Class Rest_Automation_Controller
 * This class is responsible for handling the Automation REST API
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
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Rest_Automation_Controller class
 */
class Rest_Automation_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'automations';

	/**
	 * Register routes
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
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'The IDs of the items to delete.', 'quillcrm' ),
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
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Get the steps of an automation.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/steps',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_steps' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		// Get the contacts of an automation.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/contacts',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_contacts' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Collection params
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_collection_params() {
		return array(
			'keyword'  => array(
				'description'       => __( 'Search keyword.', 'quillcrm' ),
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'page'     => array(
				'description'       => __( 'Current page of the collection.', 'quillcrm' ),
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'per_page' => array(
				'description'       => __( 'Maximum number of items to be returned in result set.', 'quillcrm' ),
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
		);
	}

	/**
	 * Schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'automation',
			'type'       => 'object',
			'properties' => array(
				'id'         => array(
					'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'name'       => array(
					'description' => __( 'The name of the automation.', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'trigger'    => array(
					'description' => __( 'The trigger of the automation.', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status'     => array(
					'description' => __( 'The status of the automation.', 'quillcrm' ),
					'type'        => 'string',
					'enum'        => array( 'active', 'inactive' ),
					'default'     => 'active',
				),
				'settings'   => array(
					'description' => __( 'The settings of the automation.', 'quillcrm' ),
					'type'        => 'object',
				),
				'created_at' => array(
					'description' => __( 'The date the automation was created.', 'quillcrm' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'readonly'    => true,
				),
				'updated_at' => array(
					'description' => __( 'The date the automation was last updated.', 'quillcrm' ),
					'type'        => 'string',
					'format'      => 'date-time',
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
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		try {
			$per_page = $request->get_param( 'per_page' ) ?? 10;
			$page     = $request->get_param( 'page' ) ?? 1;
			$keyword  = $request->get_param( 'keyword' ) ?? '';

			if ( $keyword ) {
				$automations = Automation_Model::where( 'name', 'like', '%' . $keyword . '%' )
					->paginate( $per_page, array( '*' ), 'page', $page );
			} else {
				$automations = Automation_Model::paginate( $per_page, array( '*' ), 'page', $page );
			}

			return new WP_REST_Response( $automations, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get steps
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_steps( $request ) {
		try {
			$id    = $request->get_param( 'id' );
			$steps = Automation_Step_Model::where( 'automation_id', $id )->get();

			if ( ! $steps ) {
				return new WP_Error( 'not_found', __( 'Steps not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$steps = $steps->toArray();

			return new WP_REST_Response( $steps, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_contacts( $request ) {
		try {
			$id                  = $request->get_param( 'id' );
			$automation_contacts = Automation_Contact_Model::where( 'automation_id', $id )->get();
			$contacts            = array();

			foreach ( $automation_contacts as $automation_contact ) {
				$contacts[] = $automation_contact->contact;
			}

			return new WP_REST_Response( $contacts, 200 );
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
			$id         = $request->get_param( 'id' );
			$automation = Automation_Model::find( $id );

			if ( ! $automation ) {
				return new WP_Error( 'not_found', __( 'Automation not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Get the automation with its steps.
			$automation = Automation_Model::with( 'steps' )->find( $id );

			return new WP_REST_Response( $automation, 200 );
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
			$automation_data = $this->prepare_automation( $request );
			$automation      = Automation_Model::create( $automation_data );

			if ( ! $automation ) {
				return new WP_Error( 'error', __( 'Failed to create automation.', 'quillcrm' ), array( 'status' => 500 ) );
			}

			return new WP_REST_Response( $automation, 201 );
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
			$id         = $request->get_param( 'id' );
			$automation = Automation_Model::find( $id );

			if ( ! $automation ) {
				return new WP_Error( 'not_found', __( 'Automation not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$automation_data = $this->prepare_automation( $request );
			$automation->fill( $automation_data );
			$automation->save();

			return new WP_REST_Response( $automation, 200 );
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
			$id         = $request->get_param( 'id' );
			$automation = Automation_Model::find( $id );

			if ( ! $automation ) {
				return new WP_Error( 'not_found', __( 'Automation not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$automation->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare automation
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	protected function prepare_automation( $request ) {
		$automation_data = array(
			'name'     => $request->get_param( 'name' ),
			'trigger'  => $request->get_param( 'trigger' ),
			'status'   => $request->get_param( 'status' ) ?? 'active',
			'settings' => $request->get_param( 'settings' ) ?? array(),
		);

		foreach ( $automation_data as $key => $value ) {
			if ( empty( $value ) ) {
				unset( $automation_data[ $key ] );
			}
		}

		return $automation_data;
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
	 * Delete items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_items_permissions_check( $request ) {
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
