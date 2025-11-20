<?php

/**
 * Class Form
 * This class is responsible for handling the integration of forms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */


namespace QuillCRM\Abstracts;

/**
 * Form class
 */
abstract class Form_Pro extends Form {


	public function __construct() {
		 $this->is_pro = ! quillcrm_is_plugin_active( QUILLCRM_PRO_PLUGIN_PATH );
	}

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @param string $form_id
	 *
	 * @return array
	 */
	public function get_fields( $form_id ) {
		return array();
	}
}
