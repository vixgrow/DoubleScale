<?php

/**
 * Presto Player Trigger for Video Completed (Pro Placeholder)
 * This trigger will be fired when a user completes a video.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\PrestoPlayer;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Video Completed Trigger
 */
class Video_Completed extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Video Completed';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'prestoplayer_video_completed';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user completes a Presto Player video.';

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
	public $source = 'video';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'prestoplayer';
}

Triggers_Manager::instance()->register( new Video_Completed() );
