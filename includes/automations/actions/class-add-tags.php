<?php
/**
 * Add Tags Action
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
use QuillCRM\Models\Tag_Model;

/**
 * Add Tag Action
 */
class Add_Tags extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Tags';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'add_tags';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a tags to the contact.';

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
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Contact_Model $contact ) {
		$tags_ids = $step->get_setting( 'tags' );
		$tags     = Tag_Model::find( $tags_ids );

		if ( ! empty( $tags ) ) {
			$tags_ids = wp_list_pluck( $tags->toArray(), 'id' );
			$contact->tags()->syncWithoutDetaching( $tags_ids );
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
				'tags' => array(
					'type'     => 'array',
					'items'    => array(
						'type' => 'integer',
					),
					'default'  => array(),
					'required' => true,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_Tags() );
