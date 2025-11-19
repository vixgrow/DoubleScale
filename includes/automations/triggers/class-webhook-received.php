<?php

/**
 * Webhook Received Trigger
 *
 * This trigger will be fired when a webhook is received.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;


/**
 * Webhook Received
 */
class Webhook_Received extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Webhook Received';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'webhook_received';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a webhook is received.';

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
	public $group = 'webhooks';
}

Triggers_Manager::instance()->register( new Webhook_Received() );
