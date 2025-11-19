<?php

/**
 * Contact Unsubscribed Trigger
 * This trigger will be fired when a contact unsubscribed.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Contact Unsubscribed Trigger
 */
class Contact_Unsubscribed extends Trigger_Pro {

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
}

Triggers_Manager::instance()->register( new Contact_Unsubscribed() );
