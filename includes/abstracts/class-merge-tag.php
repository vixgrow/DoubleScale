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
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group;

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	abstract public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' );
}
