<?php
/**
 * Class Link Trigger Clicked
 *
 * This trigger will be fired when a link trigger is clicked.
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
use QuillCRM\Models\Link_Trigger_Model;

/**
 * Link Trigger Clicked
 */
class Link_Trigger_Clicked extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Link Trigger Clicked';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'link_trigger_clicked';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a link trigger is clicked.';

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
	public $group = 'link_triggers';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'quillcrm_link_trigger_clicked', array( $this, 'link_trigger_clicked' ), 10, 2 );
	}

	/**
	 * Link Trigger Clicked
	 *
	 * @param Link_Trigger_Model $link_trigger Link Trigger.
	 * @param Contact_Model      $contact Contact.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function link_trigger_clicked( $link_trigger, $contact ) {
		$data = array(
			'contact' => $contact,
			'data'    => array(
				'link_trigger_id' => $link_trigger->id,
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
		$link_id          = $args['data']['link_trigger_id'];
		$automation_links = $automation->get_setting( 'links', array() );

		if ( ! in_array( $link_id, $automation_links ) ) {
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
				'links' => array(
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

Triggers_Manager::instance()->register( new Link_Trigger_Clicked() );
