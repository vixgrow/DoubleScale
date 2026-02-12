<?php

/**
 * SMTP Plugin Active Trait
 *
 * Provides common functionality for checking if the QuillSMTP or QuillSMTP Pro plugin is active and has the required version.
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage Emails\Traits
 */

namespace QuillCRM\Emails\Traits;

trait SMTP_Plugin_Active {

	public static function is_quillsmtp_plugin_active() {
		return defined( 'QUILLSMTP_PLUGIN_VERSION' );
	}

	public static function is_quillsmtp_pro_plugin_active() {
		return defined( 'QUILLSMTP_PRO_PLUGIN_VERSION' );
	}

	public static function is_quillsmtp_plugin_accepting_version() {
		return version_compare( QUILLSMTP_PLUGIN_VERSION, '1.7.0', '>=' );
	}

	public static function is_quillsmtp_pro_plugin_accepting_version() {
		return version_compare( QUILLSMTP_PRO_PLUGIN_VERSION, '1.0.0', '>=' );
	}
}
