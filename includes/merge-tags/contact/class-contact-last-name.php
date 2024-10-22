<?php
/**
 * Class Contact_Last_Name
 *
 * Merge tag for contact last name
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Contact;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Contact Last Name Merge Tag
 */
class Contact_Last_Name extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Contact Last Name';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'last_name';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Contact Last Name';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'contact';

	/**
	 * Is automation merge tag
	 *
	 * @var bool
	 */
	public $is_automation = false;

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

		return $contact->last_name;
	}
}

Merge_Tags_Manager::instance()->register( new Contact_Last_Name() );
