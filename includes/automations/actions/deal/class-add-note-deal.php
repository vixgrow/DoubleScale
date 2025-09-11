<?php

namespace QuillCRM\Automations\Actions\Deal;

use QuillCRM\Managers\Activity_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Deal_Activity_Model;

class Add_Note_Deal extends Base_Deal_Action {



	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add a deal note';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'add_note_deal';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a note to a deal.';

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
	public $group = 'deal';

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
		$note  = $step->get_setting( 'note' );
		$deals = $this->build_target_deals_query(
			array(
				'affects'  => $step->get_setting( 'affects' ),
				'pipeline' => $step->get_setting( 'pipeline' ),
			),
			$automation_contact
		)->get();
		foreach ( $deals as $deal ) {
			Activity_Manager::instance()->add_note( $deal->id, $note );
		}
		return true;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'note'     => array(
				'label' => $this->t( 'Deal Note' ),
				'type'  => 'textarea',
			),
			'affects'  => array(
				'label'   => $this->t( 'Affects' ),
				'type'    => 'select',
				'options' => $this->get_effects_options(),
			),
			'pipeline' => array(
				'label'   => $this->t( 'Pipeline' ),
				'type'    => 'select',
				'options' => $this->get_pipelines_options(),
			),
		);
	}


	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'note'     => array(
					'type'     => 'string',
					'required' => true,
				),
				'affects'  => array(
					'type'     => 'string',
					'required' => true,
				),
				'pipeline' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Add_Note_Deal::instance();
