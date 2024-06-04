<?php
/**
 * Lists Applied Trigger
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
 * Class Lists Applied Trigger
 */
class Lists_Applied extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Lists Applied';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'lists_applied';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a list is applied to a contact.';

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
		add_action( 'quillcrm_contact_lists_applied', array( $this, 'lists_applied' ), 10, 2 );
	}

	/**
	 * Lists Applied
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact_id Contact.
	 * @param array         $lists List ID.
	 *
	 * @return void
	 */
	public function lists_applied( $contact, $lists ) {
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

Triggers_Manager::instance()->register( new Lists_Applied() );
