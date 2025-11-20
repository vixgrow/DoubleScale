<?php

/**
 * Class Goal
 *
 * This class is responsible for handling the goal
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use Exception;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Goal class
 */
abstract class Goal_Pro extends Goal {

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
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
}
