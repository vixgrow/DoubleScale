<?php

namespace QuillCRM\Automations\Triggers\Deal;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Models\Contact_Model;

/**
 * Deal Value Change Trigger
 */


class Deal_Value_Change extends Trigger {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Deal Value changes';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_value_change';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a deal value is changed.';

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

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'quillcrm_automation_deal_value_changed', array( $this, 'deal_value_changed' ), 10, 4 );
	}

	/**
	 * Deal Value Changed
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact Contact Model
	 * @param Deal_Model    $deal Deal Model
	 * @param float         $old_value Old Value
	 * @param float         $new_value New Value
	 */
	public function deal_value_changed( $contact, $deal, $old_value, $new_value ) {
		$data = array(
			'contact' => $contact,
			'deal'    => $deal,
			'data'    => array(
				'old_value' => $old_value,
				'new_value' => $new_value,
			),
		);
		$this->process( $data );
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
		$automation_from_value = $automation->get_setting( 'from' ) ?? array();
		$automation_to_value   = $automation->get_setting( 'to' ) ?? array();
		$old_value             = (float) ( $args['data']['old_value'] ?? 0 );
		$new_value             = (float) ( $args['data']['new_value'] ?? 0 );

		if ( $old_value == $new_value ) {
			return false;
		}

		// Check 'from' condition
		if ( ! empty( $automation_from_value ) && ! $this->check_value_condition( $automation_from_value, $old_value ) ) {
			return false;
		}

		// Check 'to' condition
		if ( ! empty( $automation_to_value ) && ! $this->check_value_condition( $automation_to_value, $new_value ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Check if a value meets the specified condition
	 *
	 * @since 1.0.0
	 *
	 * @param array $condition_config The condition configuration
	 * @param float $value The value to check
	 *
	 * @return bool
	 */
	private function check_value_condition( $condition_config, $value ) {
		$condition    = $condition_config['condition'] ?? '';
		$target_value = (float) ( $condition_config['value'] ?? 0 );

		// If condition is 'any-value', always return true
		if ( 'any-value' === $condition ) {
			return true;
		}

		// Check specific conditions
		switch ( $condition ) {
			case 'equal_to':
				return $value === $target_value;
			case 'not_equal_to':
				return $value !== $target_value;
			case 'greater_than':
				return $value > $target_value;
			case 'lower_than':
				return $value < $target_value;
			default:
				return true; // Default to true for unknown conditions
		}
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
			'from' => array(
				'label' => __( 'From', 'quillcrm' ),
				'type'  => 'deal_value_change',
			),
			'to'   => array(
				'label' => __( 'To', 'quillcrm' ),
				'type'  => 'deal_value_change',
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'from' => array(
					'type'       => 'object',
					'properties' => array(
						'condition' => array(
							'type'     => 'string',
							'required' => true,
						),
						'value'     => array(
							'type'     => 'number',
							'required' => true,
						),
					),
				),
				'to'   => array(
					'type'       => 'object',
					'properties' => array(
						'condition' => array(
							'type'     => 'string',
							'required' => true,
						),
						'value'     => array(
							'type'     => 'number',
							'required' => true,
						),
					),
				),
			),
		);
	}
}

Triggers_Manager::instance()->register( new Deal_Value_Change() );
