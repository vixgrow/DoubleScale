<?php
/**
 * Add Lists Action
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
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\List_Model;

/**
 * Add List Action
 */
class Add_Lists extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add to Lists';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'add_lists';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add the contact to a list.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model      $automation Automation Model.
	 * @param Automation_Step_Model $step Automation Step Model.
	 * @param Contact_Model         $contact Contact Model.
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Contact_Model $contact ) {
		$lists_ids = $step->get_setting( 'lists' );
		$lists     = List_Model::find( $lists_ids );

		if ( ! empty( $lists ) ) {
			$lists_ids = wp_list_pluck( $lists->toArray(), 'id' );
			error_log( 'Lists IDs: ' . wp_json_encode( $lists_ids ) );
			$contact->lists()->syncWithoutDetaching( $lists_ids );
		}

		return true;
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
				'lists' => array(
					'type'     => 'array',
					'items'    => array(
						'type' => 'integer',
					),
					'required' => true,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_Lists() );
