<?php
/**
 * Class Checkbox_Field
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Fields\Types;

use QuillCRM\Abstracts\Field_Type;
use QuillCRM\Managers\Custom_Fields_Manager;

/**
 * Checkbox_Field class
 */
class Checkbox_Field extends Field_Type {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Checkbox Field';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'checkbox';

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
		return $value === 'true' || $value === true ? 'true' : 'false';
	}

	/**
	 * Validate
	 *
	 * @param mixed $value
	 *
	 * @return boolean
	 */
	public function validate_value( $value ) {
		if ( $value !== 'true' && $value !== 'false' && $value !== true && $value !== false ) {
			$this->is_valid       = false;
			$this->validation_err = 'This field must be true or false';
		}
	}
}

Custom_Fields_Manager::instance()->register( new Checkbox_Field() );
