<?php
/**
 * Class Goal
 *
 * This class is responsible for handling the goal
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Models\Contact_Model;

/**
 * Goal class
 */
abstract class Goal {

	/**
	 * Goal Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name;

	/**
	 * Goal Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug;

	/**
	 * Goal Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description;

	/**
	 * Source
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $source;

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group;

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	abstract public function load_hooks();

	/**
	 * Process automations
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @param array         $data Data.
	 *
	 * @return void
	 */
	public function process( $contact, $data ) {
		try {
			$steps = Automation_Step_Model::where( 'type', 'goal' )->where( 'action', $this->slug )->get();
			if ( ! $steps ) {
				return;
			}

			foreach ( $steps as $step ) {
				if ( $this->is_completed( $step, $data ) ) {
					$this->enqueue_goal( $contact, $step );
				}
			}
		} catch ( Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Error processing goal', 'quillcrm' ),
				array(
					'code'  => 'goal_error',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
					),
				)
			);
		}
	}

	/**
	 * Check if the goal is completed
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Step_Model $step Automation Step Model.
	 * @param array                 $data Data.
	 *
	 * @return bool
	 */
	public function is_completed( Automation_Step_Model $step, $data ) {
		return true;
	}

	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array();
	}

	/**
	 * Enqueue goal
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model         $contact Contact Model.
	 * @param Automation_Step_Model $step Automation Step.
	 *
	 * @return void
	 */
	public function enqueue_goal( $contact, $step ) {
		QuillCRM::instance()->automations_tasks->enqueue_sync( 'process_automation_goal', $step, $contact->id );
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}
}
