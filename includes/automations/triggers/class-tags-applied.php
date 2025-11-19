<?php

/**
 * Class Tags_Applied
 *
 * This class is responsible for handling the tags applied trigger
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Class Tags Applied Trigger
 */
class Tags_Applied extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Tags Applied';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'tags_applied';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a tag is applied to a contact.';

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
}

Triggers_Manager::instance()->register( new Tags_Applied() );
