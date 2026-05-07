<?php
/**
 * Class Deal Currency
 *
 * Merge tag for deal currency
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Deals\MergeTags\Deal;

use DoubleScale\Modules\Automations\Abstracts\MergeTag;
use DoubleScale\Modules\Automations\Models\AutomationContactModel;
use DoubleScale\Modules\Deals\Models\DealModel;
use DoubleScale\Managers\MergeTagsManager;

/**
 * Deal Currency Merge Tag
 */
class DealCurrency extends MergeTag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Deal Currency';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_currency';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Deal Currency';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'deal';

	/**
	 * Is automation merge tag
	 *
	 * @var bool
	 */
	public $is_automation = true;

	/**
	 * Get Merge Tag Value
	 *
	 * @param AutomationContactModel $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		if ( is_null( $contact ) ) {
			return '';
		}
		$deal_id = $contact->data['deal_id'] ?? null;
		if ( ! $deal_id ) {
			return '';
		}
		$deal = DealModel::find( $deal_id );
		if ( ! $deal ) {
			return '';
		}
		return $deal->currency ?? '';
	}
}

MergeTagsManager::instance()->register( new DealCurrency() );
