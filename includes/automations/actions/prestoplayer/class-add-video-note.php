<?php

/**
 * Class Add Video Note (Pro Placeholder)
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\PrestoPlayer;

use QuillCRM\Abstracts\Action_Pro;

/**
 * Add Video Note
 */
class Add_Video_Note extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Video Note';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'prestoplayer_add_video_note';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'Creates a note recording video watch activity.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'video';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'prestoplayer';
}

Add_Video_Note::instance();
