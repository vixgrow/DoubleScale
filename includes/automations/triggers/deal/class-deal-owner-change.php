<?php

namespace QuillCRM\Automations\Triggers\Deal;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Deal Owner Change Trigger
 */
class Deal_Owner_Change extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Deal Owner changes';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_owner_change';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a deal owner is changed.';

	/**
	 * Trigger Source
	 *
	 * @var string
	 */
	public $source = 'crm';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'deal';
}

Triggers_Manager::instance()->register( new Deal_Owner_Change() );
