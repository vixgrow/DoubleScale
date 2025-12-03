<?php

/**
 * Class Rest_Contact_Note_Controller
 * This class is responsible for handling the contact note rest api
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Rest_Api\Controllers\V1;

use QuillCRM\User_Roles\Permissions;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Activity_Model;

/**
 * Contact_Note_Controller class
 */
class Rest_Contact_Note_Controller extends REST_Controller {


	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'contact-notes';

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
			 'title'      => 'contact',
			 'type'       => 'object',
			 'properties' => array(
				 'id'         => array(
					 'type'        => 'integer',
					 'description' => 'Unique identifier for the object.',
					 'readonly'    => true,
				 ),
				 'contact_id' => array(
					 'type'        => 'integer',
					 'description' => 'Contact ID',
				 ),
				 'title'      => array(
					 'type'        => 'string',
					 'description' => 'Title',
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'type'       => array(
					 'type'        => 'string',
					 'description' => 'Type',
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'note'       => array(
					 'type'        => 'string',
					 'description' => 'Note',
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'created_at' => array(
					 'type'        => 'string',
					 'description' => 'Created at',
					 'readonly'    => true,
				 ),
				 'updated_at' => array(
					 'type'        => 'string',
					 'description' => 'Updated at',
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
			$activities = Activity_Model::notes()->get();

			// Transform activities to note format
			$notes = $activities->map(
				function ( $activity ) {
					return $activity->to_note_format();
				}
			)->values();

			return new WP_REST_Response( $notes, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_contact_note_error', $e->getMessage(), array( 'status' => 500 ) );
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
			$note_id  = $request->get_param( 'id' );
			$activity = Activity_Model::notes()->find( $note_id );

			if ( ! $activity ) {
				return new WP_Error( 'rest_contact_note_error', __( 'Contact note not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $activity->to_note_format(), 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_contact_note_error', $e->getMessage(), array( 'status' => 500 ) );
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
			$note_data = $this->prepare_note( $request );

			if ( empty( $note_data['contact_id'] ) ) {
				return new WP_Error( 'rest_contact_note_error', __( 'Contact ID is required.', 'quillcrm' ), array( 'status' => 400 ) );
			}

			// Create activity with note data stored in JSON
			$activity = Activity_Model::create(
				array(
					'contact_id'    => $note_data['contact_id'],
					'activity_type' => 'note',
					'data'          => array(
						'title' => $note_data['title'] ?? '',
						'type'  => $note_data['type'] ?? 'note',
						'note'  => $note_data['note'] ?? '',
					),
					'user_id'       => get_current_user_id() ?: null,
				)
			);

			return new WP_REST_Response( $activity->to_note_format(), 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_contact_note_error', $e->getMessage(), array( 'status' => 500 ) );
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
			$note_id  = $request->get_param( 'id' );
			$activity = Activity_Model::notes()->find( $note_id );

			if ( ! $activity ) {
				return new WP_Error( 'rest_contact_note_error', __( 'Contact note not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$note_data = $this->prepare_note( $request );

			// Update the data JSON with new note values
			$current_data = $activity->data ?? array();
			if ( isset( $note_data['title'] ) ) {
				$current_data['title'] = $note_data['title'];
			}
			if ( isset( $note_data['type'] ) ) {
				$current_data['type'] = $note_data['type'];
			}
			if ( isset( $note_data['note'] ) ) {
				$current_data['note'] = $note_data['note'];
			}

			// Update activity
			$activity->data = $current_data;
			if ( isset( $note_data['contact_id'] ) ) {
				$activity->contact_id = $note_data['contact_id'];
			}
			$activity->save();

			return new WP_REST_Response( $activity->to_note_format(), 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_contact_note_error', $e->getMessage(), array( 'status' => 500 ) );
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
			$note_id  = $request->get_param( 'id' );
			$activity = Activity_Model::notes()->find( $note_id );

			if ( ! $activity ) {
				return new WP_Error( 'rest_contact_note_error', __( 'Contact note not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			$activity->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_contact_note_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare note
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	private function prepare_note( $request ) {
		$note_data = array(
			'contact_id' => $request->get_param( 'contact_id' ),
			'note'       => $request->get_param( 'note' ),
			'title'      => $request->get_param( 'title' ),
			'type'       => $request->get_param( 'type' ),
		);

		foreach ( $note_data as $key => $value ) {
			if ( empty( $value ) ) {
				unset( $note_data[ $key ] );
			}
		}

		return $note_data;
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
		return Permissions::has_crm_manager_access();
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
		return Permissions::has_crm_manager_access();
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
		return Permissions::has_crm_manager_access();
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
		return Permissions::has_crm_manager_access();
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
		return Permissions::has_crm_manager_access();
	}
}
