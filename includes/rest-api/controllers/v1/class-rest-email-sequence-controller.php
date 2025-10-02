<?php

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Campaign_Model as Email_Sequence_Model;
use QuillCRM\User_Roles\Permissions;

class REST_Email_Sequence_Controller extends REST_Controller {

























	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'email-sequences';

	/**
	 * Campaign type
	 *
	 * @var string
	 */
	protected $campaign_type       = 'email_sequence';
	protected $campaign_type_child = 'sequence_mail';




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
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'parent_id'   => array(
							'description'       => __( 'Parent ID.', 'quillcrm' ),
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						),
						'name'        => array(
							'description'       => __( 'Name.', 'quillcrm' ),
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'required'          => true,
						),
						'description' => array(
							'description'       => __( 'Description.', 'quillcrm' ),
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'status'      => array(
							'description'       => __( 'Status.', 'quillcrm' ),
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'required'          => true,
						),
						'settings'    => array(
							'description'       => __( 'Settings.', 'quillcrm' ),
							'type'              => 'array',
							'sanitize_callback' => 'sanitize_text_field',

						),
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'keywords' => array(
							'description'       => __( 'Search keywords.', 'quillcrm' ),
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'per_page' => array(
							'description'       => __( 'Maximum number of items to be returned in result set.', 'quillcrm' ),
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						),
						'page'     => array(
							'description'       => __( 'Current page of the collection.', 'quillcrm' ),
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						),
						'from'     => array(
							'description' => __( 'Start date for filtering email sequences.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
						'to'       => array(
							'description' => __( 'End date for filtering email sequences.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
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

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/duplicate',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'duplicate_item' ),
					'permission_callback' => array( $this, 'duplicate_item_permissions_check' ),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/bulk',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
				),
			)
		);
	}



	/**
	 * Create a email sequence
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function create_item( $request ) {
		try {
			$email_sequence_data = $this->prepare_email_sequence( $request );
			$parent_id           = $request->get_param( 'parent_id' );
			if ( $parent_id ) {
				$parent_email_sequence = Email_Sequence_Model::find( $parent_id );
				if ( ! $parent_email_sequence ) {
					return new WP_Error( 'error', sprintf( __( '%s Email sequence not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ), array( 'status' => 404 ) );
				}
			}
			$email_sequence = Email_Sequence_Model::create( $email_sequence_data );

			return new WP_REST_Response( $email_sequence, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get the email sequences
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_items( $request ) {
		$keywords = $request->get_param( 'keywords' ) ?? null;
		$per_page = $request->get_param( 'per_page' ) ?? 10;
		$page     = $request->get_param( 'page' ) ?? 1;
		$from     = $request->get_param( 'from' ) ?? null;
		$to       = $request->get_param( 'to' ) ?? null;

		$query = Email_Sequence_Model::where( 'type', $this->campaign_type );

		if ( $keywords ) {
			$query->where( 'name', 'like', '%' . $keywords . '%' );
		}
		if ( $from ) {
			$query->where( 'created_at', '>=', $from );
		}
		if ( $to ) {
			$query->where( 'created_at', '<=', $to );
		}

		$total_count     = $query->count();
		$email_sequences = $query->orderBy( 'created_at', 'desc' )->paginate( $per_page, array( '*' ), 'page', $page );
		foreach ( $email_sequences as $email_sequence ) {
			$email_count                      = $email_sequence->sequences_mail()->count();
			$email_sequence->email_count      = $email_count;
			$email_sequence->subscriber_count = $email_sequence->count;
		}
		return new WP_REST_Response( $email_sequences->toArray() + array( 'total_count' => $total_count ), 200 );
	}

	/**
	 * Delete the email sequences
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function delete_items( $request ) {
		try {
			$email_sequence_ids = $request->get_param( 'email_sequence_ids' );
			$email_sequences    = Email_Sequence_Model::whereIn( 'id', $email_sequence_ids )->get();

			if ( $email_sequences->isEmpty() ) {
				return new WP_Error( 'error', sprintf( __( '%s Email sequences not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ), array( 'status' => 404 ) );
			}

			$email_sequences = Email_Sequence_Model::whereIn( 'id', $email_sequence_ids )->get();
			$email_sequences->each->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get the email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_item( $request ) {
		try {
			$email_sequence_id = $request->get_param( 'id' );
			$email_sequence    = Email_Sequence_Model::where( 'id', $email_sequence_id )->with( 'sequences_mail' )->first();

			if ( ! $email_sequence ) {
				return new WP_Error( 'error', sprintf( __( '%s Email sequence not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $email_sequence, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update the email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function update_item( $request ) {
		try {
			$email_sequence_id = $request->get_param( 'id' );
			$email_sequence    = Email_Sequence_Model::find( $email_sequence_id );

			if ( ! $email_sequence ) {
				return new WP_Error( 'error', sprintf( __( '%s Email sequence not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ), array( 'status' => 404 ) );
			}

			$email_sequence_data = $this->prepare_email_sequence( $request );
			$email_sequence->update( $email_sequence_data );

			return new WP_REST_Response( $email_sequence, 200 );
		} catch ( \Exception $e ) {
			$logger = quillcrm_get_logger();
			$logger->error(
				'Email sequence update error: ' . $e->getMessage(),
				array(
					'email_sequence_id' => $email_sequence_id,
					'trace'             => $e->getTraceAsString(),
				)
			);
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete the email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function delete_item( $request ) {
		try {
			$email_sequence_id = $request->get_param( 'id' );
			$email_sequence    = Email_Sequence_Model::find( $email_sequence_id );

			if ( ! $email_sequence ) {
				return new WP_Error( 'error', sprintf( __( '%s Email sequence not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ), array( 'status' => 404 ) );
			}

			$email_sequence->delete();

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Duplicate the email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function duplicate_item( $request ) {
		try {
			$email_sequence_id = $request->get_param( 'id' );
			$type              = $request->get_param( 'type' );
			$email_sequence    = Email_Sequence_Model::find( $email_sequence_id );
			if ( ! $email_sequence ) {
				return new WP_Error( 'error', sprintf( __( '%s Email sequence not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ), array( 'status' => 404 ) );
			}

			$new_email_sequence = null;

			if ( $type === $this->campaign_type ) {
				$email_sequence_data = $email_sequence->toArray();
				unset( $email_sequence_data['id'], $email_sequence_data['created_at'], $email_sequence_data['updated_at'] );

				$email_sequence_data['status'] = 'draft';
				$email_sequence_data['name']   = $email_sequence_data['name'] . ' - Copy';
				$new_email_sequence            = Email_Sequence_Model::create( $email_sequence_data );
				foreach ( $email_sequence->sequences_mail as $sequence_mail ) {
					$sequence_mail_data = $sequence_mail->toArray();
					unset( $sequence_mail_data['id'], $sequence_mail_data['created_at'], $sequence_mail_data['updated_at'] );
					$sequence_mail_data['parent_id'] = $new_email_sequence->id;
					$sequence_mail_data['type']      = $this->campaign_type_child;
					$sequence_mail_data['status']    = 'draft';
					$sequence_mail_data['name']      = $sequence_mail_data['name'] . ' - Copy';
					Email_Sequence_Model::create( $sequence_mail_data );
				}
			} elseif ( $type === $this->campaign_type_child ) {
				$email_sequence_data = $email_sequence->toArray();
				unset( $email_sequence_data['id'], $email_sequence_data['created_at'], $email_sequence_data['updated_at'] );
				$email_sequence_data['status'] = 'draft';
				$email_sequence_data['name']   = $email_sequence_data['name'] . ' - Copy';
				$new_email_sequence            = Email_Sequence_Model::create( $email_sequence_data );
			}

			return new WP_REST_Response( $new_email_sequence, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Prepare the email sequence data
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return array $email_sequence_data The email sequence data
	 */
	private function prepare_email_sequence( $request ) {
		$email_sequence_data = $request->get_params();
		return $email_sequence_data;
	}

	/**
	 * Check if the user has permission to create a email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission Whether the user has permission to create a email sequence
	 */
	public function create_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if the user has permission to get the email sequences
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission Whether the user has permission to get the email sequences
	 */
	public function get_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if the user has permission to delete the email sequences
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission Whether the user has permission to delete the email sequences
	 */
	public function delete_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if the user has permission to get the email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission Whether the user has permission to get the email sequence
	 */
	public function get_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if the user has permission to update the email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission Whether the user has permission to update the email sequence
	 */
	public function update_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if the user has permission to delete the email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission Whether the user has permission to delete the email sequence
	 */
	public function delete_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if the user has permission to duplicate the email sequence
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission Whether the user has permission to duplicate the email sequence
	 */
	public function duplicate_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
