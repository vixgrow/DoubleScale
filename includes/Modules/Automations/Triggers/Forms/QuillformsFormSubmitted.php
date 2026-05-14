<?php
/**
 * Pro automation trigger (free plugin): Quill Forms — definition only.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Triggers\Forms;

use DoubleScale\Modules\Automations\Services\TriggersManager;

defined( 'ABSPATH' ) || exit;

final class QuillformsFormSubmitted extends AbstractFormSubmittedTrigger {

	public $name = 'Quill Forms';

	public $slug = 'quillforms';

	public $description = 'Runs when a Quill Forms form is submitted.';

	public $attributes = array();

	public $group = 'quillforms';
}

TriggersManager::instance()->register( new QuillformsFormSubmitted() );
