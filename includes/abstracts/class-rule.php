<?php
/**
 * Class Rule
 *
 * This class is responsible for handling the conditions rules
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Models\Automation_Contact_Model;

/**
 * Rule class
 */
abstract class Rule {

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
	public $group;

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type;

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'               => __( 'Is', 'quillcrm' ),
			'is_not'           => __( 'Is not', 'quillcrm' ),
			'contains'         => __( 'Contains', 'quillcrm' ),
			'does_not_contain' => __( 'Does not contain', 'quillcrm' ),
			'starts_with'      => __( 'Starts with', 'quillcrm' ),
			'ends_with'        => __( 'Ends with', 'quillcrm' ),
			'is_empty'         => __( 'Is empty', 'quillcrm' ),
			'is_not_empty'     => __( 'Is not empty', 'quillcrm' ),
		);
	}

	/**
	 * Has options
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function has_options() {
		return false;
	}

	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		return array();
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
	abstract public function get_value( $automation_contact );

	/**
	 * Is met
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param array                    $rule Rule.
	 *
	 * @return bool
	 */
	public function is_met( Automation_Contact_Model $automation_contact, $rule = array() ) {
		$value      = $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = $rule['value'];
		error_log( 'operator: ' . $operator );
		switch ( $operator ) {
			case 'is':
				if ( is_array( $value ) ) {
					return array_diff( $value, $rule_value );
				}

				return ( $value == $rule_value ); // phpcs:ignore

			case 'is_not':
				if ( is_array( $value ) ) {
					return ! in_array( $rule_value, $value ); // phpcs:ignore
				}
				return ( $value != $rule_value ); // phpcs:ignore

			case 'greater_than':
				if ( ! is_numeric( $rule_value ) || ! is_numeric( $value ) ) {
					return false;
				}
				return (float) $value > (float) $rule_value;

			case 'lower_than':
				if ( ! is_numeric( $rule_value ) || ! is_numeric( $value ) ) {
					return false;
				}
				return (float) $value < (float) $rule_value;

			case 'contains':
				if ( is_array( $value ) ) {
					return array_intersect( $value, $rule_value );
				}
				return strpos( $value, $rule_value ) !== false;

			case 'not_contains':
				if ( is_array( $value ) ) {
					return ! array_intersect( $value, $rule_value );
				}
				return strpos( $value, $rule_value ) === false;

			case 'starts_with':
				if ( strlen( $rule_value ) > strlen( $value ) ) {
					return false;
				}
				return substr_compare( $value, $rule_value, 0, strlen( $rule_value ) ) === 0;

			case 'ends_with':
				if ( strlen( $rule_value ) > strlen( $value ) ) {
					return false;
				}
				return substr_compare( $value, $rule_value, -strlen( $rule_value ) ) === 0;
			case 'is_empty':
				return empty( $value );
			case 'is_not_empty':
				return ! empty( $value );
			default:
				return false;
		}

		return true;
	}
}
