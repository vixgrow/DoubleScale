<?php
/**
 * Class Tags_Removed
 *
 * This class is responsible for handling the tags removed trigger
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Model;

/**
 * Class Tags Removed Trigger
 */
class Tags_Removed extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Tags Removed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'tags_removed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a tag is removed to a contact.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

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
			'contact' => $contact,
			'data'    => array(
				'tags' => $tags,
			),
		);

		error_log( 'Tags Removed: ' . wp_json_encode( $data ) );
		$this->process( $data );
	}

	/**
	 * Is Processable
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation
	 * @param array            $args
	 *
	 * @return bool
	 */
	public function is_processable( Automation_Model $automation, $args ) {
		$tags            = $args['data']['tags'];
		$automation_tags = $automation->get_setting( 'tags', array() );

		if ( ! array_intersect( $tags, $automation_tags ) ) {
			return false;
		}

		return true;
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

Triggers_Manager::instance()->register( new Tags_Removed() );
