<?php

/**
 * Class CheckboxField
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro\Pro
 */

namespace DoubleScale\Core\Fields\Types;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\FieldType;
use DoubleScale\Pro\Modules\CustomFields\CustomFieldsManager;

/**
 * CheckboxField class
 */
class CheckboxField extends FieldType {

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

if ( class_exists( CustomFieldsManager::class ) ) {
	CustomFieldsManager::instance()->register( new CheckboxField() );
}
