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
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Managers\Rules_Manager;
use QuillCRM\Managers\Goals_Manager;
use QuillCRM\Managers\Forms_Manager;
use QuillCRM\User_Roles\Permissions;

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
					'args'                => array(
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
						'keyword'  => array(
							'description'       => __( 'Search keyword.', 'quillcrm' ),
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		// Get the triggers.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/triggers',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_triggers' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		// Get the actions.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/actions',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_actions' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		// Get the merge tags.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/merge-tags',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_merge_tags' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		// Get the rules.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/rules',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_rules' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		// Get the goals.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/goals',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_goals' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		// Receive a webhook.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/webhook',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'receive_webhook' ),
					'permission_callback' => '__return_true',
					'args'                => array(
						'quillcrm_id'  => array(
							'description' => __( 'The automation ID.', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'quillcrm_key' => array(
							'description' => __( 'The automation key.', 'quillcrm' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
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
			'from'     => array(
				'description' => __( 'Start date for filtering automations.', 'quillcrm' ),
				'type'        => 'string',
				'format'      => 'date',
			),
			'to'       => array(
				'description' => __( 'End date for filtering automations.', 'quillcrm' ),
				'type'        => 'string',
				'format'      => 'date',
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
	 * Get goals
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_goals( $request ) {
		$goals = Goals_Manager::instance()->get_sources();

		return new WP_REST_Response( $goals, 200 );
	}

	/**
	 * Get rules
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_rules( $request ) {
		$trigger    = $request->get_param( 'trigger' );
		$form_id    = $request->get_param( 'form_id' );
		$trigger_id = $request->get_param( 'trigger_id' );

		$forms = Forms_Manager::instance()->get_all_forms();

		// If we have a specific form_id and trigger_id, register field rules for that form only
		if ( ! empty( $form_id ) && ! empty( $trigger_id ) && in_array( $trigger_id, array_keys( $forms ) ) ) {
			$form_instance = $forms[ $trigger_id ];
			if ( $form_instance && method_exists( $form_instance, 'register_field_rules_for_form' ) ) {
				$form_instance->register_field_rules_for_form( $form_id );
			}
		}

		$rules = Rules_Manager::instance()->get_groups();

		return new WP_REST_Response( $rules, 200 );
	}

	/**
	 * Receive webhook
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function receive_webhook( $request ) {
		$webhook_id  = $request->get_param( 'quillcrm_id' );
		$webhook_key = $request->get_param( 'quillcrm_key' );
		$params      = $request->get_params();
		unset( $params['quillcrm_id'] );
		unset( $params['quillcrm_key'] );

		$automation = Automation_Model::find( $webhook_id );
		if ( ! $automation ) {
			return new WP_Error( 'not_found', __( 'Automation not found.', 'quillcrm' ), array( 'status' => 404 ) );
		}

		$webhook_key = $automation->get_setting( 'webhook_key' );
		if ( $webhook_key !== $webhook_key ) {
			return new WP_Error( 'unauthorized', __( 'Unauthorized.', 'quillcrm' ), array( 'status' => 401 ) );
		}

		do_action( 'quillcrm_webhook_received', $automation, $params );

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'Webhook received.',
			),
			200
		);
	}

	/**
	 * Get triggers
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_triggers( $request ) {
		$triggers = Triggers_Manager::instance()->get_sources();

		return new WP_REST_Response( $triggers, 200 );
	}

	/**
	 * Get actions
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_actions( $request ) {
		$actions = Actions_Manager::instance()->get_sources();

		return new WP_REST_Response( $actions, 200 );
	}

	/**
	 * Get merge tags
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_merge_tags( $request ) {
		$form_id    = $request->get_param( 'form_id' );
		$trigger_id = $request->get_param( 'trigger_id' );

		$forms = Forms_Manager::instance()->get_all_forms();

		// If we have a specific form_id and trigger_id, register merge tags for that form only
		if ( ! empty( $form_id ) && ! empty( $trigger_id ) && in_array( $trigger_id, array_keys( $forms ) ) ) {
			$form_instance = $forms[ $trigger_id ];
			if ( $form_instance ) {
				$form_instance->register_merge_tags_for_form( $form_id );
			}
		}

		$merge_tags = Merge_Tags_Manager::instance()->get_groups();

		return new WP_REST_Response( $merge_tags, 200 );
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
			$keyword  = $request->get_param( 'keyword' ) ? $request->get_param( 'keyword' ) : '';
			$per_page = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page     = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$from     = $request->get_param( 'from' ) ?? null;
			$to       = $request->get_param( 'to' ) ?? null;

			$query       = Automation_Model::query();
			$total_count = $query->count();

			if ( $keyword ) {
				$query->where( 'name', 'LIKE', '%' . $keyword . '%' );
			}
			if ( $from ) {
				$query->where( 'created_at', '>=', $from );
			}
			if ( $to ) {
				$query->where( 'created_at', '<=', $to );
			}
			$automations = $query->orderBy( 'created_at', 'desc' )->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $automations->toArray() + array( 'total_count' => $total_count ), 200 );
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
			$id       = $request->get_param( 'id' );
			$per_page = $request->get_param( 'per_page' ) ?? 10;
			$page     = $request->get_param( 'page' ) ?? 1;
			$keyword  = $request->get_param( 'keyword' ) ?? '';

			$query = Automation_Contact_Model::where( 'automation_id', $id );

			// Apply keyword search if provided
			if ( ! empty( $keyword ) ) {
				$query->whereHas(
					'contact',
					function ( $q ) use ( $keyword ) {
						$q->where( 'email', 'LIKE', '%' . $keyword . '%' );
					}
				);
			}

			$automation_contacts = $query->with( 'contact', 'processes.step', 'current_step', 'next_step' )
				->orderBy( 'created_at', 'desc' )
				->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $automation_contacts, 200 );
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
			$automation = Automation_Model::with(
				array(
					'steps' => function ( $query ) {
						$query->where( 'status', 'active' );
					},
				)
			)->find( $id );

			if ( ! $automation ) {
				return new WP_Error( 'not_found', __( 'Automation not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

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

			$is_form = false;
			$trigger = Triggers_Manager::instance()->get_trigger( $automation->trigger );
			if ( empty( $trigger ) ) {
				$form = Forms_Manager::instance()->get_form( $automation->trigger );
				if ( empty( $form ) ) {
					$automation->delete();
					throw new \Exception( 'Trigger not found.' );
				} else {
					$is_form = true;
				}
			}

			if ( ! $is_form ) {
				$trigger->set_settings( $automation );
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

			$automation->load(
				array(
					'steps' => function ( $query ) {
						$query->whereIn( 'status', array( 'active', 'draft' ) );
					},
				)
			);

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
	 * Delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete_items( $request ) {
		try {
			$ids = $request->get_param( 'ids' );
			if ( empty( $ids ) ) {
				return new WP_Error( 'error', __( 'No IDs provided.', 'quillcrm' ), array( 'status' => 400 ) );
			}

			$automations = Automation_Model::find( $ids );
			if ( ! $automations ) {
				return new WP_Error( 'not_found', __( 'Automations not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			foreach ( $automations as $automation ) {
				$automation->delete();
			}

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
	 * Delete items permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_items_permissions_check( $request ) {
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
