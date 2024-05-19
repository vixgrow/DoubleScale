<?php
/**
 * Contact City Merge Tag
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
 * Contact City Merge Tag
 */
class Contact_City extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Contact City';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'city';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Contact City';

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
		return $automation_contact->contact->city;
	}
}

Merge_Tags_Manager::instance()->register( new Contact_City() );
