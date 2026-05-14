<?php

/**
 * Class RadioField
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro\Pro
 */

namespace DoubleScale\Fields\Types;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\FieldType;
use DoubleScale\Pro\Modules\CustomFields\CustomFieldsManager;

/**
 * RadioField class
 */
class RadioField extends FieldType {


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

if ( class_exists( CustomFieldsManager::class ) ) {
	CustomFieldsManager::instance()->register( new RadioField() );
}
