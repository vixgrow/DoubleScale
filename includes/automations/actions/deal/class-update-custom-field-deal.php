<?php

namespace QuillCRM\Automations\Actions\Deal;


use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Custom_Field_Model;
use WP_Error;
use Exception;

// Use global function via fully-qualified call when needed.

class Update_Custom_Field_Deal extends Base_Deal_Action {






	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update a deal custom field';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_custom_field_deal';


	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update a deal custom field.';



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
		$custom_fields = $step->get_setting( 'deal-custom-fields' );
		$affects       = $step->get_setting( 'affects' );
		$pipeline      = $step->get_setting( 'pipeline' );

		$deals = $this->build_target_deals_query(
			array(
				'affects'  => $affects,
				'pipeline' => $pipeline,
			),
			$automation_contact
		)->get();

		foreach ( $deals as $deal ) {
			$deal->sync_custom_fields( $custom_fields );
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
			'deal-custom-fields' => array(
				'label'   => $this->t( 'Custom Field' ),
				'type'    => 'deal_custom_field_change',
				'options' => $this->get_custom_fields_options(),
			),
			'affects'            => array(
				'label'   => $this->t( 'Affects' ),
				'type'    => 'select',
				'options' => $this->get_effects_options(),
			),
			'pipeline'           => array(
				'label'   => $this->t( 'Pipeline' ),
				'type'    => 'select',
				'options' => $this->get_pipelines_options(),
			),
		);
	}

	public function get_custom_fields_options() {
		$custom_fields = Custom_Field_Model::where( 'scope', 'deal' )->get();
		$options       = array();
		foreach ( $custom_fields as $custom_field ) {
			$options[ $custom_field->id ] = array(
				'label'      => $custom_field->name,
				'type'       => $custom_field->type,
				'attributes' => $custom_field->attributes,
			);
		}
		return $options;
	}


	public function get_fields_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'deal-custom-fields' => array(
					'type'     => 'array',
					'items'    => array(
						'type'       => 'object',
						'properties' => array(
							'custom_field_id' => array(
								'type' => 'string',
							),
							'value'           => array(
								'type' => 'string',
							),
						),
					),
					'required' => true,
				),
				'affects'            => array(
					'type'     => 'string',
					'required' => true,
				),
				'pipeline'           => array(
					'type'     => 'string',
					'required' => true,
				),
			),
		);
	}
}

Update_Custom_Field_Deal::instance();
