<?php

namespace QuillCRM\Automations\Actions\Deal;


use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;


// Use global function via fully-qualified call when needed.

class Update_Stage_Deal extends Base_Deal_Action {




	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update Stage Deal';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_stage_deal';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the stage of a deal.';


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
		$old_pipeline = $step->get_setting( 'old_pipeline' );
		$new_stage    = $step->get_setting( 'new_stage' );
		$new_pipeline = $step->get_setting( 'pipeline' );

		$deals = $this->build_target_deals_query(
			array(
				'effects'      => $step->get_setting( 'effects' ),
				// For the filtering of "old" pipeline we must use 'old_pipeline' key
				// instead of the default 'pipeline'.
				'old_pipeline' => $old_pipeline,
			),
			$automation_contact,
			'old_pipeline'
		)->get();

		foreach ( $deals as $deal ) {
			$deal->setAttribute( 'pipeline_id', $new_pipeline );
			$deal->setAttribute( 'stage_id', $new_stage );
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
			'pipeline'     => array(
				'label'         => $this->t( 'New pipeline' ),
				'type'          => 'pipeline_stage_change',
				'endpoint'      => 'pipelines',
				'multiple'      => false,
				'default-value' => '',
			),
			'new_stage'    => array(
				'label'         => $this->t( 'New stage' ),
				'type'          => 'pipeline_stage_change',
				'endpoint'      => 'pipeline-stages',
				'parent'        => 'pipeline',
				'multiple'      => false,
				'default-value' => '',
			),
			'effects'      => array(
				'label'   => $this->t( 'Effects' ),
				'type'    => 'select',
				'options' => $this->get_effects_options(),
			),
			'old_pipeline' => array(
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
				'pipeline'     => array(
					'type'     => 'integer',
					'required' => true,
				),
				'new_stage'    => array(
					'type'     => 'integer',
					'required' => true,
				),
				'effects'      => array(
					'type'     => 'string',
					'required' => true,
				),
				'old_pipeline' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Update_Stage_Deal::instance();
