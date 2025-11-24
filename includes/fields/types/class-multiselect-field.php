<?php

/**
 * Class Multiselect_Field
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Fields\Types;

use QuillCRM\Abstracts\Field_Type;
use QuillCRM_Pro\Managers\Custom_Fields_Manager;

/**
 * Multiselect_Field class
 */
class Multiselect_Field extends Field_Type {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Multiselect Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'multiselect';

	/**
	 * Is Value Array
	 *
	 * @var boolean
	 */
	protected $is_value_array = true;

	/**
	 * Sanitize
	 *
	 * @param mixed $value
	 *
	 * @return mixed
	 */
	public function sanitize_field( $value ) {
		if ( is_array( $value ) ) {
			return array_map( 'sanitize_text_field', $value );
		}
		return sanitize_text_field( $value );
	}

	/**
	 * Validate
	 *
	 * @param mixed $value
	 *
	 * @return boolean
	 */
	public function validate_value( $value ) {
		if ( empty( $value ) && $this->is_required ) {
			$this->is_valid       = false;
			$this->validation_err = 'This field is required';
			return;
		}

		// For multiselect fields, validation of options should be done against the field's attributes
		// This is handled in the Custom_Field_Model validation
	}
}

if ( class_exists( Custom_Fields_Manager::class ) ) {
	Custom_Fields_Manager::instance()->register( new Multiselect_Field() );
}
