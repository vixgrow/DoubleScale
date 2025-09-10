<?php

namespace QuillCRM\Automations\Actions\Deal;

use QuillCRM\Abstracts\Action;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Models\Pipeline_Model;

class Update_Stage_Deal extends Action {











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
		$effects      = $step->get_setting( 'effects' );
		$new_pipeline = $step->get_setting( 'pipeline' );
		$deals        = Deal_Model::query();

		if ( $old_pipeline !== 'any-pipeline' ) {
			$deals = $deals->where( 'pipeline_id', $old_pipeline );
		}

		if ( $effects === 'all-deals-contact' ) {
			$deals = $deals->where( 'contact_id', $automation_contact->contact->id );
		} elseif ( $effects === 'all-open-deals-contact' ) {
			$deals = $deals->where( 'contact_id', $automation_contact->contact->id )->where( 'status', 'open' );
		} elseif ( $effects === 'all-won-deals-contact' ) {
			$deals = $deals->where( 'contact_id', $automation_contact->contact->id )->where( 'status', 'won' );
		} elseif ( $effects === 'all-lost-deals-contact' ) {
			$deals = $deals->where( 'contact_id', $automation_contact->contact->id )->where( 'status', 'lost' );
		}

		$deals = $deals->get();

		foreach ( $deals as $deal ) {
			$deal->pipeline_id = $new_pipeline;
			$deal->stage_id    = $new_stage;
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
				'label'         => __( 'New pipeline', 'quillcrm' ),
				'type'          => 'pipeline_stage_change',
				'endpoint'      => 'pipelines',
				'multiple'      => false,
				'default-value' => '',
			),
			'new_stage'    => array(
				'label'         => __( 'New stage', 'quillcrm' ),
				'type'          => 'pipeline_stage_change',
				'endpoint'      => 'pipeline-stages',
				'parent'        => 'pipeline',
				'multiple'      => false,
				'default-value' => '',
			),
			'effects'      => array(
				'label'   => __( 'Effects', 'quillcrm' ),
				'type'    => 'select',
				'options' => $this->get_effects_options(),
			),
			'old_pipeline' => array(
				'label'   => __( 'Pipeline', 'quillcrm' ),
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
		$pipelines = Pipeline_Model::all();
		$options   = array(
			'any-pipeline' => __( 'Any Pipeline', 'quillcrm' ),
		);
		foreach ( $pipelines as $pipeline ) {
			$options[ $pipeline->id ] = $pipeline->name;
		}
		return $options;
	}

	/**
	 * Get effects options
	 *
	 * @return array
	 */
	public function get_effects_options() {
		return array(
			'all-deals-contact'      => __( 'All deals for this contact', 'quillcrm' ),
			'all-open-deals-contact' => __( 'All open deals for this contact', 'quillcrm' ),
			'all-won-deals-contact'  => __( 'All won deals for this contact', 'quillcrm' ),
			'all-lost-deals-contact' => __( 'All lost deals for this contact', 'quillcrm' ),
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
