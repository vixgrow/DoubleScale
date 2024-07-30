<?php
/**
 * Abstract class Field_Type
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

/**
 * Field_Type class
 */
abstract class Field_Type {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Is Valid
	 *
	 * @var bool
	 */
	public $is_valid = true;

	/**
	 * Validation Error message
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $validation_err = null;

	/**
	 * Is value array
	 *
	 * @var boolean
	 */
	protected $is_value_array = false;

	/**
	 * Is Required
	 *
	 * @var boolean
	 */
	public $is_required = false;

	/**
	 * Attributes
	 *
	 * @var array
	 */
	protected $attributes = array();

	/**
	 * Is Value Array
	 *
	 * @return bool
	 */
	public function is_value_array() {
		return $this->is_value_array;
	}

	/**
	 * Constructor
	 *
	 * @param array $args
	 */
	public function __construct( $args = array() ) {
		$this->is_required = isset( $args['is_required'] ) ? $args['is_required'] : false;
		$this->attributes  = isset( $args['attributes'] ) ? $args['attributes'] : array();
	}

	/**
	 * Sanitize Value
	 *
	 * @param mixed $value
	 *
	 * @return mixed
	 */
	abstract public function sanitize_field( $value );

	/**
	 * Validate Value
	 *
	 * @param mixed $value
	 *
	 * @return bool
	 */
	abstract public function validate_value( $value );

	/**
	 * Format Value
	 *
	 * @param mixed $value
	 */
	public function format_value( $value ) {
		return $value;
	}
}
