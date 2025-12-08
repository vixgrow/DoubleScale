<?php

/**
 * Class Slack Rest Controller (Free Version Stub)
 *
 * This is a stub REST controller for the free plugin
 * The Pro plugin will override this with the actual implementation
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Slack;

use QuillCRM\Abstracts\REST_Integration_Controller;

/**
 * Slack Rest Controller stub for free plugin
 */
class REST_Controller extends REST_Integration_Controller {

	/**
	 * Get settings schema (stub - returns empty for free version)
	 *
	 * @return array
	 */
	public function get_settings_schema() {
		return array();
	}
}
