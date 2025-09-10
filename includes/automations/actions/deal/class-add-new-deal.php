<?php

namespace QuillCRM\Automations\Actions\Deal;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Deal_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\User_Model;

class Add_New_Deal extends Action {


	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add New Deal';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'add_new_deal';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a new deal.';

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
		$data = array(
			'title'       => $step->get_setting( 'title' ),
			'value'       => $step->get_setting( 'value' ),
			'owner_id'    => $step->get_setting( 'owner' ),
			'pipeline_id' => $step->get_setting( 'pipeline' ),
			'stage_id'    => $step->get_setting( 'stage' ),
			'contact_id'  => $automation_contact->contact->id,
		);
		$deal = Deal_Manager::instance()->create_deal( $data );
		if ( ! $deal ) {
			return false;
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
				'label' => __( 'Deal Title', 'quillcrm' ),
				'type'  => 'text',
			),
			'value'    => array(
				'label' => __( 'Deal Value', 'quillcrm' ),
				'type'  => 'number',
			),
			'owner'    => array(
				'label'   => __( 'Owner', 'quillcrm' ),
				'type'    => 'select',
				'options' => $this->get_users_options(),
			),
			'pipeline' => array(
				'label'         => __( 'Pipeline', 'quillcrm' ),
				'type'          => 'pipeline_stage_change',
				'endpoint'      => 'pipelines',
				'multiple'      => false,
				'default-value' => '',
			),
			'stage'    => array(
				'label'         => __( 'Stage', 'quillcrm' ),
				'type'          => 'pipeline_stage_change',
				'endpoint'      => 'pipeline-stages',
				'parent'        => 'pipeline',
				'multiple'      => false,
				'default-value' => '',
			),
		);
	}

	/**
	 * Get users options
	 *
	 * @return array
	 */
	public function get_users_options() {
		$users   = User_Model::all();
		$options = array();
		foreach ( $users as $user ) {
			$options[ $user->ID ] = $user->display_name;
		}
		return $options;
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
				'value'    => array(
					'type'     => 'number',
					'required' => true,
				),
				'owner'    => array(
					'type'     => 'integer',
					'required' => true,
				),
				'pipeline' => array(
					'type'     => 'integer',
					'required' => true,
				),
				'stage'    => array(
					'type'     => 'integer',
					'required' => true,
				),
			),
		);
	}
}

Add_New_Deal::instance();
