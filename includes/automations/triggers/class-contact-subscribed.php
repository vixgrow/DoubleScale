<?php
/**
 * Contact Subscribes Trigger
 * This trigger will be fired when a contact subscribes to a list.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Contact_Model;

/**
 * Contact Subscribes Trigger
 */
class Contact_Subscribed extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Contact Subscribes';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'contact_subscribed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a contact subscribed.';

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
		add_action( 'quillcrm_contact_subscribed', array( $this, 'contact_subscribed' ) );
	}

	/**
	 * Contact Subscribed
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact_id Contact.
	 *
	 * @return void
	 */
	public function contact_subscribed( $contact ) {
		$data = array(
			'contact' => $contact,
		);

		error_log( 'Contact Subscribed: ' . wp_json_encode( $data ) );
		$this->process( $data );
	}
}

Triggers_Manager::instance()->register( new Contact_Subscribed() );
