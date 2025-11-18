<?php

/**
 * Plugin Name:       Quill CRM
 * Plugin URI:        https://www.quillcrm.com/
 * Description:       A powerful CRM Builder for WordPress that lets you manage leads, track interactions, and automate customer relationships—all seamlessly integrated within your WordPress dashboard.
 * Version:           1.0.0
 * Author:            quillcrm.com
 * Author URI:        http://www.quillcrm.com
 * Text Domain:       quillcrm
 * Requires at least: 5.4
 * Requires PHP: 7.1
 *
 * @package QuillCRM
 */

defined( 'ABSPATH' ) || exit;

// Plugin file.
if ( ! defined( 'QUILLCRM_PLUGIN_FILE' ) ) {
	define( 'QUILLCRM_PLUGIN_FILE', __FILE__ );
}

// Plugin version.
if ( ! defined( 'QUILLCRM_VERSION' ) ) {
	define( 'QUILLCRM_VERSION', '1.0.0' );
}

// Plugin Folder Path.
if ( ! defined( 'QUILLCRM_PLUGIN_DIR' ) ) {
	define( 'QUILLCRM_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}

// Plugin Folder URL.
if ( ! defined( 'QUILLCRM_PLUGIN_URL' ) ) {
	define( 'QUILLCRM_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
}

// PRO Plugin Path (for checking if PRO is active).
if ( ! defined( 'QUILLCRM_PRO_PLUGIN_PATH' ) ) {
	define( 'QUILLCRM_PRO_PLUGIN_PATH', 'QuillCRM-Pro/quillcrm-pro.php' );
}

// Require dependencies.
require_once QUILLCRM_PLUGIN_DIR . 'dependencies/libraries/load.php';
require_once QUILLCRM_PLUGIN_DIR . 'dependencies/vendor/autoload.php';

// Require autoload.
require_once QUILLCRM_PLUGIN_DIR . 'includes/autoload.php';

quillcrm_pre_init();


/**
 * Verify that we can initialize QuillCRM , then load it.
 *
 * @since 1.0.0
 */
function quillcrm_pre_init() {
	// Handle activation for both single site and multisite
	if ( is_multisite() ) {
		register_activation_hook( __FILE__, array( QuillCRM\Database\Install::class, 'multisite_activate' ) );
		add_action( 'wpmu_new_blog', array( QuillCRM\Database\Install::class, 'activate_new_site' ) );
	} else {
		register_activation_hook( __FILE__, array( QuillCRM\Database\Install::class, 'install' ) );
	}

	// Handle deactivation
	register_deactivation_hook( __FILE__, 'quillcrm_deactivation' );

	add_action(
		'plugins_loaded',
		function () {
			QuillCRM\QuillCRM::instance();
			do_action( 'quillcrm_loaded' );
		}
	);
}

/**
 * Plugin deactivation hook
 *
 * @since 1.0.0
 */
function quillcrm_deactivation() {
	// Clear scheduled tasks
	wp_clear_scheduled_hook( 'quillcrm_email_campaigns' );
	wp_clear_scheduled_hook( 'quillcrm_sms_campaigns' );
	wp_clear_scheduled_hook( 'quillcrm_whatsapp_campaigns' );
	wp_clear_scheduled_hook( 'quillcrm_email_sequences' );
	wp_clear_scheduled_hook( 'quillcrm_daily3' );
	wp_clear_scheduled_hook( 'quillcrm_daily4' );
}
