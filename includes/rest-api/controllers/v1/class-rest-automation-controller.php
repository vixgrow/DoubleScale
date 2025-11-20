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

			// Check dependencies for each automation
			foreach ( $automations as $automation ) {
				$automation = $this->check_and_mark_dependencies( $automation, 'get_items' );
			}

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

			// Check plugin dependencies and add warnings
			$automation = $this->check_and_mark_dependencies( $automation );

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
	 * Check and mark plugin dependencies
	 * Adds warnings and stores labels for unavailable triggers/actions
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation The automation object.
	 *
	 * @return Automation_Model
	 */
	private function check_and_mark_dependencies( $automation, $context = 'get_item' ) {
		$has_warnings = false;
		$warnings     = array();

		if ( ! empty( $automation->trigger ) ) {
			$trigger = Triggers_Manager::instance()->get_trigger( $automation->trigger );

			$update_trigger_settings = function ( $label, $warning = false ) use ( &$automation ) {
				$settings                   = $automation->settings ?: array();
				$settings['_trigger_label'] = $label;
				if ( $warning ) {
					$settings['_trigger_warning'] = true;
				} else {
					unset( $settings['_trigger_warning'] );
				}
				$automation->settings = $settings;
			};

			if ( empty( $trigger ) ) {
				$form = Forms_Manager::instance()->get_form( $automation->trigger );

				if ( ! empty( $form ) && ! empty( $form->is_pro ) && $form->is_pro ) {
					$has_warnings = true;
					$warnings[]   = array(
						'type'    => 'trigger',
						'slug'    => $automation->trigger,
						'message' => __( 'Form trigger requires QuillCRM Pro to be installed and activated.', 'quillcrm' ),
					);
					$update_trigger_settings( $automation->trigger, true );
				} elseif ( empty( $form ) || ! $form->is_enabled() ) {
					$has_warnings = true;
					$warnings[]   = array(
						'type'    => 'trigger',
						'slug'    => $automation->trigger,
						'message' => __( 'Trigger requires a plugin that is not currently active.', 'quillcrm' ),
					);
					$update_trigger_settings( $automation->trigger, true );
				} else {
					$update_trigger_settings( $form->name, false );
				}
			} else {
				$trigger_plugin_check = $this->check_trigger_plugin_dependency( $trigger );

				if ( ! $trigger_plugin_check['is_active'] || $trigger_plugin_check['is_pro'] ) {
					$has_warnings = true;
					$warnings[]   = array(
						'type'         => 'trigger',
						'slug'         => $automation->trigger,
						'message'      => $trigger_plugin_check['message'],
						'plugin_label' => $trigger_plugin_check['plugin_label'],
					);
					$update_trigger_settings( $trigger->name, true );
				} else {
					$update_trigger_settings( $trigger->name, false );
				}
			}
		}

		if ( $context === 'get_items' ) {
			$automation->_warnings = $warnings;
			return $automation;
		}
		// Check each action step's availability
		if ( ! empty( $automation->steps ) ) {
			foreach ( $automation->steps as $step ) {
				if ( ( $step->type === 'action' || $step->type === 'delay' ) && ! empty( $step->action ) ) {
					try {
						$action = Actions_Manager::instance()->get_action( $step->action );

						// Action exists, check if its required plugin is active
						$action_plugin_check = $this->check_action_plugin_dependency( $action );

						if ( ! $action_plugin_check['is_active'] || $action_plugin_check['is_pro'] ) {
							$has_warnings = true;
							$warnings[]   = array(
								'type'         => 'action',
								'step_id'      => $step->id,
								'slug'         => $step->action,
								'message'      => $action_plugin_check['message'],
								'plugin_label' => $action_plugin_check['plugin_label'],
							);

							// Store action label, warning flag, and warning message
							$settings                            = $step->settings ?: array();
							$settings['_action_label']           = $action->name;
							$settings['_action_warning']         = true;
							$settings['_action_warning_message'] = $action_plugin_check['message'];
							$step->settings                      = $settings;
						} else {
							// Action exists and plugin is active, store its label and clear warnings
							$settings                  = $step->settings ?: array();
							$settings['_action_label'] = $action->name;
							unset( $settings['_action_warning'] );
							unset( $settings['_action_warning_message'] );
							$step->settings = $settings;
						}
					} catch ( \Exception $e ) {
						// Action not found - plugin missing
						$has_warnings    = true;
						$warning_message = __( 'Action requires a plugin that is not currently active.', 'quillcrm' );
						$warnings[]      = array(
							'type'    => 'action',
							'step_id' => $step->id,
							'slug'    => $step->action,
							'message' => $warning_message,
						);

						// Store action label (slug) if not already stored, warning flag, and warning message
						$settings = $step->settings ?: array();
						if ( empty( $settings['_action_label'] ) ) {
							$settings['_action_label'] = $step->action;
						}
						$settings['_action_warning']         = true;
						$settings['_action_warning_message'] = $warning_message;
						$step->settings                      = $settings;
					}
				} elseif ( $step->type === 'condition' && ! empty( $step->settings ) ) {
					// Check condition/rule dependencies
					$condition_check = $this->check_condition_plugin_dependencies( $step->settings );

					if ( $condition_check['has_warnings'] ) {
						$has_warnings = true;
						$warnings[]   = array(
							'type'              => 'condition',
							'step_id'           => $step->id,
							'message'           => $condition_check['message'],
							'plugin_labels'     => $condition_check['plugin_labels'],
							'unavailable_count' => $condition_check['unavailable_count'],
						);

						// Store condition warning and unavailable rules info as step properties (not in settings)
						$step->_condition_warning       = true;
						$step->_unavailable_rules       = $condition_check['unavailable_rules'];
						$step->_unavailable_rules_count = $condition_check['unavailable_count'];
					} else {
						// All rules have their plugins active - clean up warning flags
						$step->_condition_warning       = false;
						$step->_unavailable_rules       = array();
						$step->_unavailable_rules_count = 0;
					}
				} elseif ( $step->type === 'goal' && ! empty( $step->action ) ) {

					try {
						$goal = Goals_Manager::instance()->get_goal( $step->action );

						// Goal exists, check if its required plugin is active
						$goal_plugin_check = $this->check_goal_plugin_dependency( $goal );

						if ( ! $goal_plugin_check['is_active'] ) {
							$has_warnings = true;
							$warnings[]   = array(
								'type'         => 'goal',
								'step_id'      => $step->id,
								'slug'         => $step->action,
								'message'      => $goal_plugin_check['message'],
								'plugin_label' => $goal_plugin_check['plugin_label'],
							);

							// Store goal label, warning flag, and warning message
							$settings                          = $step->settings ?: array();
							$settings['_goal_label']           = $goal->name;
							$settings['_goal_warning']         = true;
							$settings['_goal_warning_message'] = $goal_plugin_check['message'];
							$step->settings                    = $settings;
						} else {
							// Goal exists and plugin is active, store its label and clear warnings
							$settings                = $step->settings ?: array();
							$settings['_goal_label'] = $goal->name;
							unset( $settings['_goal_warning'] );
							unset( $settings['_goal_warning_message'] );
							$step->settings = $settings;
						}
					} catch ( \Exception $e ) {
						// Goal not found - plugin missing
						$has_warnings    = true;
						$warning_message = __( 'Goal requires a plugin that is not currently active.', 'quillcrm' );
						$warnings[]      = array(
							'type'    => 'goal',
							'step_id' => $step->id,
							'slug'    => $step->action,
							'message' => $warning_message,
						);

						// Store goal label (slug) if not already stored, warning flag, and warning message
						$settings = $step->settings ?: array();
						if ( empty( $settings['_goal_label'] ) ) {
							$settings['_goal_label'] = $step->action;
						}
						$settings['_goal_warning']         = true;
						$settings['_goal_warning_message'] = $warning_message;
						$step->settings                    = $settings;
					}
				}
			}
		}

		// Add warnings metadata to automation
		if ( $has_warnings ) {
			$automation->_warnings = $warnings;
		}

		return $automation;
	}

	/**
	 * Check trigger plugin dependency
	 * Returns whether the trigger's required plugin is active
	 *
	 * @since 1.0.0
	 *
	 * @param object $trigger The trigger object.
	 *
	 * @return array Array with 'is_active', 'message', and 'plugin_label' keys
	 */
	private function check_trigger_plugin_dependency( $trigger ) {
		// Define plugin dependencies based on trigger source and group
		$plugin_dependencies = array(
			'crm'         => array(
				'contact'       => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
				'link_triggers' => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
				'webhooks'      => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
				'deal'          => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
			),
			'woocommerce' => array(
				'order'        => array(
					'plugin' => 'woocommerce/woocommerce.php',
					'label'  => 'WooCommerce',
				),
				'cart'         => array(
					'plugin' => 'woocommerce/woocommerce.php',
					'label'  => 'WooCommerce',
				),
				'review'       => array(
					'plugin' => 'woocommerce/woocommerce.php',
					'label'  => 'WooCommerce',
				),
				'subscription' => array(
					'plugin' => 'woocommerce-subscriptions/woocommerce-subscriptions.php',
					'label'  => 'WooCommerce Subscriptions',
				),
				'wishlist'     => array(
					'plugin' => 'woocommerce-wishlists/woocommerce-wishlists.php',
					'label'  => 'WooCommerce Wishlists',
				),
				'membership'   => array(
					'plugin' => 'woocommerce-memberships/woocommerce-memberships.php',
					'label'  => 'WooCommerce Memberships',
				),
			),
			'edd'         => array(
				'order' => array(
					'plugin' => 'easy-digital-downloads/easy-digital-downloads.php',
					'label'  => 'Easy Digital Downloads',
				),
			),
			'lms'         => array(
				'learndash' => array(
					'plugin' => 'sfwd-lms/sfwd_lms.php',
					'label'  => 'LearnDash',
				),
			),
			'memberpress' => array(
				'memberpress' => array(
					'plugin' => 'memberpress/memberpress.php',
					'label'  => 'MemberPress',
				),
			),
			'booking'     => array(
				'quillbooking' => array(
					'plugin' => 'QuillBooking/quillbooking.php',
					'label'  => 'QuillBooking',
				),
			),
		);
		// Check if trigger has a source and group that requires a plugin
		if ( ! empty( $trigger->source ) && ! empty( $trigger->group ) ) {
			if ( isset( $plugin_dependencies[ $trigger->source ][ $trigger->group ] ) ) {
				$dependency = $plugin_dependencies[ $trigger->source ][ $trigger->group ];
				if ( empty( $dependency['plugin'] ) ) {
					$is_active = true;
				} else {
					$is_active = quillcrm_is_plugin_active( $dependency['plugin'] );
				}
				$is_pro = isset( $trigger->is_pro ) && $trigger->is_pro;

				if ( $is_pro ) {
					return array(
						'is_active'    => $is_active,
						'is_pro'       => true,
						'message'      => sprintf(
							__( 'This trigger requires QuillCRM Pro to be installed and activated.', 'quillcrm' ),
							$dependency['label']
						),
						'plugin_label' => $dependency['label'],
					);
				}

				if ( ! $is_active ) {
					return array(
						'is_active'    => false,
						'is_pro'       => false,
						'message'      => sprintf(
							__( 'This trigger requires %s to be installed and activated.', 'quillcrm' ),
							$dependency['label']
						),
						'plugin_label' => $dependency['label'],
					);
				}
			}
		}

		// No dependency or plugin is active
		return array(
			'is_active'    => true,
			'is_pro'       => false,
			'message'      => '',
			'plugin_label' => '',
		);
	}

	/**
	 * Check action plugin dependency
	 * Returns whether the action's required plugin is active
	 *
	 * @since 1.0.0
	 *
	 * @param object $action The action object.
	 *
	 * @return array Array with 'is_active', 'message', and 'plugin_label' keys
	 */
	private function check_action_plugin_dependency( $action ) {
		// Define plugin dependencies based on action source and group
		$plugin_dependencies = array(
			'crm'         => array(
				'deal'  => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
				'delay' => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
			),
			'woocommerce' => array(
				'order'  => array(
					'plugin' => 'woocommerce/woocommerce.php',
					'label'  => 'WooCommerce',
				),
				'coupon' => array(
					'plugin' => 'woocommerce/woocommerce.php',
					'label'  => 'WooCommerce',
				),
			),
			'wp'          => array(
				'user' => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
			),
			'lms'         => array(
				'learndash' => array(
					'plugin' => 'sfwd-lms/sfwd_lms.php',
					'label'  => 'LearnDash',
				),
			),
			'email'       => array(
				'email' => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
			),
			'message'     => array(
				'sms'      => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
				'whatsapp' => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
			),
			'send_data'   => array(
				'slack'        => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
				'zapier'       => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
				'http_request' => array(
					'plugin' => '',
					'label'  => 'QuillCRM Pro',
				),
			),
		);

		// Check if action has a source and group that requires a plugin
		if ( ! empty( $action->source ) && ! empty( $action->group ) ) {
			if ( isset( $plugin_dependencies[ $action->source ][ $action->group ] ) ) {
				$dependency = $plugin_dependencies[ $action->source ][ $action->group ];
				$is_pro     = isset( $action->is_pro ) && $action->is_pro;
				if ( empty( $dependency['plugin'] ) ) {
					$is_active = true;
				} else {
					$is_active = quillcrm_is_plugin_active( $dependency['plugin'] );
				}
				if ( $is_pro ) {
					return array(
						'is_active'    => $is_active,
						'is_pro'       => $is_pro,
						'message'      => sprintf(
							__( 'This action requires QuillCRM Pro to be installed and activated.', 'quillcrm' ),
							$dependency['label']
						),
						'plugin_label' => $dependency['label'],
					);
				}
				if ( ! $is_active ) {
					return array(
						'is_active'    => false,
						'message'      => sprintf(
							/* translators: %s: plugin name */
							__( 'This action requires %s to be installed and activated.', 'quillcrm' ),
							$dependency['label']
						),
						'plugin_label' => $dependency['label'],
					);
				}
			}
		}

		// No dependency or plugin is active
		return array(
			'is_active'    => true,
			'is_pro'       => false,
			'message'      => '',
			'plugin_label' => '',
		);
	}

	/**
	 * Check condition plugin dependencies
	 * Returns information about unavailable rules in the condition
	 *
	 * @since 1.0.0
	 *
	 * @param array $condition_settings The condition settings array containing rule groups.
	 *
	 * @return array Array with 'has_warnings', 'unavailable_rules', 'unavailable_count', and 'message' keys
	 */
	private function check_condition_plugin_dependencies( $condition_settings ) {
		// Define plugin dependencies based on rule group
		$plugin_dependencies = array(
			'woocommerce'               => array(
				'plugin'     => 'woocommerce/woocommerce.php',
				'label'      => 'WooCommerce',
				'is_enabled' => quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
			),
			'woocommerce_current_order' => array(
				'plugin'     => 'woocommerce/woocommerce.php',
				'label'      => 'WooCommerce',
				'is_enabled' => quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
			),
			'woocommerce_membership'    => array(
				'plugin'     => 'woocommerce-memberships/woocommerce-memberships.php',
				'label'      => 'WooCommerce Memberships',
				'is_enabled' => quillcrm_is_plugin_active( 'woocommerce-memberships/woocommerce-memberships.php' ),
			),
			'woocommerce_whishlist'     => array(
				'plugin'     => 'woocommerce-wishlist/woocommerce-wishlist.php',
				'label'      => 'WooCommerce Wishlist',
				'is_enabled' => quillcrm_is_plugin_active( 'woocommerce-wishlist/woocommerce-wishlist.php' ),
			),
			'woocommerce_subscription'  => array(
				'plugin'     => 'woocommerce-subscriptions/woocommerce-subscriptions.php',
				'label'      => 'WooCommerce Subscriptions',
				'is_enabled' => quillcrm_is_plugin_active( 'woocommerce-subscriptions/woocommerce-subscriptions.php' ),
			),
			'woocommerce_review'        => array(
				'plugin'     => 'woocommerce/woocommerce.php',
				'label'      => 'WooCommerce',
				'is_enabled' => quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
			),
			'cart'                      => array(
				'plugin'     => 'woocommerce/woocommerce.php',
				'label'      => 'WooCommerce',
				'is_enabled' => quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
			),
			'learndash'                 => array(
				'plugin'     => 'sfwd-lms/sfwd_lms.php',
				'label'      => 'LearnDash',
				'is_enabled' => quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ),
			),
		);

		// set forms
		$forms = Forms_Manager::instance()->get_all_forms();
		foreach ( $forms as $form ) {
			$plugin_dependencies[ $form->slug ] = array(
				'plugin'     => $form->slug,
				'label'      => $form->name,
				'is_enabled' => $form->is_enabled(),
			);
		}

		$unavailable_rules  = array();
		$unavailable_groups = array();

		// Check each rule group in the condition settings
		if ( is_array( $condition_settings ) ) {
			foreach ( $condition_settings as $group_index => $rule_group ) {
				if ( is_array( $rule_group ) ) {
					foreach ( $rule_group as $rule_index => $rule ) {
						$selected_group = isset( $rule['selectedGroup'] ) ? $rule['selectedGroup'] : '';
						$rule_slug      = isset( $rule['rule'] ) ? $rule['rule'] : '';

						// Check if this rule's group requires a plugin
						if ( ! empty( $selected_group ) && isset( $plugin_dependencies[ $selected_group ] ) ) {
							$dependency = $plugin_dependencies[ $selected_group ];
							$is_active  = $dependency['is_enabled'];

							if ( ! $is_active ) {
								// Store unavailable rule information
								$unavailable_rules[] = array(
									'group_index'  => $group_index,
									'rule_index'   => $rule_index,
									'rule_slug'    => $rule_slug,
									'group_slug'   => $selected_group,
									'plugin_label' => $dependency['label'],
								);

								// Track unique plugin groups
								if ( ! in_array( $dependency['label'], $unavailable_groups ) ) {
									$unavailable_groups[] = $dependency['label'];
								}
							}
						}
					}
				}
			}
		}

		$has_warnings      = count( $unavailable_rules ) > 0;
		$unavailable_count = count( $unavailable_rules );
		$unique_groups     = implode( ', ', array_unique( $unavailable_groups ) );

		$message = '';
		if ( $has_warnings ) {
			if ( $unavailable_count === 1 ) {
				$message = sprintf(
					/* translators: %s: plugin name */
					__( 'This condition uses 1 rule that requires %s to be installed and activated.', 'quillcrm' ),
					$unique_groups
				);
			} else {
				$message = sprintf(
					/* translators: %1$d: number of rules, %2$s: plugin names */
					__( 'This condition uses %1$d rules that require plugins (%2$s) to be installed and activated.', 'quillcrm' ),
					$unavailable_count,
					$unique_groups
				);
			}
		}

		return array(
			'has_warnings'      => $has_warnings,
			'unavailable_rules' => $unavailable_rules,
			'unavailable_count' => $unavailable_count,
			'message'           => $message,
			'plugin_labels'     => $unavailable_groups,
		);
	}


	/**
	 * Check goal plugin dependency
	 * Returns whether the goal's required plugin is active
	 *
	 * @since 1.0.0
	 *
	 * @param object $goal The goal object.
	 *
	 * @return array Array with 'is_active', 'message', and 'plugin_labels' keys
	 */
	private function check_goal_plugin_dependency( $goal ) {
		// Define plugin dependencies based on goal source and group
		$plugin_dependencies = array(
			'woocommerce' => array(
				'coupon' => array(
					'plugin' => 'woocommerce/woocommerce.php',
					'label'  => 'WooCommerce',
				),
			),
		);

		// Check if action has a source and group that requires a plugin
		if ( ! empty( $goal->source ) && ! empty( $goal->group ) ) {
			if ( isset( $plugin_dependencies[ $goal->source ][ $goal->group ] ) ) {
				$dependency = $plugin_dependencies[ $goal->source ][ $goal->group ];
				if ( empty( $dependency['plugin'] ) ) {
					$is_active = true;
				} else {
					$is_active = quillcrm_is_plugin_active( $dependency['plugin'] );
				}
				$is_pro = isset( $goal->is_pro ) && $goal->is_pro;

				if ( $is_pro ) {
					return array(
						'is_active'    => $is_active,
						'is_pro'       => true,
						'message'      => sprintf(
							__( 'This goal requires QuillCRM Pro to be installed and activated.', 'quillcrm' ),
							$dependency['label']
						),
						'plugin_label' => $dependency['label'],
					);
				}

				if ( ! $is_active ) {
					return array(
						'is_active'    => false,
						'is_pro'       => false,
						'message'      => sprintf(
							/* translators: %s: plugin name */
							__( 'This goal requires %s to be installed and activated.', 'quillcrm' ),
							$dependency['label']
						),
						'plugin_label' => $dependency['label'],
					);
				}
			}
		}

		// No dependency or plugin is active
		return array(
			'is_active'    => true,
			'is_pro'       => false,
			'message'      => '',
			'plugin_label' => '',
		);
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
