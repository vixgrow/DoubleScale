<?php

namespace QuillCRM\Automations\Actions\Deal;


use QuillCRM\Abstracts\Action_Pro;


class Add_New_Deal extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add a deal';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'add_new_deal';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a new deal.';

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
	public $group = 'deal';
}

Add_New_Deal::instance();
