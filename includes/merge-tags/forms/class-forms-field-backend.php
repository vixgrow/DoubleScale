<?php

/**
 * Forms Field Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Forms;

// Load parent class if not already loaded
if ( ! class_exists( 'QuillCRM\Merge_Tags\Forms\Forms_Field' ) ) {
	require_once __DIR__ . '/class-forms-field.php';
}

// Prevent multiple class declarations
if ( ! class_exists( 'QuillCRM\Merge_Tags\Forms\Forms_Field_Backend' ) ) {

	/**
	 * Forms Field Backend Merge Tag
	 *
	 * Extends Forms_Field with backend-specific functionality
	 */
	class Forms_Field_Backend extends Forms_Field {



		/**
		 * Required Triggers
		 *
		 * @var array
		 */
		public $required_triggers = array( 'ttt' );

		/**
		 * Constructor
		 *
		 * @param string $group Group.
		 */
		public function __construct( $group ) {
			// Call parent constructor with generic parameters for backend usage
			parent::__construct( '', __( 'Form Field', 'quillcrm' ), $group );

			// Override slug for backend generic field tag
			$this->slug = 'field:';
		}
	}
}
