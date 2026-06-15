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
 * CreateInvoiceFromProposal action stub.
 */
class CreateInvoiceFromProposal extends ProAutomationStubAction {

	public $name = 'Create invoice from proposal';

	public $slug = 'create_invoice_from_proposal';

	public $description = 'Convert the linked proposal into a draft invoice.';

	public $source = 'sales';

	public $group = 'sales';
}

CreateInvoiceFromProposal::instance();
