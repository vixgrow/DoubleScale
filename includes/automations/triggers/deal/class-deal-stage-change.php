<?php

namespace QuillCRM\Automations\Triggers\Deal;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Models\Automation_Model;


/**
 * Deal Stage Change Trigger
 */
class Deal_Stage_Change extends Trigger {






	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Deal Stage Change';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_stage_change';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a deal stage is changed.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Trigger Source
	 *
	 * @var string
	 */
	public $source = 'crm';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'deal';

	public function __construct() {
		 parent::__construct();
	}

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks(): void {
		\add_action( 'quillcrm_deal_stage_changed', array( $this, 'deal_stage_changed' ), 10, 4 );
	}

	/**
	 * Is Processable
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation Automation Model.
	 * @param array            $args Arguments.
	 *
	 * @return bool
	 */
	public function is_processable( Automation_Model $automation, $args ) {
		$deal         = $args['deal'];
		$old_stage_id = $args['data']['old_stage_id'];
		$new_stage_id = $args['data']['new_stage_id'];

		// Get automation settings with default values
		$automation_pipeline_id  = $automation->get_setting( 'pipeline', 'any-pipeline' );
		$automation_old_stage_id = $automation->get_setting( 'old_stage', 'any-stage' );
		$automation_new_stage_id = $automation->get_setting( 'new_stage', 'any-stage' );

		if ( $old_stage_id === $new_stage_id ) {
			return false;
		}

		// Case 1: {"pipeline":"any-pipeline","old_stage":"any-stage","new_stage":"any-stage"}
		// All conditions are "any" - trigger for all deals regardless of pipeline or stages
		if (
			$automation_pipeline_id === 'any-pipeline' &&
			$automation_old_stage_id === 'any-stage' &&
			$automation_new_stage_id === 'any-stage'
		) {
			return true;
		}

		// Case 2: {"pipeline":"value","old_stage":"any-stage","new_stage":"any-stage"}
		// Specific pipeline, any old stage, any new stage
		if (
			$automation_pipeline_id !== 'any-pipeline' &&
			$automation_old_stage_id === 'any-stage' &&
			$automation_new_stage_id === 'any-stage'
		) {
			return $deal->pipeline_id == $automation_pipeline_id;
		}

		// Case 3: {"pipeline":"value","old_stage":"value","new_stage":"any-stage"}
		// Specific pipeline, specific old stage, any new stage
		if (
			$automation_pipeline_id !== 'any-pipeline' &&
			$automation_old_stage_id !== 'any-stage' &&
			$automation_new_stage_id === 'any-stage'
		) {
			return $deal->pipeline_id == $automation_pipeline_id &&
				$old_stage_id == $automation_old_stage_id;
		}

		// Case 4: {"pipeline":"value","old_stage":"any-stage","new_stage":"value"}
		// Specific pipeline, any old stage, specific new stage
		if (
			$automation_pipeline_id !== 'any-pipeline' &&
			$automation_old_stage_id === 'any-stage' &&
			$automation_new_stage_id !== 'any-stage'
		) {
			return $deal->pipeline_id == $automation_pipeline_id &&
				$new_stage_id == $automation_new_stage_id;
		}

		// Case 5: {"pipeline":"value","old_stage":"value","new_stage":"value"}
		// All conditions are specific values
		if (
			$automation_pipeline_id !== 'any-pipeline' &&
			$automation_old_stage_id !== 'any-stage' &&
			$automation_new_stage_id !== 'any-stage'
		) {
			return $deal->pipeline_id == $automation_pipeline_id &&
				$old_stage_id == $automation_old_stage_id &&
				$new_stage_id == $automation_new_stage_id;
		}
		return false;
	}

	/**
	 * Deal Stage Changed
	 *
	 * @since 1.0.0
	 *
	 * @param Deal_Model    $deal Deal Model
	 * @param Contact_Model $contact Contact Model
	 * @param int           $old_stage_id Old Stage ID
	 * @param int           $new_stage_id New Stage ID
	 *
	 * @return void
	 */
	public function deal_stage_changed( $contact, $deal, $old_stage_id, $new_stage_id ) {
		$data = array(
			'contact' => $contact,
			'deal'    => $deal,
			'data'    => array(
				'old_stage_id' => $old_stage_id,
				'new_stage_id' => $new_stage_id,
			),
		);

		$this->process( $data );
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
			'pipeline'  => array(
				'label'         => \__( 'Pipeline', 'quillcrm' ),
				'type'          => 'deal_stage_change',
				'endpoint'      => 'pipelines',
				'multiple'      => false,
				'default-value' => 'any-pipeline',
			),
			'old_stage' => array(
				'label'         => \__( 'Old Stage', 'quillcrm' ),
				'type'          => 'deal_stage_change',
				'endpoint'      => 'pipeline-stages',
				'parent'        => 'pipeline',
				'multiple'      => false,
				'default-value' => 'any-stage',
			),
			'new_stage' => array(
				'label'         => \__( 'New Stage', 'quillcrm' ),
				'type'          => 'deal_stage_change',
				'endpoint'      => 'pipeline-stages',
				'parent'        => 'pipeline',
				'multiple'      => false,
				'default-value' => 'any-stage',
			),
		);
	}

	/**
	 * Get Attributes Schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'pipeline_id'  => array(
					'type'     => 'integer',
					'required' => true,
				),
				'old_stage_id' => array(
					'type'     => 'integer',
					'required' => true,
				),
				'new_stage_id' => array(
					'type'     => 'integer',
					'required' => true,
				),
			),
		);
	}
}

Triggers_Manager::instance()->register( new Deal_Stage_Change() );
