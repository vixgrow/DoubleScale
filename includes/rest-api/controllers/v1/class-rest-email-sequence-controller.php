<?php

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\Constants\Message_Source_Types;
use QuillCRM\Managers\Email_Sequences_Manager;
use QuillCRM\Models\Tracking_Model;
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
							'sanitize_callback' => array( $this, 'sanitize_settings' ),
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
					'args'                => array(
						'settings' => array(
							'description'       => __( 'Settings.', 'quillcrm' ),
							'type'              => 'array',
							'sanitize_callback' => array( $this, 'sanitize_settings' ),
						),
					),
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
			'/' . $this->rest_base . '/(?P<id>[\d]+)/reports',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item_reports' ),
					'permission_callback' => array( $this, 'get_item_reports_permissions_check' ),
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
			if ( isset( $email_sequence_data['settings']['delay'] ) ) {
				$execute_at                        = Email_Sequences_Manager::instance()->calculate_execution_time( $email_sequence_data['settings']['delay'] );
				$email_sequence_data['execute_at'] = $execute_at;
			}
			$email_sequence_data['execute_at'] = $execute_at;

			if ( empty( $email_sequence_data['settings'] ) || ! is_array( $email_sequence_data['settings'] ) ) {
				$email_sequence_data['settings'] = array();
			}

			$parent_id = $request->get_param( 'parent_id' );
			if ( $parent_id ) {
				$parent_email_sequence = Email_Sequence_Model::find( $parent_id );
				if ( ! $parent_email_sequence ) {
					return new WP_Error( 'error', sprintf( __( '%s Email sequence not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ), array( 'status' => 404 ) );
				}
				$email_sequence_data['settings']['templates'] = array(
					array(
						'body'     => sanitize_text_field( $email_sequence_data['settings']['email_body'] ?? '' ),
						'subject'  => sanitize_text_field( $email_sequence_data['settings']['subject'] ?? '' ),
						'name'     => sanitize_text_field( $email_sequence_data['settings']['subject'] ?? '' ),
						'settings' => array(
							'from_name'    => sanitize_text_field( $parent_email_sequence['settings']['from_name'] ?? get_bloginfo( 'name' ) ),
							'from_email'   => sanitize_text_field( $parent_email_sequence['settings']['from_email'] ?? get_option( 'admin_email' ) ),
							'reply_to'     => sanitize_text_field( $parent_email_sequence['settings']['reply_to_email'] ?? get_option( 'admin_email' ) ),
							'preview_text' => sanitize_text_field( $email_sequence_data['settings']['pre_header'] ?? '' ),
						),
					),
				);
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

			// Fetch sequence with related mails
			$email_sequence = Email_Sequence_Model::where( 'id', $email_sequence_id )
				->with( 'sequences_mail' )
				->first();

			if ( ! $email_sequence ) {
				return new WP_Error(
					'error',
					sprintf( __( '%s Email sequence not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ),
					array( 'status' => 404 )
				);
			}

			// Sort sequences_mail by delay in settings
			if ( $email_sequence->sequences_mail ) {
				$sorted_sequences = $email_sequence->sequences_mail->sortBy(
					function ( $item ) {
						return $this->get_delay_in_minutes( $item->settings );
					}
				);

				$email_sequence->setRelation( 'sequences_mail', $sorted_sequences->values() );
			}

			return new WP_REST_Response( $email_sequence, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get the email sequence reports
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_item_reports( $request ) {
		try {
			$email_sequence_id = $request->get_param( 'id' );
			$email_sequence    = Email_Sequence_Model::find( $email_sequence_id );
			if ( ! $email_sequence || $email_sequence->parent_id === null || $email_sequence->parent_id <= 0 ) {
				return new WP_Error( 'error', sprintf( __( '%s Email sequence not found', 'quillcrm' ), ucfirst( $this->campaign_type ) ), array( 'status' => 404 ) );
			}
			$parent_email_sequence        = Email_Sequence_Model::find( $email_sequence->parent_id );
			$total_contacts               = count( $parent_email_sequence->settings['contact_ids'] ?? array() );
			$email_sequence['sent_rate']  = $email_sequence->sent / ( $total_contacts > 0 ? $total_contacts : 1 ) * 100;
			$email_sequence['open_rate']  = $email_sequence->opened / ( $email_sequence->sent > 0 ? $email_sequence->sent : 1 ) * 100;
			$email_sequence['click_rate'] = $email_sequence->click / ( $email_sequence->sent > 0 ? $email_sequence->sent : 1 ) * 100;
			$contacts                     = Tracking_Model::where( 'source_id', $email_sequence_id )
				->where( 'source_type', Message_Source_Types::CAMPAIGN )
				->get();
			$email_sequence['recipients'] = $contacts->map(
				function ( $contact ) {
					return array(
						'id'         => $contact->contact->id,
						'name'       => $contact->contact->first_name . ' ' . $contact->contact->last_name,
						'email'      => $contact->contact->email,
						'status'     => $contact->status,
						'sent_at'    => $contact->sent_at,
						'opened_at'  => $contact->opened_at,
						'clicked_at' => $contact->clicked_at,
					);
				}
			);
			return new WP_REST_Response( $email_sequence, 200 );
		} catch ( \Exception $e ) {
			$logger = quillcrm_get_logger();
			$logger->error(
				'Email sequence reports error: ' . $e->getMessage(),
				array(
					'email_sequence_id' => $email_sequence_id,
					'trace'             => $e->getTraceAsString(),
				)
			);
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

			if ( isset( $email_sequence_data['settings']['delay'] ) ) {
				$execute_at                        = Email_Sequences_Manager::instance()->calculate_execution_time( $email_sequence_data['settings']['delay'] );
				$email_sequence_data['execute_at'] = $execute_at;
			}
			$email_sequence_data['execute_at'] = $execute_at;
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
	 * Get delay in minutes for sorting purposes
	 *
	 * @param array|string $settings The settings array or JSON string containing delay information
	 * @return int Delay in minutes
	 */
	private function get_delay_in_minutes( $settings ) {
		if ( is_string( $settings ) ) {
			$settings = json_decode( $settings, true );
		}

		$delay = $settings['delay'] ?? array(
			'value' => 0,
			'unit'  => 'minutes',
		);
		$value = intval( $delay['value'] ?? 0 );
		$unit  = strtolower( $delay['unit'] ?? 'minutes' );

		switch ( $unit ) {
			case 'minutes':
				return $value;
			case 'hours':
				return $value * 60;
			case 'days':
				return $value * 60 * 24;
			default:
				return $value;
		}
	}


	/**
	 * Sanitize settings array
	 *
	 * @param array $settings The settings array to sanitize.
	 *
	 * @return array The sanitized settings array
	 */
	public function sanitize_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return array();
		}

		$sanitized = array();

		// Sanitize string fields
		$string_fields = array( 'subject', 'pre_header', 'email_body', 'from_name', 'from_email', 'reply_to_name', 'reply_to_email' );
		foreach ( $string_fields as $field ) {
			if ( isset( $settings[ $field ] ) ) {
				$sanitized[ $field ] = sanitize_text_field( $settings[ $field ] );
			}
		}

		// Sanitize delay object
		if ( isset( $settings['delay'] ) && is_array( $settings['delay'] ) ) {
			$sanitized['delay'] = array(
				'value' => isset( $settings['delay']['value'] ) ? absint( $settings['delay']['value'] ) : 0,
				'unit'  => isset( $settings['delay']['unit'] ) ? sanitize_text_field( $settings['delay']['unit'] ) : 'minutes',
			);
		}

		// Sanitize sending_time_range object
		if ( isset( $settings['sending_time_range'] ) && is_array( $settings['sending_time_range'] ) ) {
			$sanitized['sending_time_range'] = array(
				'from' => isset( $settings['sending_time_range']['from'] ) ? sanitize_text_field( $settings['sending_time_range']['from'] ) : '',
				'to'   => isset( $settings['sending_time_range']['to'] ) ? sanitize_text_field( $settings['sending_time_range']['to'] ) : '',
			);
		}

		// Sanitize boolean fields
		$boolean_fields = array( 'enable_specific_days', 'add_utm_parameters' );
		foreach ( $boolean_fields as $field ) {
			if ( isset( $settings[ $field ] ) ) {
				$sanitized[ $field ] = (bool) $settings[ $field ];
			}
		}

		// Sanitize days object
		if ( isset( $settings['days'] ) && is_array( $settings['days'] ) ) {
			$days              = array( 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' );
			$sanitized['days'] = array();
			foreach ( $days as $day ) {
				$sanitized['days'][ $day ] = isset( $settings['days'][ $day ] ) ? (bool) $settings['days'][ $day ] : false;
			}
		}

		// Sanitize UTM parameters object
		if ( isset( $settings['utm_parameters'] ) && is_array( $settings['utm_parameters'] ) ) {
			$utm_fields                  = array( 'campaign_source', 'campaign_medium', 'campaign_name', 'campaign_term', 'campaign_content' );
			$sanitized['utm_parameters'] = array();
			foreach ( $utm_fields as $field ) {
				$sanitized['utm_parameters'][ $field ] = isset( $settings['utm_parameters'][ $field ] ) ? sanitize_text_field( $settings['utm_parameters'][ $field ] ) : '';
			}
		}

		return $sanitized;
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

	/**
	 * Check if the user has permission to get the email sequence reports
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission Whether the user has permission to get the email sequence reports
	 */
	public function get_item_reports_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
