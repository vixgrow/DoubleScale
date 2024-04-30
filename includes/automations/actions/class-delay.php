<?php
/**
 * Delay Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\QuillCRM;

/**
 * Delay Action
 */
class Delay extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Wait X Days/Hours/Minutes';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'delay';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will delay the automation for a specified amount of time.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Auto enqueue step
	 *
	 * @var bool
	 */
	public $auto_enqueue = false;

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model      $automation Automation Model.
	 * @param Automation_Step_Model $step Automation Step Model.
	 * @param Contact_Model         $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Contact_Model $contact ) {
		error_log( 'Delay: ' . $automation->name . ' - ' . $step->name );
		// Schedule the next step after 2 minutes
		$next_step = $automation->get_next_step( $step->order );
		$time      = time() + MINUTE_IN_SECONDS;
		QuillCRM::instance()->automations_tasks->schedule_single( $time, 'process_automation_step', $automation, $next_step->id, $contact->id );

		return true;
	}


	/**
	 * Get Attributes Schema
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'delay' => array(
					'type'    => 'string',
					'title'   => 'Delay',
					'default' => '1',
				),
				'unit'  => array(
					'type'    => 'string',
					'title'   => 'Unit',
					'default' => 'minutes',
					'enum'    => array( 'minutes', 'hours', 'days' ),
				),
			),
		);
	}

}

Actions_Manager::instance()->register( new Delay() );
