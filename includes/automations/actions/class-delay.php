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
use QuillCRM\Models\Automation_Contact_Model;
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
		// Schedule the next step after 2 minutes
		$next_step = $automation->get_next_step( $step->order );
		$time      = null;
		$delay     = $step->get_attribute( 'delay' );
		$unit      = $step->get_attribute( 'unit' );

		switch ( $unit ) {
			case 'minutes':
				$time = strtotime( "+{$delay} minutes" );
				break;
			case 'hours':
				$time = strtotime( "+{$delay} hours" );
				break;
			case 'days':
				$time = strtotime( "+{$delay} days" );
				break;
		}

		QuillCRM::instance()->automations_tasks->schedule_single( $time, 'process_automation_step', $automation, $next_step->id, $automation_contact->id );

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
			'delay' => array(
				'type'  => 'number',
				'label' => __( 'Delay', 'quillcrm' ),
			),
			'unit'  => array(
				'type'    => 'select',
				'label'   => __( 'Unit', 'quillcrm' ),
				'options' => array(
					'minutes' => __( 'Minutes', 'quillcrm' ),
					'hours'   => __( 'Hours', 'quillcrm' ),
					'days'    => __( 'Days', 'quillcrm' ),
				),
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

Delay::instance();
