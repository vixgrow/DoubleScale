<?php

/**
 * Zapier Webhook Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\Webhooks;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Zapier Webhook Action
 */
class Zapier_Webhook extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send Data to Zapier';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'zapier_webhook';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'send_data';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'zapier';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send data to a Zapier webhook URL with custom key-value pairs and merge tag support.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();
}
Zapier_Webhook::instance();
