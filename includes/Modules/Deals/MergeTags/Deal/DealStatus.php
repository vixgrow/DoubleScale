<?php
/**
 * Class Deal Status
 *
 * Merge tag for deal status
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
 * Deal Status Merge Tag
 */
class DealStatus extends MergeTag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Deal Status';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_status';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Deal Status';

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
		return $deal->status ?? '';
	}
}

MergeTagsManager::instance()->register( new DealStatus() );
