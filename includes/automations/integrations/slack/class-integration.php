<?php
/**
 * Class Slack (Free Version Stub)
 *
 * This is a stub integration that shows "Pro Feature" notice in free plugin
 * The Pro plugin will override this with the actual Slack integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Slack;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Slack stub class for free plugin
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Slack';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'slack';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'Slack is a digital headquarters that brings all your work communication and tools together in one place, like a shared workspace for your team.';

	/**
	 * Is Pro feature
	 *
	 * @var bool
	 *
	 * @since 1.0.0
	 */
	public $is_pro = true;

	/**
	 * Option name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $option_name = 'slack';

	/**
	 * Class names
	 *
	 * @var array
	 */
	protected static $classes = array(
		'remote_data'     => Remote_Data::class,
		'rest_controller' => REST_Controller::class,
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		// Call parent constructor to initialize REST controller and remote data
		parent::__construct();
	}

	/**
	 * Connect the integration (stub - always returns false)
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function connect() {
		return false;
	}

	/**
	 * Validate (stub - always returns error)
	 *
	 * @param array $settings Settings.
	 *
	 * @return \WP_Error
	 */
	public function validate( $settings ) {
		return new \WP_Error( 'pro_feature', __( 'Slack integration is a Pro feature. Please upgrade to QuillCRM Pro.', 'quill-crm' ) );
	}

	/**
	 * Get fields (returns empty array in free version)
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}
}

// Register the stub integration in free plugin ONLY if Pro is not active
// Pro plugin will register the real Slack integration instead
if ( ! class_exists( 'QuillCRM_Pro\Automations\Integrations\Slack\Integration' ) ) {
	Integrations_Manager::instance()->register( new Integration() );
}
