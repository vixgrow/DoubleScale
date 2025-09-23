<?php

/**
 * Class REST_Automation_Reports_Controller
 * This class is responsible for handling the Automation Reports REST API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\User_Roles\Permissions;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Automation_Contact_Processes_Model;

/**
 * Global WordPress functions used in this controller
 * These are available in WordPress context but may not be available to the linter
 *
 * @global function register_rest_route()
 * @global function __()
 * @global function current_user_can()
 * @global constant ABSPATH
 */

/**
 * REST_Automation_Reports_Controller class
 */
class REST_Automation_Reports_Controller extends REST_Controller {



	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'automation-reports';

	/**
	 * Register the routes for the objects of the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		 // Get funnel data for a specific automation
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/get-chart-report',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_chart_report' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Automation ID.', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
				),
			)
		);

		// Get detailed step analytics for a specific automation
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/steps-report',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_steps_report' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Automation ID.', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Get funnel data for chart visualization
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_chart_report( $request ) {
		try {
			$automation_id = $request->get_param( 'id' );
			// Verify automation exists
			$automation = Automation_Model::find( $automation_id );
			if ( ! $automation ) {
				return new WP_Error( 'not_found', __( 'Automation not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}
			// get step from automation_contacts_processes
			$steps_ids = Automation_Contact_Processes_Model::where( 'automation_id', $automation_id )
				->orderBy( 'created_at' )
				->distinct()
				->pluck( 'step_id' );

			// Get all steps for this automation
			$steps = Automation_Step_Model::whereIn( 'id', $steps_ids )
				->where( 'status', '!=', 'deleted' )
				->get();

			if ( $steps->isEmpty() ) {
				return new WP_REST_Response(
					array(
						'funnel_data'     => array(),
						'total_contacts'  => 0,
						'completion_rate' => 0,
					),
					200
				);
			}

			// Base query for automation contacts
			$contacts_query = Automation_Contact_Model::where( 'automation_id', $automation_id );

			// Get total contacts who entered the automation
			$total_contacts = $contacts_query->count();

			if ( $total_contacts === 0 ) {
				return new WP_REST_Response(
					array(
						'funnel_data'     => array(),
						'total_contacts'  => 0,
						'completion_rate' => 0,
					),
					200
				);
			}

			// Calculate funnel data for each step
			$funnel_data = array();

			// Add entrance step
			$funnel_data[] = array(
				'label'      => __( 'Entrance', 'quillcrm' ),
				'value'      => $total_contacts,
				'percentage' => 100,
				'step_id'    => null,
				'step_type'  => 'entrance',
			);

			// Process each automation step
			foreach ( $steps as $step ) {
				$step_processes_query = Automation_Contact_Processes_Model::where( 'automation_id', $automation_id )
					->where( 'step_id', $step->id )
					->where( 'status', 'completed' );

				if ( $step_processes_query->count() === 0 ) {
					continue;
				}

				$step_contacts = $step_processes_query->count();
				$percentage    = $total_contacts > 0 ? round( ( $step_contacts / $total_contacts ) * 100, 1 ) : 0;

				$funnel_data[] = array(
					'label'      => $this->get_step_label( $step->action ),
					'value'      => $step_contacts,
					'percentage' => (int) ceil( $percentage ),
					'step_id'    => $step->id,
					'step_type'  => $step->type,
				);
			}

			// Calculate completion rate (contacts who completed all steps)
			$completed_contacts = Automation_Contact_Model::where( 'automation_id', $automation_id )
				->where( 'status', 'completed' );

			$completion_count = $completed_contacts->count();
			$completion_rate  = $total_contacts > 0 ? round( ( $completion_count / $total_contacts ) * 100, 1 ) : 0;

			return new WP_REST_Response(
				array(
					'funnel_data'     => $funnel_data,
					'total_contacts'  => $total_contacts,
					'completion_rate' => $completion_rate,
					'automation'      => array(
						'id'   => $automation->id,
						'name' => $automation->name,
					),
				),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get step report
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_steps_report( $request ) {
		try {
			$automation_id = $request->get_param( 'id' );
			// Verify automation exists
			$automation = Automation_Model::find( $automation_id );
			if ( ! $automation ) {
				return new WP_Error( 'not_found', __( 'Automation not found.', 'quillcrm' ), array( 'status' => 404 ) );
			}

			// Get total contacts who entered the automation
			$total_contacts = Automation_Contact_Model::where( 'automation_id', $automation_id )->count();

			if ( $total_contacts === 0 ) {
				return new WP_REST_Response(
					array(
						'steps'          => array(),
						'total_contacts' => 0,
					),
					200
				);
			}

			// get step IDs from automation_contacts_processes
			$steps_ids = Automation_Contact_Processes_Model::where( 'automation_id', $automation_id )
				->orderBy( 'created_at' )
				->distinct()
				->pluck( 'step_id' );

			// Get all steps for this automation
			$steps = Automation_Step_Model::whereIn( 'id', $steps_ids )
				->where( 'status', '!=', 'deleted' )
				->get();

			$step_reports = array();

			// Add entrance step
			$step_reports[] = array(
				'stepName'          => __( 'Entrance', 'quillcrm' ),
				'contactsEntered'   => $total_contacts,
				'contactsCompleted' => $total_contacts,
				'completionRate'    => 100,
				'dropOffRate'       => 0,
				'stepId'            => null,
				'stepType'          => 'entrance',
			);

			// Process each automation step
			foreach ( $steps as $step ) {
				// Count contacts who entered this step
				$step_processes = Automation_Contact_Processes_Model::where( 'automation_id', $automation_id )
					->where( 'step_id', $step->id )
					->where( 'status', 'completed' );

				if ( $step_processes->count() === 0 ) {
					continue;
				}

				$step_contacts_entered = $step_processes->count();

				// Count contacts who completed this step (for now, same as entered)
				// In future, you might want to add a 'completed' status check
				$step_contacts_completed = $step_contacts_entered;

				// Calculate completion rate relative to total contacts
				$completion_rate = $total_contacts > 0 ? round( ( $step_contacts_entered / $total_contacts ) * 100, 1 ) : 0;

				// Calculate drop-off rate from previous step
				$drop_off_rate = $total_contacts > 0 ? round( ( ( $total_contacts - $step_contacts_entered ) / $total_contacts ) * 100, 1 ) : 0;

				$step_reports[] = array(
					'stepName'          => $this->get_step_label( $step->action ),
					'contactsEntered'   => $step_contacts_entered,
					'contactsCompleted' => $step_contacts_completed,
					'completionRate'    => (int) ceil( $completion_rate ),
					'dropOffRate'       => (int) ceil( $drop_off_rate ),
					'stepId'            => $step->id,
					'stepType'          => $step->type,
				);
			}

			// Calculate overall conversion rate: (last step completed / first step entered) * 100
			$first_step_entered  = $total_contacts;
			$last_step_completed = 0;

			// Find the last step that has completed contacts
			for ( $i = count( $step_reports ) - 1; $i >= 0; $i-- ) {
				if ( $step_reports[ $i ]['contactsCompleted'] > 0 ) {
					$last_step_completed = $step_reports[ $i ]['contactsCompleted'];
					break;
				}
			}

			$overall_conversion = $first_step_entered > 0 ? round( ( $last_step_completed / $first_step_entered ) * 100, 1 ) : 0;

			return new WP_REST_Response(
				array(
					'steps'              => $step_reports,
					'total_contacts'     => $total_contacts,
					'overall_conversion' => (int) ceil( $overall_conversion ),
					'automation'         => array(
						'id'   => $automation->id,
						'name' => $automation->name,
					),
				),
				200
			);
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}


	/**
	 * Get step label
	 *
	 * @since 1.0.0
	 *
	 * @param string $string Step action.
	 *
	 * @return string
	 */
	public function get_step_label( $string ) {
		return ucwords( str_replace( '_', ' ', $string ) );
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
}
