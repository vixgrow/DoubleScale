<?php
/**
 * Contact Custom Field
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Contact;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Models\Custom_Field_Model;

/**
 * Contact Custom Field
 */
class Contact_Custom_Field extends Merge_Tag {

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
	public $group = 'contact';

	/**
	 * Is automation merge tag
	 *
	 * @var bool
	 */
	public $is_automation = false;

	/**
	 * Constructor
	 *
	 * @param Custom_Field_Model $custom_field Custom Field Model.
	 */
	public function __construct( Custom_Field_Model $custom_field ) {
		$this->name        = $custom_field->name;
		$this->slug        = "contact_field:{$custom_field->slug}";
		$this->description = $custom_field->name;
	}

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

		$key             = str_replace( 'contact_field:', '', $merge_tag );
		$custom_field_id = Custom_Field_Model::get_id( $key );
		$custom_field    = $contact->get_custom_field( $custom_field_id );

		if ( $custom_field ) {
			return $custom_field;
		}

		return '';
	}
}

// Register custom fields as merge tags.
$custom_fields = Custom_Field_Model::all();

foreach ( $custom_fields as $custom_field ) {
	Merge_Tags_Manager::instance()->register( new Contact_Custom_Field( $custom_field ) );
}
