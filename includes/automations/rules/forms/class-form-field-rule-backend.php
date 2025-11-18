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

// Prevent multiple class declarations
if ( ! class_exists( 'QuillCRM\Automations\Rules\Forms\Form_Field_Rule_Backend' ) ) {

	/**
	 * Form_Field_Rule_Backend class
	 *
	 * Extends Form_Field_Rule with backend-specific functionality
	 */
	class Form_Field_Rule_Backend extends Form_Field_Rule {


		/**
		 * Required Triggers
		 *
		 * @var array
		 */
		public $required_triggers = array( 'ttt' );
	}
}
