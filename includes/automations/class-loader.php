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
	 * @param Automation_Model $automation The automation model.
	 * @param int              $step_id      The step.
	 * @param int              $contact_id      The contact.
	 * @return void
	 */
	public function process_automation_step( $automation, $step_id, $contact_id ) {
		error_log( 'Process Automation Step: ' . $step_id . ' Contact ID: ' . $contact_id );
		try {
			$step               = Automation_Step_Model::findOrFail( $step_id );
			$automation_process = new Process_Automation( $automation );
			$automation_process->process_step( $step, $contact_id );
		} catch ( Exception $e ) {
			error_log( 'Process Automation Step Error: ' . $e->getMessage() );
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
			error_log( 'Process Automation Goal Error: ' . $e->getMessage() );
		}
	}
}
