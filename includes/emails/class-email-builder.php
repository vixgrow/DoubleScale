<?php
/**
 * Email Builder
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails;

/**
 * Main Email Builder class
 */
class Email_Builder {
	/**
	 * Instance
	 *
	 * @var Email_Builder
	 */
	private static $instance;

	/**
	 * Get Instance
	 *
	 * @return Email_Builder
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		$this->includes();
	}

	/**
	 * Include required files
	 */
	private function includes() {
		// Include block system
		require_once QUILLCRM_PLUGIN_DIR . 'includes/interfaces/class-templates-interface.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/abstracts/class-email-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/class-block-registry.php';

		// Include block implementations
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-text-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-button-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-image-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-divider-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-html-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-social-media-block.php';

		// Include renderer
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/class-email-renderer.php';
	}
}