<?php

/**
 * Class TagsApplied
 *
 * This class is responsible for handling the tags applied trigger
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Triggers;

use DoubleScale\Modules\Automations\Abstracts\Trigger;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Automations\Models\AutomationModel;

/**
 * Class Tags Applied Trigger
 */
class TagsApplied extends Trigger
{

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Tags Applied';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'tags_applied';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a tag is applied to a contact.';

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

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks()
	{
		add_action('doublescale_contact_tags_applied', array($this, 'tags_applied'), 10, 2);
	}

	/**
	 * Tags Applied
	 *
	 * @since 1.0.0
	 *
	 * @param ContactModel $contact
	 * @param array         $tags
	 *
	 * @return void
	 */
	public function tags_applied(ContactModel $contact, $tags)
	{
		$data = array(
			'contact' => $contact,
			'data'    => array(
				'tags' => $tags,
			),
		);

		$this->process($data);
	}

	/**
	 * Is Processable
	 *
	 * @since 1.0.0
	 *
	 * @param AutomationModel $automation
	 * @param array            $args
	 *
	 * @return bool
	 */
	public function is_processable(AutomationModel $automation, $args)
	{
		$tags            = $args['data']['tags'];
		$automation_tags = $automation->get_setting('tags', array());

		if (! array_intersect($tags, $automation_tags)) {
			return false;
		}

		return true;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields()
	{
		return array(
			'tags' => array(
				'label'    => __('Tags', 'doublescale'),
				'type'     => 'tags',
				'multiple' => true,
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema()
	{
		return array(
			'type'       => 'object',
			'properties' => array(
				'tags' => array(
					'type'     => 'array',
					'items'    => array(
						'type' => 'integer',
					),
					'required' => true,
				),
			),
		);
	}
}
