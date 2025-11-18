<?php

namespace QuillCRM\Automations\Triggers\Deal;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Deal Stage Change Trigger
 */
class Deal_Stage_Change extends Trigger_Pro {



	/**
	 * Default Value Pipeline
	 *
	 * @var string
	 */
	public $Default_Value_Pipeline = 'any-pipeline';

	/**
	 * Default Value Stage
	 *
	 * @var string
	 */
	public $Default_Value_Stage = 'any-stage';

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Deal Stage changes';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_stage_change';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a deal stage is changed.';

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

Triggers_Manager::instance()->register( new Deal_Stage_Change() );
