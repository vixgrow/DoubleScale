<?php
/**
 * Pro automation trigger (free plugin): WPForms — definition only.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Triggers\Forms;

use DoubleScale\Modules\Automations\Services\TriggersManager;

defined( 'ABSPATH' ) || exit;

final class WpformsFormSubmitted extends AbstractFormSubmittedTrigger {

	public $name = 'WPForms';

	public $slug = 'wpforms';

	public $description = 'Runs when a WPForms form is submitted.';

	public $attributes = array();

	public $group = 'wpforms';
}

TriggersManager::instance()->register( new WpformsFormSubmitted() );
