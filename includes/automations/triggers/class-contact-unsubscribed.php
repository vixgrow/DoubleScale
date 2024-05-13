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
class Contact_Unsubscribed extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Contact Unsubscribed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'contact_unsubscribed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a contact unsubscribed.';

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
		add_action( 'quillcrm_contact_unsubscribed', array( $this, 'contact_unsubscribed' ) );
	}

	/**
	 * Contact Unsubscribed
	 *
	 * @since 1.0.0
	 *
	 * @param Contact_Model $contact_id Contact.
	 *
	 * @return void
	 */
	public function contact_unsubscribed( $contact ) {
		$data = array(
			'contact' => $contact,
		);

		error_log( 'Contact Unsubscribed: ' . wp_json_encode( $data ) );
		$this->process( $data );
	}
}

Triggers_Manager::instance()->register( new Contact_Unsubscribed() );
