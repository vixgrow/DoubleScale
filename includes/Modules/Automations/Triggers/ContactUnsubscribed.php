<?php

/**
 * Contact Unsubscribed Trigger
 * This trigger will be fired when a contact subscribes to a list.
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Triggers;

use DoubleScale\Modules\Automations\Abstracts\Trigger;
use DoubleScale\Modules\Contacts\Models\ContactModel;

/**
 * Contact Unsubscribed Trigger
 */
class ContactUnsubscribed extends Trigger
{

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

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks()
	{
		add_action('doublescale_contact_unsubscribed', array($this, 'contact_unsubscribed'));
	}

	/**
	 * Contact Unsubscribed
	 *
	 * @since 1.0.0
	 *
	 * @param ContactModel $contact_id Contact.
	 *
	 * @return void
	 */
	public function contact_unsubscribed($contact)
	{
		$data = array(
			'contact' => $contact,
		);

		$this->process($data);
	}
}
