<?php

/**
 * WPForms Forms Form Utils
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\WPForms;

/**
 * Form_Utils class.
 */
class Form_Utils {


	/**
	 * Prepare name field.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $field Name field.
	 * @param string $field_id Field ID.
	 *
	 * @return array
	 */
	public static function prepare_name_field( $field, $field_id ) {
		$label  = $field['label'] ?? $field['name'];
		$fields = array();

		$fields[ $field_id . '_first' ] = $label . ': First';
		$fields[ $field_id . '_last' ]  = $label . ': Last';

		// Check if format is full name
		$format = $field['format'] ?? 'first-last';
		if ( 'first-middle-last' === $format || ! empty( $field['middle'] ?? '' ) ) {
			$fields[ $field_id . '_middle' ] = $label . ': Middle';
		}

		return $fields;
	}

	/**
	 * Prepare address field.
	 *
	 * @since 1.0.0
	 *
	 * @param array  $field Address field.
	 * @param string $field_id Field ID.
	 *
	 * @return array
	 */
	public static function prepare_address_field( $field, $field_id ) {
		$label  = $field['label'] ?? $field['name'];
		$fields = array();

		$fields[ $field_id . '_address1' ] = $label . ': Address 1';
		$fields[ $field_id . '_address2' ] = $label . ': Address 2';
		$fields[ $field_id . '_city' ]     = $label . ': City';
		$fields[ $field_id . '_state' ]    = $label . ': State';
		$fields[ $field_id . '_zip' ]      = $label . ': Zip';
		$fields[ $field_id . '_country' ]  = $label . ': Country';

		return $fields;
	}

	/**
	 * Get field id.
	 *
	 * @since 1.0.0
	 *
	 * @param array $field_index Field index.
	 *
	 * @return string
	 */
	public static function get_field_id( $field_index ) {
		return 'wpforms_' . $field_index;
	}
}
