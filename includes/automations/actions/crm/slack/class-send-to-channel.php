<?php

/**
 * Class Send_To_Channel
 *
 * This class is responsible for sending a message to a channel in Slack
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Slack;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Send To Channel class
 */
class Send_To_Channel extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send To Channel';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'slack_send_to_channel';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'send_data';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'slack';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a message to a channel in Slack.';
}

Send_To_Channel::instance();
