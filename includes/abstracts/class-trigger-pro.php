<?php

/**
 * Abstract Trigger
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

/**
 * Trigger class
 */
abstract class Trigger_Pro extends Trigger {


	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		 $this->is_pro = ! quillcrm_is_plugin_active( QUILLCRM_PRO_PLUGIN_PATH );
		parent::__construct();
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
	 * @return array
	 */
	public function get_fields() {
		return array();
	}
}
