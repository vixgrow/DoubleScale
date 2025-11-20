<?php

/**
 * Send Campaign Email
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\Email;

use QuillCRM\Abstracts\Action_Pro;

class Send_Campaign_Email extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send Campaign Email';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_campaign_email';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a campaign email to the contact.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'email';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'email';
}

Send_Campaign_Email::instance();
