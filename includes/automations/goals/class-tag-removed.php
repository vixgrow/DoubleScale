<?php
/**
 * Class Tag Removed Goal
 *
 * This class is responsible for handling the tag removed goal
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
 * Tag Removed Goal class
 */
class Tag_Removed extends Goal {

	/**
	 * Goal Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Tag Removed';

	/**
	 * Goal Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'tag_removed';

	/**
	 * Goal Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'This goal is achieved when a contact is removed to a specific tag.';

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
		add_action( 'quillcrm_contact_tags_removed', array( $this, 'tags_removed' ), 10, 2 );
	}

	/**
	 * Tags Removed
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact
	 * @param array         $tags
	 *
	 * @return void
	 */
	public function tags_removed( Contact_Model $contact, $tags ) {
		$data = array(
			'tags' => $tags,
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
		$tags      = $data['tags'] ?? array();
		$goal_tags = $step->get_setting( 'tags', array() );

		return ! empty( array_intersect( $tags, $goal_tags ) );
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
			'tags' => array(
				'label'    => __( 'Tags', 'quillcrm' ),
				'type'     => 'tags',
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
				'tags' => array(
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

Goals_Manager::instance()->register( new Tag_Removed() );
