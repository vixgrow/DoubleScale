<?php
/**
 * Pro automation action (free plugin): definition only. Implementation ships in DoubleScale Pro.
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Actions\Deal;

use DoubleScale\Modules\Automations\Abstracts\ProAutomationStubAction;

/**
 * UpdateOwnerDeal action stub.
 */
class UpdateOwnerDeal extends ProAutomationStubAction {

	public $name = 'Update a deal owner';

	public $slug = 'update_owner_deal';

	public $description = 'This action will update the owner of a deal.';

	public $source = 'crm';

	public $group = 'deal';
}

UpdateOwnerDeal::instance();
