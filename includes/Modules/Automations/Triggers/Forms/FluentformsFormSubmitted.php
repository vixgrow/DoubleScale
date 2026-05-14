<?php
/**
 * Pro automation trigger (free plugin): Fluent Forms — definition only.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Triggers\Forms;

use DoubleScale\Modules\Automations\Services\TriggersManager;

defined( 'ABSPATH' ) || exit;

final class FluentformsFormSubmitted extends AbstractFormSubmittedTrigger {

	public $name = 'Fluent Forms';

	public $slug = 'fluentforms';

	public $description = 'Runs when a Fluent Forms form is submitted.';

	public $attributes = array();

	public $group = 'fluentforms';
}

TriggersManager::instance()->register( new FluentformsFormSubmitted() );
