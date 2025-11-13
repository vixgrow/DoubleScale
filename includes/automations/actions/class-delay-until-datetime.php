<?php

/**
 * Delay Until Datetime Action
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
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\QuillCRM;

/**
 * Delay Until Datetime Action
 */
class Delay_Until_Datetime extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Delay Until Datetime';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'delay-until-datetime';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will delay the automation until a specified datetime.';

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
	 * Source
	 *
	 * @var string
	 */
	public $source = 'crm';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'contact';

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$next_step = $automation->get_next_step( $step );
		if ( ! $next_step ) {
			return false;
		}
		// Schedule the next step after 2 minutes
		$datetime = $step->get_setting( 'datetime' );
		// convert datetime to timestamp
		$timestamp = ( new \DateTime( $datetime ) )->getTimestamp();

		QuillCRM::instance()->automations_tasks->schedule_single( $timestamp, 'process_automation_step', $automation->id, $step->id, $next_step->id, $automation_contact->id );
		return true;
	}

	/**
	 * Get fields.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'datetime' => array(
				'type'  => 'datetime',
				'label' => __( 'Datetime', 'quillcrm' ),
			),
		);
	}

	/**
	 * Get Attributes Schema
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'datetime' => array(
					'type'    => 'string',
					'title'   => 'Datetime (YYYY-MM-DD HH:MM:SS)',
					'default' => 'now',
				),
			),
		);
	}
}

Delay_Until_Datetime::instance();
