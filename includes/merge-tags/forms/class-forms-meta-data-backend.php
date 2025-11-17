<?php

/**
 * Forms Metadata Merge Tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Forms;

// Load parent class if not already loaded
if ( ! class_exists( 'QuillCRM\Merge_Tags\Forms\Forms_Metadata' ) ) {
	require_once __DIR__ . '/class-forms-meta-data.php';
}

// Prevent multiple class declarations
if ( ! class_exists( 'QuillCRM\Merge_Tags\Forms\Forms_Metadata_BackEnd' ) ) {

	/**
	 * Forms Metadata Backend Merge Tag
	 *
	 * Extends Forms_Metadata with backend-specific functionality
	 */
	class Forms_Metadata_BackEnd extends Forms_Metadata {



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
			parent::__construct( '', __( 'Form Metadata', 'quillcrm' ), $group );

			// Override slug for backend generic metadata tag
			$this->slug = 'metadata:';
		}
	}
}
