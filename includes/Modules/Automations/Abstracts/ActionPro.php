<?php

/**
 * Abstract Action Pro
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Abstracts;

use DoubleScale\Modules\Automations\Models\AutomationModel;
use DoubleScale\Modules\Automations\Models\AutomationStepModel;
use DoubleScale\Modules\Automations\Models\AutomationContactModel;

/**
 * ActionPro class
 */
abstract class ActionPro extends Action {


	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		 $this->is_pro = ! doublescale_is_plugin_active( DOUBLESCALE_PRO_PLUGIN_PATH );
		parent::__construct();
	}

	/**
	 * Process Action - Pro actions should not process in free version
	 *
	 * @since 1.0.0
	 *
	 * @param AutomationModel         $automation Automation Model.
	 * @param AutomationStepModel    $step Automation Step Model.
	 * @param AutomationContactModel $automation_contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( AutomationModel $automation, AutomationStepModel $step, AutomationContactModel $automation_contact ) {
		// Pro actions don't process in free version.
		return false;
	}
}
