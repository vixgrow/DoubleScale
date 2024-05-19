<?php
/**
 * Class Contact Zip
 *
 * Merge tag for contact zip
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Contact;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Contact Zip Merge Tag
 */
class Contact_Zip extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Contact Zip';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'zip';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Contact Zip';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'contact';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		return $automation_contact->contact->zip;
	}
}

Merge_Tags_Manager::instance()->register( new Contact_Zip() );
