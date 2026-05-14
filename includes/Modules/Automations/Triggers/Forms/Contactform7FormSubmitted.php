<?php
/**
 * Pro automation trigger (free plugin): Contact Form 7 — definition only.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Triggers\Forms;

use DoubleScale\Modules\Automations\Services\TriggersManager;

defined( 'ABSPATH' ) || exit;

final class Contactform7FormSubmitted extends AbstractFormSubmittedTrigger {

	public $name = 'Contact Form 7';

	public $slug = 'contactform7';

	public $description = 'Runs when a Contact Form 7 form is submitted.';

	public $attributes = array();

	public $group = 'contactform7';
}

TriggersManager::instance()->register( new Contactform7FormSubmitted() );
