<?php

/**
 * LearnDash Trigger for Topic Completed
 * This trigger will be fired when a user completes a topic.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\LearnDash;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Topic Completed Trigger
 */
class Topic_Completed extends Trigger_Pro {


	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Topic Completed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_topic_completed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user completes a topic.';

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
	public $source = 'lms';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'learndash';
}

Triggers_Manager::instance()->register( new Topic_Completed() );
