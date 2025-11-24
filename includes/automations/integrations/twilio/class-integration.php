<?php
/**
 * Class Twilio (Free Version Stub)
 *
 * This is a stub integration that shows "Pro Feature" notice in free plugin
 * The Pro plugin will override this with the actual Twilio integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Twilio;

use QuillCRM\Abstracts\Integration as Integration_Abstract;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Twilio stub class for free plugin
 */
class Integration extends Integration_Abstract {

	/**
	 * Integration Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Twilio';

	/**
	 * Integration Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'twilio';

	/**
	 * Integration Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'Twilio lets apps send and receive messages, make and receive phone calls, and verify users, essentially adding communication features to digital tools.';

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
	public $option_name = 'twilio';

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
		return new \WP_Error( 'pro_feature', __( 'Twilio integration is a Pro feature. Please upgrade to QuillCRM Pro.', 'quillcrm' ) );
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

// Register the stub integration in free plugin
// Pro plugin will override this registration
Integrations_Manager::instance()->register( new Integration() );

