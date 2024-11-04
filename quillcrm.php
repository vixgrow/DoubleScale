<?php

/**
 * Plugin Name:       Quill CRM
 * Plugin URI:        https://www.quillcrm.com/
 * Description:       Conversational CRM Builder for WordPress
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

	QuillCRM\QuillCRM::instance();
	register_activation_hook( __FILE__, array( QuillCRM\Database\Install::class, 'install' ) );

	add_action(
		'plugins_loaded',
		function () {
			do_action( 'quillcrm_loaded' );
		}
	);
}
