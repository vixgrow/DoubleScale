<?php
/**
 * Contract end date merge tag.
 *
 * @package DoubleScale\Modules\Contracts
 */

namespace DoubleScale\Modules\Contracts\MergeTags;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\MergeTags\AbstractContractSalesMergeTag;

use DoubleScale\Core\MergeTags\MergeTagsManager;

/**
 * ContractEndDate merge tag.
 */
class ContractEndDate extends AbstractContractSalesMergeTag {

	public $name = 'Contract End Date';

	public $slug = 'contract_end_date';

	public $description = 'Contract end / expiry date.';

	/**
	 * @param mixed  $contact   Contact.
	 * @param string $merge_tag Merge tag.
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$contract = $this->resolve_contract( $contact );
		return ( $contract && $contract->end_date ) ? (string) $contract->end_date : '';
	}
}

MergeTagsManager::instance()->register( new ContractEndDate() );
