<?php
/**
 * Remove Lists Action
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
use QuillCRM\Models\List_Model;

/**
 * Remove Lists Action
 */
class Remove_Lists extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove from Lists';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'remove_lists';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove the contact from a list.';

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
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$lists_ids = $step->get_setting( 'lists' );
		$lists     = List_Model::find( $lists_ids );

		if ( ! empty( $lists ) ) {
			$lists_ids = wp_list_pluck( $lists->toArray(), 'id' );
			$contact   = $automation_contact->contact;
			$contact->lists()->detach( $lists_ids );
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
			'lists' => array(
				'label'    => __( 'Lists', 'quillcrm' ),
				'type'     => 'lists',
				'multiple' => true,
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

Remove_Lists::instance();
