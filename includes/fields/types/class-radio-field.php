<?php

/**
 * Class Radio_Field
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Fields\Types;

use QuillCRM\Abstracts\Field_Type;
use QuillCRM_Pro\Managers\Custom_Fields_Manager;

/**
 * Radio_Field class
 */
class Radio_Field extends Field_Type {


	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Radio Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'radio';

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
		return (bool) $value;
	}

	/**
	 * Validate
	 *
	 * @param mixed $value
	 *
	 * @return boolean
	 */
	public function validate_value( $value ) {
		if ( $this->is_required && empty( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = 'This field is required';
			return;
		}

		if ( ! is_bool( $value ) ) {
			$this->is_valid       = false;
			$this->validation_err = 'Value must be a radio';
		}
	}
}

if ( class_exists( Custom_Fields_Manager::class ) ) {
	Custom_Fields_Manager::instance()->register( new Radio_Field() );
}
