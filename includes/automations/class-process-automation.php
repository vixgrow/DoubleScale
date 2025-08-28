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
use QuillCRM\Automations\Conditions\Process as Process_Conditions;

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
		$contact        = $this->args['contact'] ?? null;

		if ( ! $contact ) {
			$contact = $this->maybe_create_contact();
		}

		$automation_contact = $this->automation->contacts()->where( 'contact_id', $contact->id )->first();

		if ( $automation_contact && ! $multiple_runs ) {
			return false;
		}

		$automation_contact = Automation_Contact_Model::create(
			array(
				'automation_id' => $this->automation->id,
				'contact_id'    => $contact->id,
				'status'        => 'active',
				'data'          => $this->args['data'] ?? array(),
			)
		);

		return $automation_contact;
	}

	/**
	 * Maybe Create Contact
	 *
	 * @since 1.0.0
	 *
	 * @return Contact_Model
	 */
	public function maybe_create_contact() {
		$contact = Contact_Model::where( 'email', $this->args['email'] )->first();

		if ( ! $contact ) {
			$contact = Contact_Model::create( $this->args );
		} else {
			$contact->update( $this->args );
		}

		return $contact;
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
		// If this step has a parent_id > 0, it's a child of a condition step
		// We need to verify that the parent condition has been processed first
		if ( $step->parent_id > 0 ) {
			$automation_contact = Automation_Contact_Model::findOrFail( $automation_contact_id );
			$parent_step        = $this->automation->steps()->where( 'id', $step->parent_id )->first();

			if ( $parent_step && $parent_step->type === 'condition' ) {
				// Check if the parent condition has been processed
				$parent_process = $this->automation->processes()->where( 'automation_contact_id', $automation_contact_id )
					->where( 'step_id', $parent_step->id )->where( 'status', 'completed' )->first();

				if ( ! $parent_process ) {
					// Parent condition hasn't been processed yet, so we shouldn't process this step
					error_log( 'Skipping step ' . $step->id . ' because parent condition ' . $parent_step->id . ' has not been processed yet' );
					return;
				}
			}
		}

		switch ( $step->type ) {
			case 'action':
				$this->process_action( $step, $automation_contact_id );
				break;
			case 'condition':
				$this->process_condition( $step, $automation_contact_id );
				break;
			case 'goal':
				$this->process_goal( $step, $automation_contact_id );
				break;
			case 'end_automation':
				$this->process_end_automation( $step, $automation_contact_id );
				break;
		}
	}

	/**
	 * Process End Automation
	 *
	 * @since 1.0.0
	 *
	 * @param object $step Automation Step.
	 * @param int    $automation_contact_id Automation Contact ID.
	 *
	 * @return void
	 */
	public function process_end_automation( $step, $automation_contact_id ) {
		try {
			$automation_contact = Automation_Contact_Model::findOrFail( $automation_contact_id );
			$this->update_automation_contact_status( $automation_contact, 'completed', $step->id, 0 );
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				\__( 'Process End Automation Error', 'quillcrm' ),
				array(
					'code'  => 'process_end_automation',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
			return;
		}
	}

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param object $step Automation Step.
	 * @param int    $automation_contact_id Automation Contact ID.
	 *
	 * @return void
	 */
	public function process_action( $step, $automation_contact_id ) {
		try {
			$automation_contact = Automation_Contact_Model::findOrFail( $automation_contact_id );
			$action             = Actions_Manager::instance()->get_action( $step->action );
			$result             = $action->process_action( $this->automation, $step, $automation_contact );
			$next_step          = $this->get_next_step( $step );

			if ( ! $result ) {
				$this->add_automation_contact_process( $step, $automation_contact->id, 'failed' );
				$this->update_automation_contact_status( $automation_contact, 'failed', $step->id, $next_step ? $next_step->id : 0 );
				throw new Exception( \__( 'Action failed', 'quillcrm' ) );
			}

			// Add to the automation_contact_processes table
			$this->add_automation_contact_process( $step, $automation_contact->id, 'completed' );

			if ( $action->auto_enqueue ) {
				if ( $next_step ) {
					$this->enqueue_step( $next_step->id, $automation_contact->id );
				} else {
					$this->update_automation_contact_status( $automation_contact, 'completed', $step->id, 0 );
				}
			}
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				\__( 'Process Action Error', 'quillcrm' ),
				array(
					'code'  => 'process_action',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
			return;
		}
	}

	/**
	 * Get Next Step
	 *
	 * @since 1.0.0
	 *
	 * @param object $step Automation Step.
	 *
	 * @return object|bool
	 */
	public function get_next_step( $step ) {
		// For root level steps, get the next root level step
		if ( 0 == $step->parent_id ) {
			return $this->automation->steps()
				->where( 'status', 'active' )
				->where( 'parent_id', 0 )
				->where( 'order', '>', $step->order )
				->orderBy( 'order', 'asc' )
				->first();
		}

		// For branch steps, first look for next step in the same branch
		$next_step = $this->automation->steps()
			->where( 'status', 'active' )
			->where( 'parent_id', $step->parent_id )
			->where( 'condition', $step->condition )
			->where( 'order', '>', $step->order )
			->orderBy( 'order', 'asc' )
			->first();

		// If no more steps in this branch, we need to find what comes after the condition block
		if ( ! $next_step ) {
			// Get the parent condition step
			$parent_step = $this->automation->steps()
				->where( 'id', $step->parent_id )
				->first();

			if ( $parent_step ) {
				// If parent condition is also nested, find next step in its parent context
				if ( $parent_step->parent_id > 0 ) {
					$next_step = $this->automation->steps()
						->where( 'status', 'active' )
						->where( 'parent_id', $parent_step->parent_id )
						->where( 'condition', $parent_step->condition )
						->where( 'order', '>', $parent_step->order )
						->orderBy( 'order', 'asc' )
						->first();
				} else {
					// Parent condition is at root level, find next root level step
					$next_step = $this->automation->steps()
						->where( 'status', 'active' )
						->where( 'parent_id', 0 )
						->where( 'order', '>', $parent_step->order )
						->orderBy( 'order', 'asc' )
						->first();
				}
			}
		}

		return $next_step;
	}

	/**
	 * Process Condition
	 *
	 * @since 1.0.0
	 *
	 * @param object $step Automation Step.
	 * @param int    $automation_contact_id Automation Contact ID.
	 *
	 * @return void
	 */
	public function process_condition( $step, $automation_contact_id ) {
		try {
			$automation_contact = Automation_Contact_Model::findOrFail( $automation_contact_id );
			$conditions         = $step->settings;
			$result             = new Process_Conditions( $automation_contact, $conditions );
			$check              = $result->check();

			$this->add_automation_contact_process( $step, $automation_contact->id, 'completed' );
			if ( $check ) {
				$this->process_yes_steps( $step, $automation_contact );
			} else {
				$this->process_no_steps( $step, $automation_contact );
			}
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				\__( 'Process Condition Error', 'quillcrm' ),
				array(
					'code'  => 'process_condition',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
			return;
		}
	}

	/**
	 * Process Yes Steps
	 *
	 * @since 1.0.0
	 *
	 * @param object                   $step Automation Step.
	 * @param Automation_Contact_Model $automation_contact Automation Contact.
	 *
	 * @return void
	 */
	public function process_yes_steps( $step, $automation_contact ) {
		$first_yes_step = $automation_contact->automation->steps()
			->where( 'status', 'active' )
			->where( 'parent_id', $step->id )
			->where( 'condition', 'yes' )
			->orderBy( 'order', 'asc' )
			->first();

		if ( $first_yes_step ) {
			error_log( 'Processing YES condition branch - enqueueing step: ' . $first_yes_step->id );
			$this->enqueue_step( $first_yes_step->id, $automation_contact->id );
		} else {
			error_log( 'No YES branch steps found for condition step: ' . $step->id . ', moving to next step after condition' );
			// No YES branch steps, continue to the next step after this condition
			$next_step = $this->get_next_step( $step );
			if ( $next_step ) {
				$this->enqueue_step( $next_step->id, $automation_contact->id );
			} else {
				$this->update_automation_contact_status( $automation_contact, 'completed', $step->id, 0 );
			}
		}
	}

	/**
	 * Process No Steps
	 *
	 * @since 1.0.0
	 *
	 * @param object                   $step Automation Step.
	 * @param Automation_Contact_Model $automation_contact Automation Contact.
	 *
	 * @return void
	 */
	public function process_no_steps( $step, $automation_contact ) {
		$first_no_step = $automation_contact->automation->steps()
			->where( 'status', 'active' )
			->where( 'parent_id', $step->id )
			->where( 'condition', 'no' )
			->orderBy( 'order', 'asc' )
			->first();

		if ( $first_no_step ) {
			error_log( 'Processing NO condition branch - enqueueing step: ' . $first_no_step->id );
			$this->enqueue_step( $first_no_step->id, $automation_contact->id );
		} else {
			error_log( 'No NO branch steps found for condition step: ' . $step->id . ', moving to next step after condition' );
			// No NO branch steps, continue to the next step after this condition
			$next_step = $this->get_next_step( $step );
			if ( $next_step ) {
				$this->enqueue_step( $next_step->id, $automation_contact->id );
			} else {
				$this->update_automation_contact_status( $automation_contact, 'completed', $step->id, 0 );
			}
		}
	}

	/**
	 * Process Goal
	 *
	 * @since 1.0.0
	 *
	 * @param object $step Automation Step.
	 * @param int    $automation_contact_id Automation Contact ID.
	 *
	 * @return void
	 */
	public function process_goal( $step, $automation_contact_id ) {
		try {
			$automation_contact = Automation_Contact_Model::findOrFail( $automation_contact_id );
			$skip               = $step->get_setting( 'skip', false );
			$next_step          = $this->get_next_step( $step );
			if ( $skip ) {
				$this->add_automation_contact_process( $step, $automation_contact->id, 'pending' );
				if ( $next_step ) {
					$this->enqueue_step( $next_step->id, $automation_contact->id );
				}
				return;
			}
			$this->update_automation_contact_status( $automation_contact, 'pending', $step->id, $next_step ? $next_step->id : 0 );
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				\__( 'Process Goal Error', 'quillcrm' ),
				array(
					'code'  => 'process_goal',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
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
	 * @param int                      $current_step Current Step.
	 * @param int                      $next_step Next Step.
	 *
	 * @return void
	 */
	public function update_automation_contact_status( $automation_contact, $status, $current_step, $next_step ) {
		$automation_contact->update(
			array(
				'status'       => $status,
				'current_step' => $current_step,
				'next_step'    => $next_step,
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
		QuillCRM::instance()->automations_tasks->enqueue_sync( 'process_automation_step', $this->automation, $step_id, $automation_contact_id );
	}
}
