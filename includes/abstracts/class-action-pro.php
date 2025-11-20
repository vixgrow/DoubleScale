<?php

/**
 * Abstract Action Pro
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Action_Pro class
 */
abstract class Action_Pro extends Action {


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
	 * Process Action - Pro actions should not process in free version
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		// Pro actions don't process in free version.
		return false;
	}
}
