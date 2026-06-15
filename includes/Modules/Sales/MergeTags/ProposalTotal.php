<?php
/**
 * Proposal total merge tag.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\MergeTags;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\MergeTags\MergeTagsManager;

/**
 * ProposalTotal merge tag.
 */
class ProposalTotal extends AbstractProposalSalesMergeTag {

	public $name = 'Proposal Total';

	public $slug = 'proposal_total';

	public $description = 'Formatted proposal total with currency.';

	/**
	 * @param mixed  $contact   Contact.
	 * @param string $merge_tag Merge tag.
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$proposal = $this->resolve_proposal( $contact );
		if ( ! $proposal ) {
			return '';
		}
		return $this->format_money( $proposal );
	}
}

MergeTagsManager::instance()->register( new ProposalTotal() );
