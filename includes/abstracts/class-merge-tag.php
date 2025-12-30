<?php

/**
 * Class Merge Tag
 *
 * Abstract class for merge tags
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Contact_Model;

/**
 * Merge Tag class
 */
abstract class Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description;

	/**
	 * Required Triggers
	 *
	 * @var array
	 */
	public $required_triggers = array();

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group;

	/**
	 * Is automation merge tag
	 *
	 * @var bool
	 */
	public $is_automation = true;

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model|Contact_Model|null $contact Contact Model.
	 * @param string                                      $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	abstract public function get_value( $contact, $merge_tag = '');

	/**
	 * Is Automation Contact
	 *
	 * @param Automation_Contact_Model|Contact_Model|null $contact Contact Model.
	 *
	 * @return bool
	 */
	public function is_automation_contact( $contact ) {
		return $contact instanceof Automation_Contact_Model;
	}

	/**
	 * Get tag value
	 *
	 * @param Automation_Contact_Model|Contact_Model|null $contact_or_automation_contact.
	 * @param string                                      $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_tag_value( $contact_or_automation_contact, $merge_tag = '' ) {
		if ( $this->is_automation && ! $this->is_automation_contact( $contact_or_automation_contact ) ) {
			return '';
		}

		if ( ! $this->is_automation && $this->is_automation_contact( $contact_or_automation_contact ) ) {
			return $this->get_value( $contact_or_automation_contact->contact, $merge_tag );
		}

		return $this->get_value( $contact_or_automation_contact, $merge_tag );
	}
}
