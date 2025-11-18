<?php

/**
 * Class Form_Field_Rule
 *
 * This class is responsible for handling form field rules
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\Forms;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Abstracts\Form;
use QuillCRM\Models\Automation_Contact_Model;

// Prevent multiple class declarations
if ( ! class_exists( 'QuillCRM\Automations\Rules\Forms\Form_Field_Rule' ) ) {

	/**
	 * Form_Field_Rule class
	 */
	class Form_Field_Rule extends Rule {


		/**
		 * Form instance
		 *
		 * @var Form
		 *
		 * @since 1.0.0
		 */
		protected $form;

		/**
		 * Form ID
		 *
		 * @var string|int|null
		 *
		 * @since 1.0.0
		 */
		protected $form_id;

		/**
		 * Field ID
		 *
		 * @var string|int|null
		 *
		 * @since 1.0.0
		 */
		protected $field_id;

		/**
		 * Field Name
		 *
		 * @var string|null
		 *
		 * @since 1.0.0
		 */
		protected $field_name;

		/**
		 * Type
		 *
		 * @var string
		 *
		 * @since 1.0.0
		 */
		public $type = 'text';

		/**
		 * Constructor
		 *
		 * @param Form            $form Form instance.
		 * @param string|int|null $form_id Form ID (optional for specific field rules).
		 * @param string|int|null $field_id Field ID (optional for specific field rules).
		 * @param string|null     $field_name Field name (optional for specific field rules).
		 */
		public function __construct( $form, $form_id = null, $field_id = null, $field_name = null ) {
			$this->form       = $form;
			$this->form_id    = $form_id;
			$this->field_id   = $field_id;
			$this->field_name = $field_name;

			if ( $field_name && $field_id && $form_id ) {
				// Specific field rule
				$this->name  = $field_name;
				$this->slug  = $form->slug . '_field_' . $field_id . '_form_' . $form_id;
				$this->group = $form->slug;
			} else {
				// Generic form field rule
				$this->name  = sprintf( __( '%s Field', 'quillcrm' ), $form->name );
				$this->slug  = $form->slug . '_field_';
				$this->group = $form->slug;
			}
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
		public function get_value( $automation_contact ) {
			// Get the form submission data from the automation contact
			$form_data = $automation_contact->get_data( 'form_data', array() );

			// Check if we have form data
			if ( empty( $form_data ) || ! isset( $form_data['entry']['fields'] ) ) {
				return null;
			}

			// If this is a specific field rule, return the specific field value
			if ( $this->field_id && $this->form_id ) {
				// Check if this is the correct form
				if ( isset( $form_data['form_id'] ) && $form_data['form_id'] == $this->form_id ) {
					return isset( $form_data['entry']['fields'][ $this->field_id ] )
						? $form_data['entry']['fields'][ $this->field_id ]
						: null;
				}
				return null;
			}

			// For generic rules, return the entire form data
			return $form_data['entry']['fields'];
		}

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
			);
		}

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
			// Get the form submission data
			$form_data = $automation_contact->data;

			$value = null;

			// If this is a specific field rule (has field_id and form_id set)
			if ( $this->field_id && $this->form_id ) {
				// Check if this is the correct form
				if ( ! isset( $form_data['form_id'] ) || $form_data['form_id'] != $this->form_id ) {
					return false;
				}

				// Get the specific field value
				if ( isset( $form_data['entry']['fields'][ $this->field_id ] ) ) {
					$value = $form_data['entry']['fields'][ $this->field_id ];
				}
			} else {
				$slug = $rule['rule'] ?? null;

				if ( $slug && preg_match( '/_field_([^_]+)_form_([^_]+)$/', $slug, $matches ) ) {
					$rule_field_id = $matches[1];
					$rule_form_id  = $matches[2];
				} else {
					$rule_field_id = $rule['options']['field_id'] ?? null;
					$rule_form_id  = $rule['options']['form_id'] ?? null;
				}

				if ( ! $rule_form_id || ! $rule_field_id ) {
					return false;
				}

				if ( ! isset( $form_data['form_id'] ) || $form_data['form_id'] != $rule_form_id ) {
					return false;
				}

				if ( isset( $form_data['entry']['fields'][ $rule_field_id ] ) ) {
					$value = $form_data['entry']['fields'][ $rule_field_id ];
				}
			}

			$operator   = $rule['operator'];
			$rule_value = $rule['value'];

			switch ( $operator ) {
				case 'is':
					if ( is_array( $value ) ) {
						return ! array_diff( $value, (array) $rule_value );
					}
					return ($value == $rule_value); // phpcs:ignore

				case 'is_not':
					if ( is_array( $value ) ) {
						return ! in_array($rule_value, $value); // phpcs:ignore
					}
					return ($value != $rule_value); // phpcs:ignore

				case 'contains':
					if ( is_array( $value ) ) {
						return ! empty( array_intersect( $value, (array) $rule_value ) );
					}
					return strpos( (string) $value, (string) $rule_value ) !== false;

				case 'does_not_contain':
					if ( is_array( $value ) ) {
						return empty( array_intersect( $value, (array) $rule_value ) );
					}
					return strpos( (string) $value, (string) $rule_value ) === false;

				case 'starts_with':
					$value      = (string) $value;
					$rule_value = (string) $rule_value;
					if ( strlen( $rule_value ) > strlen( $value ) ) {
						return false;
					}
					return substr_compare( $value, $rule_value, 0, strlen( $rule_value ) ) === 0;

				case 'ends_with':
					$value      = (string) $value;
					$rule_value = (string) $rule_value;
					if ( strlen( $rule_value ) > strlen( $value ) ) {
						return false;
					}
					return substr_compare( $value, $rule_value, -strlen( $rule_value ) ) === 0;

				default:
					return false;
			}
		}
	}
}
