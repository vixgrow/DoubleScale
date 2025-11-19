<?php

/**
 * Class Lists_Removed
 *
 * This trigger will be fired when a list is removed from a contact.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Class Lists Removed Trigger
 */
class Lists_Removed extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Lists Removed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'lists_removed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a list is removed from a contact.';

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

Triggers_Manager::instance()->register( new Lists_Removed() );
