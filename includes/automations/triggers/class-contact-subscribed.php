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

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Contact Subscribes Trigger
 */
class Contact_Subscribed extends Trigger_Pro {

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
}

Triggers_Manager::instance()->register( new Contact_Subscribed() );
