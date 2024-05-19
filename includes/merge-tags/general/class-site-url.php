<?php
/**
 * Class Site_URL
 *
 * Merge tag for site url
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\General;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Site URL Merge Tag
 */
class Site_URL extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Site URL';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'site_url';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Site URL';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'general';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		return get_site_url();
	}
}

Merge_Tags_Manager::instance()->register( new Site_URL() );
