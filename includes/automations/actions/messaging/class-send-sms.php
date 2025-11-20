<?php

/**
 * Send SMS Action
 * Auto-generates templates and creates tracking records
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\Messaging;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Send SMS Action
 */
class Send_SMS extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send SMS';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_sms';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'sms';

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
	public $description = 'This action will send an SMS to the user with full tracking and analytics.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();
}

Send_SMS::instance();
