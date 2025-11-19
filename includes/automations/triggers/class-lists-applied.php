<?php

/**
 * Lists Applied Trigger
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;


/**
 * Class Lists Applied Trigger
 */
class Lists_Applied extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Lists Applied';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'lists_applied';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a list is applied to a contact.';

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

Triggers_Manager::instance()->register( new Lists_Applied() );
