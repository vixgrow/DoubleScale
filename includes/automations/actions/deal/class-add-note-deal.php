<?php

namespace QuillCRM\Automations\Actions\Deal;

use QuillCRM\Abstracts\Action_Pro;

class Add_Note_Deal extends Action_Pro {


	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add a deal note';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'add_note_deal';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a note to a deal.';

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

Add_Note_Deal::instance();
