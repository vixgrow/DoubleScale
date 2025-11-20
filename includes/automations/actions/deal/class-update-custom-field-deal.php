<?php

namespace QuillCRM\Automations\Actions\Deal;


use QuillCRM\Abstracts\Action_Pro;

class Update_Custom_Field_Deal extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Update a deal custom field';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'update_custom_field_deal';


	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will update a deal custom field.';



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

Update_Custom_Field_Deal::instance();
