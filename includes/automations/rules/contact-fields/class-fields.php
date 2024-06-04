<?php
/**
 * Class Fields
 *
 * This class is responsible for handling the contact fields rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\Contact_Fields;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Custom_Field_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Fields class
 */
class Fields extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name;

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug;

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'contact_fields';

	/**
	 * Custom Field
	 *
	 * @var Custom_Field_Model
	 *
	 * @since 1.0.0
	 */
	public $custom_field;

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'text';

	/**
	 * Constructor
	 */
	public function __construct( $custom_field ) {
		$this->custom_field = $custom_field;
		$this->name         = $custom_field->name;
		$this->slug         = 'contact_field_' . $custom_field->id;
	}

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return mixed
	 */
	public function get_value( $automation_contact ) {
		$contact = $automation_contact->contact;
		$value   = $contact->get_custom_field( $this->custom_field->id );

		return $value;
	}
}

$custom_fields = Custom_Field_Model::all();

if ( ! empty( $custom_fields ) ) {
	foreach ( $custom_fields as $custom_field ) {
		$rule = new Fields( $custom_field );
		Rules_Manager::instance()->register( $rule );
	}
}
