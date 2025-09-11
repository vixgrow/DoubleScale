<?php

namespace QuillCRM\Automations\Actions\Deal;

use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

// Use global function via fully-qualified call when needed.

class Update_Title_Deal extends Base_Deal_Action {









	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update a deal title';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_title_deal';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the title of a deal.';


	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();


	/**
	 * Action Source
	 *
	 * @var string
	 */
	public $source = 'crm';


	/**
	 * Action Group
	 *
	 * @var string
	 */
	public $group = 'deal';



	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$title = $step->get_setting( 'title' );
		$deals = $this->build_target_deals_query(
			array(
				'affects'  => $step->get_setting( 'affects' ),
				'pipeline' => $step->get_setting( 'pipeline' ),
			),
			$automation_contact
		)->get();

		foreach ( $deals as $deal ) {
			$deal->title = $title;
			$deal->save();
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
			'title'    => array(
				'label' => $this->t( 'Deal Title' ),
				'type'  => 'text',
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
	 * Get users options
	 *
	 * @return array
	 */
	public function get_pipelines_options() {
		return parent::get_pipelines_options();
	}

	/**
	 * Get effects options
	 *
	 * @return array
	 */
	public function get_effects_options() {
		 return parent::get_effects_options();
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
				'title'    => array(
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

Update_Title_Deal::instance();
