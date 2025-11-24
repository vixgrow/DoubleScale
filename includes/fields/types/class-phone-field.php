<?php

/**
 * Class Phone_Field
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Fields\Types;

use QuillCRM\Abstracts\Field_Type;
use QuillCRM_Pro\Managers\Custom_Fields_Manager;

/**
 * Phone_Field class
 */
class Phone_Field extends Field_Type {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Phone Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'phone';

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

		if ( ! empty( $value ) && ! preg_match( '/^[0-9\-\(\)\/\+\s]*$/', $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = 'Please enter a valid phone number';
		}
	}
}

if ( class_exists( Custom_Fields_Manager::class ) ) {
	Custom_Fields_Manager::instance()->register( new Phone_Field() );
}
