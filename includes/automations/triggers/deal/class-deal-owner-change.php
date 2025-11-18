<?php

namespace QuillCRM\Automations\Triggers\Deal;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Deal Owner Change Trigger (PRO Only - Stub)
 *
 * This is a placeholder to register the trigger in the free version
 * so it appears in the UI with a PRO lock. The actual implementation
 * is in the PRO version.
 */
class Deal_Owner_Change extends Trigger {



	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Deal Owner changes';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'deal_owner_change';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a deal owner is changed.';

	/**
	 * Trigger Source
	 *
	 * @var string
	 */
	public $source = 'crm';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'deal';

	/**
	 * Is PRO only
	 *
	 * @var bool
	 */
	public $is_pro = true;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		 // Check if PRO plugin is active - if yes, remove the lock
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
	 * Get fields (required for UI)
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}
}

Triggers_Manager::instance()->register( new Deal_Owner_Change() );
