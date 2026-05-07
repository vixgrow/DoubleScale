<?php

/**
 * Class Form
 * This class is responsible for handling the integration of forms
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */


namespace DoubleScale\Modules\Forms\Abstracts;

/**
 * Form class
 */
abstract class FormPro extends Form {


	public function __construct() {
		 $this->is_pro = ! doublescale_is_plugin_active( DOUBLESCALE_PRO_PLUGIN_PATH );
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
