<?php
/**
 * Contact Address 2 Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Contact;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Contact Address 2 Merge Tag
 */
class Contact_Address_2 extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Contact Address 2';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'address_2';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Contact Address 2';

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
	 * @param Contact_Model $contact Contact Model.
	 * @param string        $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		if ( is_null( $contact ) ) {
			return '';
		}

		return $contact->address_2;
	}
}

Merge_Tags_Manager::instance()->register( new Contact_Address_2() );
