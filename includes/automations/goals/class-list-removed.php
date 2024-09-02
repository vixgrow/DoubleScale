<?php
/**
 * Class List Removed Goal
 *
 * This class is responsible for handling the list removed goal
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Goals;

use QuillCRM\Abstracts\Goal;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Managers\Goals_Manager;

/**
 * List Removed Goal class
 */
class List_Removed extends Goal {

	/**
	 * Goal Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'List Removed';

	/**
	 * Goal Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'list_removed';

	/**
	 * Goal Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'This goal is achieved when a contact is removed to a specific list.';

	/**
	 * Source
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $source = 'automation';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'contact';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'quillcrm_contact_lists_removed', array( $this, 'lists_removed' ), 10, 2 );
	}

	/**
	 * Lists Removed
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact
	 * @param array         $lists
	 * @return void
	 */
	public function lists_removed( Contact_Model $contact, $lists ) {
		$data = array(
			'lists' => $lists,
		);

		$this->process( $contact, $data );
	}

	/**
	 * Check if the goal is completed
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Step_Model $step Automation Step Model.
	 * @param array                 $data Data.
	 *
	 * @return bool
	 */
	public function is_completed( Automation_Step_Model $step, $data ) {
		$lists      = $data['lists'] ?? array();
		$goal_lists = $step->get_setting( 'lists', array() );

		return ! empty( array_intersect( $lists, $goal_lists ) );
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

Goals_Manager::instance()->register( new List_Removed() );
