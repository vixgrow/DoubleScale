<?php

/**
 * Send WhatsApp Action
 * Auto-generates templates and creates tracking records
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\Messaging;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Send WhatsApp Action
 */
class Send_WhatsApp extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send WhatsApp';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_whatsapp';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'whatsapp';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'message';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a WhatsApp message to the user with full tracking and analytics.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();
}

Send_WhatsApp::instance();
