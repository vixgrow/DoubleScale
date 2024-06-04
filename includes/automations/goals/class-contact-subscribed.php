<?php
/**
 * Class Contact Subscribed Goal
 *
 * This class is responsible for handling the contact subscribed goal
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Goals;

use QuillCRM\Abstracts\Goal;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Managers\Goals_Manager;

/**
 * Contact Subscribed Goal class
 */
class Contact_Subscribed extends Goal {

	/**
	 * Goal Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Contact Subscribed';

	/**
	 * Goal Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'contact_subscribed';

	/**
	 * Goal Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'This goal is achieved when a contact is subscribed to a specific list.';

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
		$this->process( $contact, array() );
	}
}

Goals_Manager::instance()->register( new Contact_Subscribed() );
