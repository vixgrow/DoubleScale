<?php
/**
 * Class Business_Address
 *
 * Merge tag for business address from settings
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
 * Business Address Merge Tag
 */
class Business_Address extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Business Address';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'business_address';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 *
	 */
	public $description = 'Business Address from Settings';

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
		
		// Return business address or empty string if not set
		return isset( $business_settings['business_address'] ) ? $business_settings['business_address'] : '';
	}
}

Merge_Tags_Manager::instance()->register( new Business_Address() );

