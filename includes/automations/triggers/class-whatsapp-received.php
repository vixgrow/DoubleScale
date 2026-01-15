<?php

/**
 * WhatsApp Received Trigger (Pro Placeholder)
 * Triggers when a WhatsApp message is received from a contact
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * WhatsApp_Received class
 */
class WhatsApp_Received extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'WhatsApp Received';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'whatsapp_received';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'Triggers when a WhatsApp message is received from a contact';

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
	public $group = 'messaging';
}

Triggers_Manager::instance()->register( new WhatsApp_Received() );
