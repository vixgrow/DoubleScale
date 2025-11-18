<?php

namespace QuillCRM\Automations\Triggers\Deal;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

class Deal_Status_Change extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Deal Status changes';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_status_change';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a deal status is changed.';

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

Triggers_Manager::instance()->register( new Deal_Status_Change() );
