<?php

/**
 * Class Textarea_Field
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Fields\Types;

use QuillCRM\Abstracts\Field_Type;
use QuillCRM\Managers\Custom_Fields_Manager;

/**
 * Textarea_Field class
 */
class Textarea_Field extends Field_Type {



	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Textarea Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'textarea';

	/**
	 * Is Value Array
	 *
	 * @var boolean
	 */
	protected $is_value_array = false;

	/**
	 * Sanitize
	 *
	 * @param mixed $value
	 *
	 * @return mixed
	 */
	public function sanitize_field( $value ) {
		return sanitize_textarea_field( $value );
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

		if ( ! is_string( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = 'This field must be a string';
		}
	}
}

Custom_Fields_Manager::instance()->register( new Textarea_Field() );
