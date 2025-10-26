<?php
/**
 * Class Business_Name
 *
 * Merge tag for business name from settings
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\General;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Settings;

/**
 * Business Name Merge Tag
 */
class Business_Name extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Business Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'business_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Business Name from Settings';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'general';

	/**
	 * Is automation merge tag
	 *
	 * @var bool
	 */
	public $is_automation = false;

	/**
	 * Get Merge Tag Value
	 *
	 * @param Contact_Model $contact Contact Model.
	 * @param string        $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		// Get business settings
		$business_settings = Settings::get( 'business', array() );
		
		// Return business name or empty string if not set
		return isset( $business_settings['business_name'] ) ? $business_settings['business_name'] : '';
	}
}

Merge_Tags_Manager::instance()->register( new Business_Name() );

