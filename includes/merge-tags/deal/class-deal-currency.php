<?php
/**
 * Class Deal Currency
 *
 * Merge tag for deal currency
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Deal;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM_Pro\Models\Deal_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Deal Currency Merge Tag
 */
class Deal_Currency extends Merge_Tag {

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
	 * @param Automation_Contact_Model $contact Contact Model.
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
		$deal = Deal_Model::find( $deal_id );
		if ( ! $deal ) {
			return '';
		}
		return $deal->currency ?? '';
	}
}

Merge_Tags_Manager::instance()->register( new Deal_Currency() );
