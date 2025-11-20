<?php

/**
 * HTTP Request Webhook Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\Webhooks;

use QuillCRM\Abstracts\Action_Pro;

/**
 * HTTP Request Webhook Action
 */
class Http_Request_Webhook extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'HTTP Request';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'http_request_webhook';

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
	public $group = 'http_request';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send data to a HTTP Request webhook URL with custom key-value pairs and merge tag support.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();
}
Http_Request_Webhook::instance();
