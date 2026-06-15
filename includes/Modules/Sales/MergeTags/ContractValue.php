<?php
/**
 * Contract value merge tag.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\MergeTags;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\MergeTags\MergeTagsManager;

/**
 * ContractValue merge tag.
 */
class ContractValue extends AbstractContractSalesMergeTag {

	public $name = 'Contract Value';

	public $slug = 'contract_value';

	public $description = 'Formatted contract value with currency.';

	/**
	 * @param mixed  $contact   Contact.
	 * @param string $merge_tag Merge tag.
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$contract = $this->resolve_contract( $contact );
		if ( ! $contract ) {
			return '';
		}
		return $this->format_contract_money( $contract );
	}
}

MergeTagsManager::instance()->register( new ContractValue() );
