<?php

/**
 * Class RestAutomationStepController
 * This class is responsible for handling the Automation Step REST Api
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Rest\Controllers;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\UserRoles\Permissions;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Automations\Models\AutomationStepModel;
use DoubleScale\Modules\Tracking\Models\CommunicationTrackingModel;
use DoubleScale\Constants\TrackingStatus;
use DoubleScale\Modules\Automations\Services\ActionsManager;

/**
 * RestAutomationStepController class
 */
class RestAutomationStepController extends RestController {

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'automation-steps';

	/**
	 * Register the routes for the objects of the controller.
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
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
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

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/reorder',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'reorder_step' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'direction'     => array(
							'description' => __( 'Direction to move the step (up or down)', 'doublescale'),
							'type'        => 'string',
							'enum'        => array( 'up', 'down' ),
							'required'    => true,
						),
						'updated_steps' => array(
							'description' => __( 'Array of steps with updated orders', 'doublescale'),
							'type'        => 'object',
							'required'    => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/analytics',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_step_analytics' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Schema for the Automation Step
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_item_schema() {
		 return array(
			 '$schema'    => 'http://json-schema.org/draft-04/schema#',
			 'title'      => 'automation-step',
			 'type'       => 'object',
			 'properties' => array(
				 'id'            => array(
					 'description' => __( 'Unique identifier for the object.', 'doublescale'),
					 'type'        => 'integer',
					 'readonly'    => true,
				 ),
				 'automation_id' => array(
					 'description' => __( 'The ID of the automation this step belongs to.', 'doublescale'),
					 'type'        => 'integer',
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'absint',
					 ),
				 ),
				 'parent_id'     => array(
					 'description' => __( 'The ID of the parent step.', 'doublescale'),
					 'type'        => 'integer',
					 'arg_options' => array(
						 'sanitize_callback' => 'absint',
					 ),
				 ),
				 'action'        => array(
					 'description' => __( 'The action of the step.', 'doublescale'),
					 'type'        => 'string',
					 'required'    => false,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'type'          => array(
					 'description' => __( 'The type of the step.', 'doublescale'),
					 'type'        => 'string',
					 'required'    => true,
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'condition'     => array(
					 'description' => __( 'The condition of the step.', 'doublescale'),
					 'type'        => 'string',
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'status'        => array(
					 'description' => __( 'The status of the step.', 'doublescale'),
					 'type'        => 'string',
					 'arg_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'settings'      => array(
					 'description' => __( 'The settings of the step.', 'doublescale'),
					 'type'        => 'object',
					 'arg_options' => array(
						 'validate_callback' => array( $this, 'validate_item_settings' ),
					 ),
				 ),
				 'order'         => array(
					 'description' => __( 'Order of the list.', 'doublescale'),
					 'type'        => 'integer',
					 'arg_options' => array(
						 'sanitize_callback' => 'absint',
					 ),
				 ),
				 'created_at'    => array(
					 'description' => __( 'The date the object was created.', 'doublescale'),
					 'type'        => 'string',
					 'format'      => 'date-time',
					 'readonly'    => true,
				 ),
				 'updated_at'    => array(
					 'description' => __( 'The date the object was last modified.', 'doublescale'),
					 'type'        => 'string',
					 'format'      => 'date-time',
					 'readonly'    => true,
				 ),
			 ),
		 );
	}

	/**
	 * Validate the create item request
	 *
	 * @since 1.0.0
	 *
	 * @param mixed           $value The value of the parameter.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param The parameter name.
	 *
	 * @return WP_Error|bool
	 */
	public function validate_item_settings( $value, $request, $param ) {
		try {
			$data        = $request->get_json_params();
			$action_type = $data['type'] ?? '';

			if ( 'action' === $action_type ) {
				$action = ActionsManager::instance()->get_action( $data['action'] );
				if ( empty( $action->get_attributes_schema() ) ) {
					return true;
				}

				$validator = rest_validate_value_from_schema( $data['settings'] ?? array(), $action->get_attributes_schema(), 'settings' );
				if ( is_wp_error( $validator ) ) {
					return $validator;
				}
			}

			return true;
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_automation_step_validate_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Create an Automation Step
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function create_item( $request ) {
		try {
			$step_data     = $this->prepare_step( $request );
			$updated_steps = $request->get_param( 'updated_steps' ) ?? array();

			$automation_step = AutomationStepModel::create( $step_data );

			if ( ! empty( $updated_steps ) ) {
				$this->update_orders( $updated_steps );
			}

			$automation_step = AutomationStepModel::find( $automation_step->id );
			$automation_step = $this->resolve_action_label( $automation_step );

			return new WP_REST_Response( $automation_step, 201 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_automation_step_create_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get an Automation Step
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		try {
			$automation_step = AutomationStepModel::find( $request->get_param( 'id' ) );

			if ( ! $automation_step ) {
				return new WP_Error( 'rest_automation_step_not_found', __( 'Automation Step not found', 'doublescale'), array( 'status' => 404 ) );
			}

			return new WP_REST_Response( $automation_step, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_automation_step_get_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update an Automation Step
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {
		try {
			doublescale_get_logger()->error(
				'REST: update_item called for automation step',
				array(
					'step_id'   => $request->get_param( 'id' ),
					'step_data' => $request->get_params(),
					'code'      => 'rest_automation_step_update_called',
				)
			);

			$automation_step = AutomationStepModel::find( $request->get_param( 'id' ) );

			if ( ! $automation_step ) {
				return new WP_Error( 'rest_automation_step_not_found', __( 'Automation Step not found', 'doublescale'), array( 'status' => 404 ) );
			}

			$step_data = $this->prepare_step( $request );

			doublescale_get_logger()->error(
				'REST: About to save automation step',
				array(
					'step_id'        => $automation_step->id,
					'prepared_data'  => $step_data,
					'current_settings' => $automation_step->settings,
					'code'           => 'rest_automation_step_before_save',
				)
			);

			$automation_step->fill( $step_data );
			$automation_step->save();

			$automation_step = $this->resolve_action_label( $automation_step );

			doublescale_get_logger()->error(
				'REST: After save automation step',
				array(
					'step_id'        => $automation_step->id,
					'final_settings' => $automation_step->settings,
					'has_template_ids' => isset( $automation_step->settings['template_ids'] ),
					'code'           => 'rest_automation_step_after_save',
				)
			);

			return new WP_REST_Response( $automation_step, 200 );
		} catch ( \Exception $e ) {
			doublescale_get_logger()->error(
				'REST: Exception in update_item',
				array(
					'step_id' => $request->get_param( 'id' ),
					'error'   => $e->getMessage(),
					'trace'   => $e->getTraceAsString(),
					'code'    => 'rest_automation_step_update_exception',
				)
			);
			return new WP_Error( 'rest_automation_step_update_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete an Automation Step
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function delete_item( $request ) {
		try {
			$automation_step = AutomationStepModel::find( $request->get_param( 'id' ) );
			$updated_steps   = $request->get_param( 'updated_steps' ) ?? array();

			if ( ! $automation_step ) {
				return new WP_Error( 'rest_automation_step_not_found', __( 'Automation Step not found', 'doublescale'), array( 'status' => 404 ) );
			}

			if ( 'draft' === $automation_step->status ) {
				$automation_step->delete();
			} else {
				$automation_step->status = 'deleted';
				$automation_step->save();
			}

			if ( ! empty( $updated_steps ) ) {
				$this->update_orders( $updated_steps );
			}

			return new WP_REST_Response( null, 204 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_automation_step_delete_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Reorder an Automation Step
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function reorder_step( $request ) {
		try {
			$step_id       = $request->get_param( 'id' );
			$direction     = $request->get_param( 'direction' );
			$updated_steps = $request->get_param( 'updated_steps' ) ?? array();

			$automation_step = AutomationStepModel::find( $step_id );

			if ( ! $automation_step ) {
				return new WP_Error( 'rest_automation_step_not_found', __( 'Automation Step not found', 'doublescale'), array( 'status' => 404 ) );
			}

			// Validate direction
			if ( ! in_array( $direction, array( 'up', 'down' ), true ) ) {
				return new WP_Error( 'rest_automation_step_invalid_direction', __( 'Invalid direction. Must be "up" or "down"', 'doublescale'), array( 'status' => 400 ) );
			}

			// Update the orders based on the frontend calculations
			if ( ! empty( $updated_steps ) ) {
				$this->update_orders( $updated_steps );
			}

			// Return the updated step
			$automation_step = AutomationStepModel::find( $step_id );

			return new WP_REST_Response( $automation_step, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_automation_step_reorder_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Update orders of the steps
	 *
	 * @since 1.0.0
	 *
	 * @param array $steps Steps.
	 *
	 * @return void
	 */
	private function update_orders( $steps ) {
		foreach ( $steps as $step_id => $step_data ) {
			$step = AutomationStepModel::find( $step_id );
			if ( ! $step ) {
				continue;
			}

			$step->order = $step_data['order'];
			$step->save();
		}
	}

	/**
	 * Resolve the action label for a step and inject it into settings.
	 *
	 * @param AutomationStepModel $step The step model.
	 *
	 * @return AutomationStepModel
	 */
	private function resolve_action_label( $step ) {
		if ( ! empty( $step->action ) && ( 'action' === $step->type || 'delay' === $step->type || 'goal' === $step->type ) ) {
			try {
				$action                      = ActionsManager::instance()->get_action( $step->action );
				$settings                    = $step->settings ?: array();
				$settings['_action_label']   = $action->name;
				unset( $settings['_action_warning'] );
				unset( $settings['_action_warning_message'] );
				$step->settings = $settings;
				$step->save();
			} catch ( \Exception $e ) {
				// Action not registered — keep slug as label
			}
		}
		return $step;
	}

	/**
	 * Prepare the step data
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return array
	 */
	private function prepare_step( $request ) {
		$step_data = array(
			'automation_id' => $request->get_param( 'automation_id' ),
			'parent_id'     => $request->get_param( 'parent_id' ),
			'action'        => $request->get_param( 'action' ),
			'type'          => $request->get_param( 'type' ),
			'condition'     => $request->get_param( 'condition' ),
			'status'        => $request->get_param( 'status' ),
			'settings'      => $request->get_param( 'settings' ),
			'order'         => $request->get_param( 'order' ),
		);

		// Remove empty values but preserve 0 values for numeric fields
		foreach ( $step_data as $key => $value ) {
			if ( is_null( $value ) || ( '' === $value ) ) {
				unset( $step_data[ $key ] );
			}
		}

		// Ensure order is always a valid positive integer
		if ( isset( $step_data['order'] ) ) {
			$step_data['order'] = max( 1, intval( $step_data['order'] ) );
		} else {
			$step_data['order'] = 1; // Default order if not provided
		}

		return $step_data;
	}

	/**
	 * Get analytics for an Automation Step
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_step_analytics( $request ) {
		try {
			$step_id = $request->get_param( 'id' );

			// Verify step exists.
			$automation_step = AutomationStepModel::find( $step_id );

			if ( ! $automation_step ) {
				return new WP_Error( 'rest_automation_step_not_found', __( 'Automation Step not found', 'doublescale'), array( 'status' => 404 ) );
			}

			// Validate step supports analytics.
			$analytics_actions = array( 'send_email', 'send_sms', 'send_whatsapp' );
			if ( ! in_array( $automation_step->action, $analytics_actions, true ) ) {
				return new WP_Error( 'rest_automation_step_invalid_action', __( 'This step does not support analytics', 'doublescale'), array( 'status' => 400 ) );
			}

			// Get all analytics in a single optimized query with JOIN to contacts table.
			global $wpdb;
			$contacts_table = $wpdb->prefix . 'doublescale_contacts';
			$tracking_table = $wpdb->prefix . 'doublescale_communication_tracking';

			// Determine the correct status column based on action type.
			$status_column_map = array(
				'send_email'    => 'email_status',
				'send_sms'      => 'sms_status',
				'send_whatsapp' => 'whatsapp_status',
			);
			$status_column     = $status_column_map[ $automation_step->action ] ?? 'email_status';

			$analytics_raw = CommunicationTrackingModel::byStep( $step_id )
				->leftJoin( $contacts_table . ' as contacts', $tracking_table . '.contact_id', '=', 'contacts.id' )
				->selectRaw(
					"
					COUNT(*) as total,
					SUM(CASE WHEN {$tracking_table}.status = ? THEN 1 ELSE 0 END) as total_sent,
					SUM(CASE WHEN {$tracking_table}.opened = 1 AND {$tracking_table}.status = ? THEN 1 ELSE 0 END) as opened_count,
					SUM(CASE WHEN {$tracking_table}.clicked = 1 AND {$tracking_table}.status = ? THEN 1 ELSE 0 END) as clicked_count,
					SUM(CASE WHEN {$tracking_table}.status = ? THEN 1 ELSE 0 END) as delivered_count,
					SUM(CASE WHEN {$tracking_table}.status = ? THEN 1 ELSE 0 END) as read_count,
					SUM(CASE WHEN contacts.{$status_column} = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed_count
				",
					array( TrackingStatus::SENT, TrackingStatus::SENT, TrackingStatus::SENT, TrackingStatus::DELIVERED, TrackingStatus::READ )
				)
				->first();

			// Extract metrics.
			$total_sent   = (int) $analytics_raw->total_sent;
			$opened       = (int) $analytics_raw->opened_count;
			$clicked      = (int) $analytics_raw->clicked_count;
			$delivered    = (int) $analytics_raw->delivered_count;
			$read         = (int) $analytics_raw->read_count;
			$unsubscribed = (int) $analytics_raw->unsubscribed_count;

			// If no messages sent, return zero analytics.
			if ( 0 === $total_sent ) {
				return new WP_REST_Response(
					array(
						'sent'             => 0,
						'opened'           => 0,
						'clicked'          => 0,
						'delivered'        => 0,
						'read'             => 0,
						'unsubscribed'     => 0,
						'openRate'         => 0,
						'clickRate'        => 0,
						'deliveryRate'     => 0,
						'readRate'         => 0,
						'unsubscribedRate' => 0,
					),
					200
				);
			}

			// Calculate rates as percentages.
			$open_rate         = $total_sent > 0 ? round( ( $opened / $total_sent ) * 100, 2 ) : 0;
			$click_rate        = $total_sent > 0 ? round( ( $clicked / $total_sent ) * 100, 2 ) : 0;
			$delivery_rate     = $total_sent > 0 ? round( ( $delivered / $total_sent ) * 100, 2 ) : 0;
			$read_rate         = $total_sent > 0 ? round( ( $read / $total_sent ) * 100, 2 ) : 0;
			$unsubscribed_rate = $total_sent > 0 ? round( ( $unsubscribed / $total_sent ) * 100, 2 ) : 0;

			$analytics = array(
				'sent'             => $total_sent,
				'opened'           => $opened,
				'clicked'          => $clicked,
				'delivered'        => $delivered,
				'read'             => $read,
				'unsubscribed'     => $unsubscribed,
				'openRate'         => $open_rate,
				'clickRate'        => $click_rate,
				'deliveryRate'     => $delivery_rate,
				'readRate'         => $read_rate,
				'unsubscribedRate' => $unsubscribed_rate,
			);

			return new WP_REST_Response( $analytics, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'rest_automation_step_analytics_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Check if a given request has access to create an item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return bool|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to get an item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return bool|WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to update an item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to delete an item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return bool|WP_Error
	 */
	public function delete_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
