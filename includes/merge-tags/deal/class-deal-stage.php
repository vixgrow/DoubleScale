<?php
/**
 * Class Deal Stage
 *
 * Merge tag for deal stage name
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
 * Deal Stage Merge Tag
 */
class Deal_Stage extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Deal Stage';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_stage';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Deal Stage Name';

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
		$stage = $deal->stage;
		if ( ! $stage ) {
			return '';
		}
		return $stage->name ?? '';
	}
}

Merge_Tags_Manager::instance()->register( new Deal_Stage() );
