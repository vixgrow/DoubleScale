<?php
/**
 * Class Lists_Removed
 *
 * This trigger will be fired when a list is removed from a contact.
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
 * Class Lists Removed Trigger
 */
class Lists_Removed extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Lists Removed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'lists_removed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a list is removed from a contact.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'crm';

	/**
	 * Group
	 *
	 * @var string
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
			'contact' => $contact,
			'data'    => array(
				'lists' => $lists,
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
		$lists            = $args['data']['lists'];
		$automation_lists = $automation->get_setting( 'lists', array() );

		// Check if any of the lists match
		if ( ! array_intersect( $lists, $automation_lists ) ) {
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
			'lists' => array(
				'label'    => __( 'Lists', 'quillcrm' ),
				'type'     => 'lists',
				'multiple' => true,
			),
		);
	}

	/**
	 * Get Attributes Schema
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

Triggers_Manager::instance()->register( new Lists_Removed() );
