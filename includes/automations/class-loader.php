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
	 * Get meta arguments from database
	 *
	 * @param int $meta_id Meta ID
	 * @return array|false
	 */
	private function get_meta_args( $meta_id ) {
		global $wpdb;

		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}quillcrm_task_meta WHERE ID = %d",
				$meta_id
			),
			ARRAY_A
		);

		if ( ! $meta || empty( $meta['value'] ) ) {
			return false;
		}

		return maybe_unserialize( $meta['value'] );
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
	 * @param int                  $contact_id      The contact.
	 * @return void
	 */
	public function process_automation_step( $automation, $step_id = null, $contact_id = null ) {
		try {
			// if this below condition is true this meaning i get args from meta_id from database and automation is integer from that meta_id
			if ( is_numeric( $automation ) && $step_id == null && $contact_id == null ) {
				$args = $this->get_meta_args( $automation );
				if ( $args && count( $args ) >= 3 ) {
					list($automation, $step_id, $contact_id) = $args;
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

			$step               = Automation_Step_Model::findOrFail( $step_id );
			$automation_process = new Process_Automation( $automation );
			$automation_process->process_step( $step, $contact_id );
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
	 * @param int                   $contact_id      The contact.
	 *
	 * @return void
	 */
	public function process_automation_goal( $step, $contact_id ) {
		try {
			$skip       = $step->get_setting( 'skip', false );
			$automation = $step->automation;
			if ( ! $automation ) {
				return;
			}

			if ( ! $skip ) {
				$automation_contacts = $step->automation->contacts()->where( 'contact_id', $contact_id )->where( 'current_step', $step->id )->where( 'status', 'pending' )->get();
				foreach ( $automation_contacts as $automation_contact ) {
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
				}
			} else {
				$automation_contacts = $step->automation->contacts()->where( 'contact_id', $contact_id )->get();
				foreach ( $automation_contacts as $automation_contact ) {
					$automation_process = $automation_contact->processes()->where( 'step_id', $step->id )->where( 'status', 'pending' )->first();
					if ( $automation_process ) {
						$automation_process->status = 'completed';
						$automation_process->save();
					}
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
