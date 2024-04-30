<?php
/**
 * Remove Tags Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use phpDocumentor\Reflection\DocBlock\Tag;
use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tag_Model;

/**
 * Remove Tags Action
 */
class Remove_Tags extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove Tags';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'remove_tags';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove tags from the contact.';

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
		$tags_ids = $step->get_setting( 'tags', array() );
		$tags     = Tag_Model::find( $tags_ids );

		if ( ! empty( $tags ) ) {
			$tags_ids = wp_list_pluck( $tags->toArray(), 'id' );

			$contact->tags()->detach( $tags_ids );
		}

		return true;
	}
}

Actions_Manager::instance()->register( new Remove_Tags() );
