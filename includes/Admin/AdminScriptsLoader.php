<?php
/**
 * Admin Scripts Loader
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Admin;

/**
 * Admin Scripts Loader Class.
 *
 * Handles loading of admin-specific scripts and styles.
 *
 * @since 1.0.0
 */
class AdminScriptsLoader {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var AdminScriptsLoader
	 */
	private static $instance;

	/**
	 * AdminScriptsLoader Instance.
	 *
	 * Instantiates or reuses an instance of AdminScriptsLoader.
	 *
	 * @since  1.0.0
	 * @static
	 *
	 * @return self - Single instance
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Returns true if we are on a Plugin admin page.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if on Plugin admin page
	 */
	public static function is_admin_page(): bool {
		$current_screen = get_current_screen();
		if ( false === strpos( $current_screen->id, 'doublescale' ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		// Load Pro client scripts early (before free plugin registers pages at priority 10)
		// This ensures filters are registered BEFORE registerAdminPage is called
		add_action( 'doublescale_admin_enqueue_scripts', array( $this, 'enqueue_client_scripts' ), 5 );
		// Load Pro admin scripts late (after free plugin)
		// add_action( 'doublescale_admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ), PHP_INT_MAX );
	}

	/**
	 * Enqueue Pro client scripts (sales pipeline override).
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook Current admin page hook
	 */
	public function enqueue_client_scripts( $hook ) {

		$asset_file = DOUBLESCALE_PLUGIN_DIR . 'build/client/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		// Enqueue index.css (entry-point CSS not covered by doublescale-admin's style-index.css)
		wp_enqueue_style(
			'doublescale-pro-client',
			DOUBLESCALE_PLUGIN_URL . 'build/client/index.css',
			array(),
			$asset['version']
		);
		wp_style_add_data( 'doublescale-pro-client', 'rtl', 'replace' );

		// Attach Pro config to the main admin script
		wp_localize_script(
			'doublescale-admin',
			'doublescalePro',
			array(
				'version'   => DOUBLESCALE_VERSION,
				'pluginUrl' => DOUBLESCALE_PLUGIN_URL,
				'restUrl'   => rest_url( 'doublescale/v1/' ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'isPro'     => true,
			)
		);
	}

	/**
	 * Enqueue Pro admin scripts (block registration).
	 *
	 * @since 1.0.0
	 */
	// public function enqueue_admin_scripts() {
	// $asset_file   = DOUBLESCALE_PLUGIN_DIR . 'build/admin/index.asset.php';
	// $asset        = file_exists( $asset_file ) ? require $asset_file : null;
	// $dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
	// $version      = isset( $asset['version'] ) ? $asset['version'] : DOUBLESCALE_VERSION;

	// Ensure the free version's client script is loaded first (contains BlocksStore)
	// $dependencies = array_merge( $dependencies, array( 'doublescale-admin' ) );

}
