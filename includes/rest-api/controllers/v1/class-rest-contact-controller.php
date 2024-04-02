<?php
/**
 * REST API: Contact Controller
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
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\List_Model;
use QuillCRM\Models\Tag_Model;
use QuillCRM\Models\Custom_Field_Model;

/**
 * REST_Contact_Controller is REST api controller class for log
 *
 * @since 1.0.0
 */
class REST_Contact_Controller extends REST_Controller {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'contacts';

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
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
				),
			)
		);

		// Get contact
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
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
					'args'                => $this->get_endpoint_args_for_item_schema( false ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Get contact notes
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/notes',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_contact_notes' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Schema for the contact
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The contact schema
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'contact',
			'type'       => 'object',
			'properties' => array(
				'id'         => array(
					'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					'type'        => 'integer',
					'readonly'    => true,
				),
				'first_name' => array(
					'description'  => __( 'First name of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'last_name'  => array(
					'description'  => __( 'Last name of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'email'      => array(
					'description'  => __( 'Email of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'required'     => true,
					'args_options' => array(
						'sanitize_callback' => 'sanitize_email',
					),
				),
				'phone'      => array(
					'description'  => __( 'Phone number of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'address_1'  => array(
					'description'  => __( 'Address line 1 of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'address_2'  => array(
					'description'  => __( 'Address line 2 of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'city'       => array(
					'description'  => __( 'City of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'state'      => array(
					'description'  => __( 'State of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'country'    => array(
					'description'  => __( 'Country of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'zip'        => array(
					'description'  => __( 'Zip code of the contact.', 'quillcrm' ),
					'type'         => 'string',
					'args_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
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
	 * Get a collection of contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function get_items( $request ) {
		try {
			$per_page = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page     = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$keyword  = $request->get_param( 'keyword' ) ?? '';

			if ( '' !== $keyword ) {
				$contacts = Contact_Model::with( 'lists', 'tags', 'custom_fields', 'notes' )
				->where( 'first_name', 'like', '%' . $keyword . '%' )
				->orWhere( 'last_name', 'like', '%' . $keyword . '%' )
				->orWhere( 'email', 'like', '%' . $keyword . '%' )
				->orWhere( 'phone', 'like', '%' . $keyword . '%' )
				->paginate( $per_page, array( '*' ), 'page', $page );
			} else {
				$contacts = Contact_Model::with( 'lists', 'tags', 'custom_fields', 'notes' )->paginate( $per_page, array( '*' ), 'page', $page );
			}

			return new WP_REST_Response( $contacts, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get a collection of contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function create_item( $request ) {
		$email = $request->get_param( 'email' );

		// Check if email already exists
		$contact = Contact_Model::where( 'email', $email )->first();
		if ( $contact ) {
			return new WP_Error( 'contact_exists', 'Contact already exists', array( 'status' => 400 ) );
		}

		try {
			$contact_data = $this->prepare_contact( $request );
			$contact      = Contact_Model::create( $contact_data );

			$sync_lists = $this->sync_lists( $request, $contact );
			if ( is_wp_error( $sync_lists ) ) {
				return $sync_lists;
			}

			$sync_tags = $this->sync_tags( $request, $contact );
			if ( is_wp_error( $sync_tags ) ) {
				return $sync_tags;
			}

			$sync_custom_fields = $this->sync_custom_fields( $request, $contact );
			if ( is_wp_error( $sync_custom_fields ) ) {
				return $sync_custom_fields;
			}

			$sync_notes = $this->sync_notes( $request, $contact );
			if ( is_wp_error( $sync_notes ) ) {
				return $sync_notes;
			}

			return new WP_REST_Response( $contact, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Delete a collection of contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function delete_items( $request ) {
		try {
			$contact_ids = $request->get_param( 'ids' ) ? $request->get_param( 'ids' ) : array();
			$contacts    = Contact_Model::find( $contact_ids );

			if ( ! $contacts ) {
				return new WP_Error( 'not_found', 'Contacts not found', array( 'status' => 404 ) );
			}

			foreach ( $contacts as $contact ) {
				$contact->delete();
			}

			return new WP_REST_Response( $contacts, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Delete a contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function delete_item( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$contact->delete();

			return new WP_REST_Response( $contact, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get a contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function get_item( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $contact, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Update a contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function update_item( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$contact_data = $this->prepare_contact( $request );
			$contact->update( $contact_data );

			$sync_lists = $this->sync_lists( $request, $contact );
			if ( is_wp_error( $sync_lists ) ) {
				return $sync_lists;
			}

			$sync_tags = $this->sync_tags( $request, $contact );
			if ( is_wp_error( $sync_tags ) ) {
				return $sync_tags;
			}

			$sync_custom_fields = $this->sync_custom_fields( $request, $contact );
			if ( is_wp_error( $sync_custom_fields ) ) {
				return $sync_custom_fields;
			}

			$sync_notes = $this->sync_notes( $request, $contact );
			if ( is_wp_error( $sync_notes ) ) {
				return $sync_notes;
			}

			return new WP_REST_Response( $contact, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get contact notes
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function get_contact_notes( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$notes = $contact->notes()->get();

			return new WP_REST_Response( $notes, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
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
	 * Check if a given request has access to delete items
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
	 * Check if a given request has access to update items
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
	 * Check if a given request has access to delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function delete_items_permissions_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Prepare contact from request
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return array $contact The contact model.
	 */
	protected function prepare_contact( $request ) {
		$contact = array(
			'first_name' => $request->get_param( 'first_name' ),
			'last_name'  => $request->get_param( 'last_name' ),
			'email'      => $request->get_param( 'email' ),
			'phone'      => $request->get_param( 'phone' ),
			'address_1'  => $request->get_param( 'address_1' ),
			'address_2'  => $request->get_param( 'address_2' ),
			'city'       => $request->get_param( 'city' ),
			'state'      => $request->get_param( 'state' ),
			'country'    => $request->get_param( 'country' ),
			'zip'        => $request->get_param( 'zip' ),
		);

		foreach ( $contact as $key => $value ) {
			if ( ! $value ) {
				unset( $contact[ $key ] );
			}
		}

		return $contact;
	}

	/**
	 * Add lists to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @param Contact_Model   $contact The contact model.
	 *
	 * @return void
	 */
	protected function sync_lists( $request, $contact ) {
		try {
			$lists = $request->get_param( 'lists' );
			if ( $lists ) {
				$lists     = $lists;
				$lists_arr = array();

				foreach ( $lists as $list ) {
					if ( isset( $list['type'] ) && 'new' === $list['type'] ) {
						$list = List_Model::create( array( 'name' => $list['name'] ) );
						if ( $list ) {
							$lists_arr[] = $list->id;
						}
					} else {
						$list = List_Model::find( $list['id'] );
						if ( $list ) {
							$lists_arr[] = $list->id;
						}
					}
				}

				// Remove all lists and add the new ones
				$contact->lists()->sync( $lists_arr );
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Add tags to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @param Contact_Model   $contact The contact model.
	 *
	 * @return void
	 */
	protected function sync_tags( $request, $contact ) {
		try {
			$tags = $request->get_param( 'tags' );
			if ( $tags ) {
				$tags     = $tags;
				$tags_arr = array();

				foreach ( $tags as $tag ) {
					if ( isset( $tag['type'] ) && 'new' === $tag['type'] ) {
						$tag = Tag_Model::create( array( 'name' => $tag['name'] ) );
						if ( $tag ) {
							$tags_arr[] = $tag->id;
						}
					} else {
						$tag = Tag_Model::find( $tag['id'] );
						if ( $tag ) {
							$tags_arr[] = $tag->id;
						}
					}
				}

				$contact->tags()->sync( $tags_arr );
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Sync custom fields to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return void|WP_Error
	 */
	protected function sync_custom_fields( $request, $contact ) {
		try {
			$custom_fields = $request->get_param( 'custom_fields' );
			if ( $custom_fields ) {
				$custom_fields     = $custom_fields;
				$custom_fields_arr = array();

				foreach ( $custom_fields as $custom_field ) {
					// Check if custom field exists
					$custom_field_model = Custom_Field_Model::find( $custom_field['id'] );
					if ( ! $custom_field_model ) {
						return new WP_Error( 'error', __( 'Custom field not found', 'quillcrm' ), array( 'status' => 400 ) );
					}

					if ( ! $custom_field_model->validate_value( $custom_field['value'] ) ) {
						continue;
					}

					$custom_fields_arr[ $custom_field['id'] ] = array( 'value' => $custom_field['value'] );
				}

				$contact->custom_fields()->sync( $custom_fields_arr );
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Sync notes to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return void|WP_Error
	 */
	protected function sync_notes( $request, $contact ) {
		try {
			$notes = $request->get_param( 'notes' );
			if ( $notes ) {
				$notes     = $notes;
				$notes_arr = array();

				foreach ( $notes as $note ) {
					$notes_arr[] = array(
						'note' => sanitize_text_field( $note['text'] ),
					);
				}

				$contact->notes()->createMany( $notes_arr );
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}
}
