<?php

/**
 * Forms Field Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Forms;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;

// Prevent multiple class declarations
if ( ! class_exists( 'QuillCRM\Merge_Tags\Forms\Forms_Field' ) ) {

	/**
	 * Forms Field Merge Tag
	 */
	class Forms_Field extends Merge_Tag {




		/**
		 * Merge Tag Name
		 *
		 * @var string
		 */
		public $name;

		/**
		 * Merge Tag Slug
		 *
		 * @var string
		 */
		public $slug;

		/**
		 * Merge Tag Description
		 *
		 * @var string
		 */
		public $description;

		/**
		 * Merge Tag Group
		 *
		 * @var string
		 */
		public $group;

		/**
		 * Field name
		 *
		 * @var string
		 */
		protected $field_name;

		/**
		 * Constructor
		 *
		 * @param string $field_name Field name.
		 * @param string $field_label Field label.
		 */
		public function __construct( $field_name, $field_label, $slug ) {
			$this->field_name  = $field_name;
			$this->name        = $field_label;
			$this->slug        = "field:{$field_name}";
			$this->group       = $slug;
			$this->description = sprintf( __( $slug . ' field: %s', 'quillcrm' ), $field_label );
		}

		/**
		 * Get Merge Tag Value
		 *
		 * @param Automation_Contact_Model $contact Automation Contact Model.
		 * @param string                   $merge_tag Merge Tag.
		 *
		 * @return string
		 */
		public function get_value( $contact, $merge_tag = '' ) {
			if ( is_null( $contact ) || ! $contact->data ) {
				return '';
			}

			// Get the field name from the merge tag
			$field_key = str_replace( 'field:', '', $merge_tag );

			// Check if we have form entry data
			if ( isset( $contact->data['entry']['fields'][ $field_key ] ) ) {
				$field_value = $contact->data['entry']['fields'][ $field_key ];

				// Handle array values (for checkboxes, multi-select, etc.)
				if ( is_array( $field_value ) ) {
					return implode( ', ', $field_value );
				}

				return (string) $field_value;
			}

			return '';
		}
	}
}
