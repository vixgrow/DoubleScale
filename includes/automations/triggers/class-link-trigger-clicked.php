<?php

/**
 * Class Link Trigger Clicked
 *
 * This trigger will be fired when a link trigger is clicked.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;


/**
 * Link Trigger Clicked
 */
class Link_Trigger_Clicked extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Link Trigger Clicked';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'link_trigger_clicked';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a link trigger is clicked.';

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
	public $group = 'link_triggers';
}

Triggers_Manager::instance()->register( new Link_Trigger_Clicked() );
