<?php
/**
 * Process Automation
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations;

use Exception;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\QuillCRM;

/**
 * Process Automation
 */
class Process_Automation {

	/**
	 * Automation
	 *
	 * @var Automation_Model
	 */
	public $automation;

	/**
	 * Arguments
	 *
	 * @var array
	 */
	public $args = array();

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation
	 * @param array            $args
	 */
	public function __construct( Automation_Model $automation, $args = array() ) {
		$this->automation = $automation;
		$this->args       = $args;
	}

	/**
	 * Start
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function start() {
		$automation_contact = $this->add_contact();
		if ( ! $automation_contact ) {
			return;
		}

		$first_step = $this->automation->get_first_step();

		if ( $first_step ) {
			$this->enqueue_step( $first_step->id, $automation_contact->id );
		}
	}

	/**
	 * Add Contact
	 *
	 * @since 1.0.0
	 *
	 * @param object $step
	 *
	 * @return Contact_Model
	 */
	public function add_contact() {
		$multiple_runs = $this->automation->get_setting( 'multiple_runs', false );
		$contact_email = $this->args['contact_email'];
		$contact       = Contact_Model::where( 'email', $contact_email )->first();

		if ( ! $contact ) {
			$contact = Contact_Model::create(
				array(
					'email' => $contact_email,
				)
			);
		}

		$automation_contact = $this->automation->contacts()->where( 'contact_id', $contact->id )->first();

		if ( $automation_contact && ! $multiple_runs ) {
			return false;
		}

		if ( ! $automation_contact ) {
			$automation_contact = Automation_Contact_Model::create(
				array(
					'automation_id' => $this->automation->id,
					'contact_id'    => $contact->id,
					'status'        => 'active',
					'data'          => $this->args['data'] ?? array(),
				)
			);
		}

		return $automation_contact;
	}

	/**
	 * Process Step
	 *
	 * @since 1.0.0
	 *
	 * @param object $step Automation Step.
	 * @param int    $automation_contact_id Automation Contact ID.
	 *
	 * @return void
	 */
	public function process_step( $step, $automation_contact_id ) {
		error_log( 'Process Step: ' . $step->id . ' Automation Contact ID: ' . $automation_contact_id );
		try {
			$automation_contact = Automation_Contact_Model::findOrFail( $automation_contact_id );
			$action             = Actions_Manager::instance()->get_action( $step->action );
			error_log( $automation_contact->contact );
			$result = $action->process_action( $this->automation, $step, $automation_contact->contact );

			if ( ! $result ) {
				$this->add_automation_contact_process( $step, $automation_contact->id, 'failed' );
				$this->update_automation_contact_status( $automation_contact, 'failed' );
				throw new Exception( __( 'Action failed', 'quillcrm' ) );
			}

			// Add to the automation_contact_processes table
			$this->add_automation_contact_process( $step, $automation_contact->id, 'completed' );

			// Check if step is the last step
			$last_step = $this->automation->get_last_step();
			if ( $step->order === $last_step->order ) {
				// Complete automation
				$this->update_automation_contact_status( $automation_contact, 'completed' );
				return;
			}

			if ( $action->auto_enqueue ) {
				$next_step = $this->automation->get_next_step( $step->order );
				// Enqueue next step
				$this->enqueue_step( $next_step->id, $$automation_contact->id );
			}
		} catch ( Exception $e ) {
			error_log( 'Process Step Error: ' . $e->getMessage() );
			return;
		}
	}

	/**
	 * Update Automation Contact Status
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Automation Contact.
	 * @param string                   $status Status.
	 *
	 * @return void
	 */
	public function update_automation_contact_status( $automation_contact, $status ) {
		error_log( 'Update Automation Contact Status: ' . $automation_contact->id . ' Status: ' . $status );

		$automation_contact->update(
			array(
				'status' => $status,
			)
		);
	}

	/**
	 * Add Automation Contact Process
	 *
	 * @since 1.0.0
	 *
	 * @param object $step Automation Step.
	 * @param int    $automation_contact_id Automation Contact ID.
	 * @param string $status Status.
	 *
	 * @return void
	 */
	public function add_automation_contact_process( $step, $automation_contact_id, $status ) {
		error_log( 'Add Automation Contact Process: ' . $step->id . ' Automation Contact ID: ' . $automation_contact_id . ' Status: ' . $status );
		$this->automation->processes()->create(
			array(
				'automation_contact_id' => $automation_contact_id,
				'step_id'               => $step->id,
				'status'                => $status,
			)
		);
	}

	/**
	 * Enqueue Next Step
	 *
	 * @since 1.0.0
	 *
	 * @param int $step_id Step ID.
	 * @param int $automation_contact_id Contact ID.
	 *
	 * @return void
	 */
	public function enqueue_step( $step_id, $automation_contact_id ) {
		error_log( 'Enqueue Step: ' . $step_id . ' Automation Contact ID: ' . $automation_contact_id );
		QuillCRM::instance()->automations_tasks->enqueue_async( 'process_automation_step', $this->automation, $step_id, $automation_contact_id );
	}
}
