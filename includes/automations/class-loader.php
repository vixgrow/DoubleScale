<?php

/**
 * Class Automations Loader
 * This class is responsible for loading the Automations
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations;

use QuillCRM\QuillCRM;
use Exception;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Automations\Process_Automation;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Automations Loader class
 */
final class Loader {





	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Loader
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Loader
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * constructor
	 */
	private function __construct() {
		add_action( 'quillcrm_loaded', array( $this, 'load_hooks' ) );
	}



	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		QuillCRM::instance()->automations_tasks->register_callback( 'process_automation_step', array( $this, 'process_automation_step' ) );
		QuillCRM::instance()->automations_tasks->register_callback( 'process_automations', array( $this, 'process_automations' ) );
		QuillCRM::instance()->automations_tasks->register_callback( 'process_automation_goal', array( $this, 'process_automation_goal' ) );
	}

	/**
	 * Process Automations
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation
	 * @param array            $args
	 *
	 * @return void
	 */
	public function process_automations( Automation_Model $automation, $args ) {
		error_log( 'started' );
		$process_automation = new Process_Automation( $automation, $args );
		$process_automation->start();
	}

	/**
	 * Process automation step
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model|int $automation The automation model or meta_id integer.
	 * @param int                  $step_id      The step.
	 * @param int                  $automation_contact_id      The automation contact.
	 * @return void
	 */
	public function process_automation_step( $automation, $step_id = null, $automation_contact_id = null ) {
		try {
			// if this below condition is true this meaning i get args from meta_id from database and automation is integer from that meta_id
			if ( is_numeric( $automation ) && $step_id == null && $automation_contact_id == null ) {
				$args = quillcrm_get_meta_args( $automation );
				if ( $args && count( $args ) >= 3 ) {
					list($automation, $parent_step_id, $step_id, $automation_contact_id) = $args;
				} else {
					throw new Exception( 'Failed to retrieve arguments from meta_id: ' . $automation );
				}
			}

			// after this i will check that i can get Automation_Model from $automation
			if ( ! $automation instanceof Automation_Model ) {
				$automation = Automation_Model::findOrFail( $automation );
				if ( ! $automation ) {
					throw new Exception( 'Automation not found' );
				}
			}

			if ( $parent_step_id && is_numeric( $parent_step_id ) && $parent_step_id > 0 ) {
				// Find and update the process record for the delay step, not the step itself
				$delay_process = $automation->processes()
					->where( 'automation_contact_id', $automation_contact_id )
					->where( 'step_id', $parent_step_id )
					->where( 'status', 'pending' )
					->first();

				if ( $delay_process ) {
					$delay_process->status = 'completed';
					$delay_process->save();
				}
			}
			$step               = Automation_Step_Model::findOrFail( $step_id );
			$automation_process = new Process_Automation( $automation );
			$automation_process->process_step( $step, $automation_contact_id );
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Process Automation Step Error: ', 'quillcrm' ),
				array(
					'code'  => 'process_automation_step',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
		}
	}

	/**
	 * Process automation goal
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Step_Model $step The automation model.
	 * @param int                   $automation_contact_id The automation contact ID.
	 *
	 * @return void
	 */
	public function process_automation_goal( $step, $automation_contact_id ) {
		try {
			$skip               = $step->get_setting( 'skip', false );
			$automation         = $step->automation;
			$automation_contact = Automation_Contact_Model::find( $automation_contact_id );

			if ( ! $automation || ! $automation_contact ) {
				return;
			}

			if ( ! $skip ) {
				// Update the goal process record to completed
				$goal_process = $automation_contact->processes()->where( 'step_id', $step->id )->where( 'status', 'pending' )->first();
				if ( $goal_process ) {
					$goal_process->status = 'completed';
					$goal_process->save();
				}

				// Move to next step if available
				if ( 0 !== $automation_contact->next_step ) {
					$automation_process = new Process_Automation( $step->automation );
					$automation_process->enqueue_step( $automation_contact->next_step, $automation_contact->id );
				}
			} else {
				// If skipped, just mark the process as completed
				$automation_process = $automation_contact->processes()->where( 'step_id', $step->id )->where( 'status', 'pending' )->first();
				if ( $automation_process ) {
					$automation_process->status = 'completed';
					$automation_process->save();
				}
			}
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Process Automation Goal Error: ', 'quillcrm' ),
				array(
					'code'  => 'process_automation_goal',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
		}
	}
}
