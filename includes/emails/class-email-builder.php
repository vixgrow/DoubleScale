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
		require_once QUILLCRM_PLUGIN_DIR . 'includes/abstracts/class-email-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/class-block-registry.php';

		// Include layout handlers
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/layouts/class-layout-handler-interface.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/layouts/class-abstract-layout-handler.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/layouts/class-abstract-grid-layout-handler.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/layouts/class-side-by-side-layout-handler.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/layouts/class-grid-layout-handler.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/layouts/class-generic-inline-layout-handler.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/layouts/class-layout-handler-registry.php';

		// Include free block implementations
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-text-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-button-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-image-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-html-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-video-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-table-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-signature-block.php';
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/blocks/class-preheader-block.php';
		// Pro blocks (banner, divider, menu, product, social_media, timer) are loaded by Pro plugin

		// Include renderer
		require_once QUILLCRM_PLUGIN_DIR . 'includes/emails/class-email-renderer.php';
	}
}
