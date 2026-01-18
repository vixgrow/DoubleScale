<?php

/**
 * Presto Player Trigger for Video Watched (Pro Placeholder)
 * This trigger will be fired when a user watches a video.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\PrestoPlayer;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Video Watched Trigger
 */
class Video_Watched extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Video Watched';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'prestoplayer_video_watched';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user watches a Presto Player video.';

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

Triggers_Manager::instance()->register( new Video_Watched() );
