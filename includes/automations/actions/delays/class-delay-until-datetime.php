<?php

/**
 * Delay Until Datetime Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\Delays;


use QuillCRM\Abstracts\Action_Pro;

/**
 * Delay Until Datetime Action
 */
class Delay_Until_Datetime extends Action_Pro {



	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Delay Until Datetime';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'delay-until-datetime';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will delay the automation until a specified datetime.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Auto enqueue step
	 *
	 * @var bool
	 */
	public $auto_enqueue = false;

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'crm';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'delay';
}

Delay_Until_Datetime::instance();
