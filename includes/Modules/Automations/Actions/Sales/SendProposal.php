<?php
/**
 * Pro automation action (free plugin): definition only.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Automations\Actions\Sales;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Automations\Abstracts\ProAutomationStubAction;

/**
 * SendProposal action stub.
 */
class SendProposal extends ProAutomationStubAction {

	public $name = 'Send proposal';

	public $slug = 'send_proposal';

	public $description = 'Email the linked proposal to the customer.';

	public $source = 'sales';

	public $group = 'sales';
}

SendProposal::instance();
