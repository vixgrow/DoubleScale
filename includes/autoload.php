<?php
/**
 * Register autoload function
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM;

defined( 'ABSPATH' ) || exit;

spl_autoload_register( __NAMESPACE__ . '\autoload' );

/**
 * Autoloader function
 *
 * @param string $class class name.
 * @return void
 */
function autoload( $class ) {
	$class_breakdown = explode( '\\', $class );
	if ( array_shift( $class_breakdown ) === __NAMESPACE__ ) {
		$class_breakdown   = array_map(
			function( $value ) {
				return str_replace( '_', '-', strtolower( $value ) );
			},
			$class_breakdown
		);
		$class_breakdown[] = 'class-' . array_pop( $class_breakdown );
		$class_file        = __DIR__ . '/' . implode( '/', $class_breakdown ) . '.php';
		
		// Skip SMS/WhatsApp files - moved to Pro plugin
		$pro_only_files = array(
			'campaign/class-sms-processing.php',
			'campaign/class-whatsapp-processing.php',
			'tracking/class-sms.php',
			'tracking/class-whatsapp.php',
			'automations/actions/class-send-sms.php',
			'automations/actions/class-send-whatsapp.php',
			'individual-messaging/class-sms-individual-sender.php',
			'individual-messaging/class-whatsapp-individual-sender.php',
			'message-providers/class-twilio-message-provider.php',
			'managers/class-message-provider-registry.php',
		);
		
		$relative_path = str_replace( __DIR__ . '/', '', $class_file );
		if ( in_array( $relative_path, $pro_only_files, true ) ) {
			return; // Skip loading Pro-only files
		}
		
		if ( file_exists( $class_file ) ) {
			include $class_file;
		}
	}
}
