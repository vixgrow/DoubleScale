<?php

/**
 * SMS Received Trigger
 * Triggers when an SMS message is received from a contact
 *
 * @since 1.0.0
 * @package QuillCRM_Pro
 */

namespace QuillCRM_Pro\Automations\Triggers;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * SMS_Received class
 */
class SMS_Received extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'SMS Received';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'sms_received';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'Triggers when an SMS is received from a contact';

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
Triggers_Manager::instance()->register( new SMS_Received() );
