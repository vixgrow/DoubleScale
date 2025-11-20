<?php

namespace QuillCRM\Automations\Actions\Deal;


use QuillCRM\Abstracts\Action_Pro;

class Update_Owner_Deal extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update a deal owner';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_owner_deal';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update the owner of a deal.';


	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();


	/**
	 * Action Source
	 *
	 * @var string
	 */
	public $source = 'crm';


	/**
	 * Action Group
	 *
	 * @var string
	 */
	public $group = 'deal';
}

Update_Owner_Deal::instance();
