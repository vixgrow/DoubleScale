<?php

/**
 * Class Core
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM;

defined( 'ABSPATH' ) || exit;

use QuillCRM\Managers\Custom_Fields_Manager;
use QuillCRM\Managers\Filters_Manager;
use QuillCRM\Managers\Forms_Manager;
use QuillCRM\Managers\Integrations_Manager;
use QuillCRM\Utils;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Managers\Goals_Manager;
use QuillCRM\Managers\Rules_Manager;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Import_Export\Importers\Manager as Importers_Manager;
use QuillCRM\User_Roles\Permissions;
// use QuillCRM\Managers\Pipeline_Manager; // Moved to Pro
// use QuillCRM\Managers\Deal_Manager; // Moved to Pro

/**
 * Core Class
 *
 * @since 1.0.0
 */
class Core {






	/**
	 * Set admin config
	 *
	 * @since 1.8.0
	 *
	 * @return void
	 */
	public static function set_admin_config() {
		 // Admin email address.
		$admin_email = get_option( 'admin_email' );
		$ajax_url    = admin_url( 'admin-ajax.php' );
		$nonce       = wp_create_nonce( 'quillcrm-admin' );

		// Get current user capabilities for role-based access control
		$user_capabilities = array(
			'quillcrm_crm_manager' => Permissions::is_crm_manager(),
			'quillcrm_deal_owner'  => Permissions::is_deal_owner(),
		);

		// Get QuillSMTP connection info
		$quillsmtp_info = self::get_quillsmtp_connection_info();

		wp_add_inline_script(
			'qcrm-config',
			'qcrm.config.setBlogName("' . get_bloginfo( 'name' ) . '");' .
				'qcrm.config.setAdminUrl("' . admin_url() . '");' .
				'qcrm.config.setAdminEmail("' . $admin_email . '");' .
				'qcrm.config.setAjaxUrl("' . $ajax_url . '");' .
				'qcrm.config.setNonce("' . $nonce . '");' .
				'qcrm.config.setPluginDirUrl("' . QUILLCRM_PLUGIN_URL . '");' .
				'qcrm.config.setForms(' . wp_json_encode( Forms_Manager::instance()->get_options() ) . ');' .
				'qcrm.config.setFiltersGroups(' . wp_json_encode( Filters_Manager::instance()->get_groups() ) . ');' .
				'qcrm.config.setCustomFieldsTypes(' . wp_json_encode( Custom_Fields_Manager::instance()->get_options() ) . ');' .
				'qcrm.config.setContactFieldsGroups(' . wp_json_encode( Utils::get_contact_fields() ) . ');' .
				'qcrm.config.setIntegrations(' . wp_json_encode( Integrations_Manager::instance()->get_options() ) . ');' .
				'qcrm.config.setAutomationTriggers(' . wp_json_encode( Triggers_Manager::instance()->get_sources() ) . ');' .
				'qcrm.config.setAutomationActions(' . wp_json_encode( Actions_Manager::instance()->get_sources() ) . ');' .
				'qcrm.config.setAutomationGoals(' . wp_json_encode( Goals_Manager::instance()->get_sources() ) . ');' .
				'qcrm.config.setAutomationRules(' . wp_json_encode( Rules_Manager::instance()->get_groups() ) . ');' .
				'qcrm.config.setIsWoocommerceActive( ' . quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) . ' );' .
				'qcrm.config.setIsEddActive( ' . defined( 'EDD_PLUGIN_FILE' ) . ' );' .
				'qcrm.config.setIsLmsActive( ' . quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ) . ' );' .
				'qcrm.config.setSiteUrl( "' . site_url() . '" );' .
				'qcrm.config.setMergeTags( ' . wp_json_encode( Merge_Tags_Manager::instance()->get_groups() ) . ');' .
				'qcrm.config.setImporters( ' . wp_json_encode( Importers_Manager::instance()->get_options() ) . ');' .
				'qcrm.config.setUserCapabilities( ' . wp_json_encode( $user_capabilities ) . ');' .
				// Pipeline and Deal config - only if PRO plugin is active
				( class_exists( 'QuillCRM_Pro\Managers\Pipeline_Manager' )
					? 'qcrm.config.setDefaultStages( ' . wp_json_encode( \QuillCRM_Pro\Managers\Pipeline_Manager::instance()->get_default_stages() ) . ');'
					: 'qcrm.config.setDefaultStages( [] );' ) .
				( class_exists( 'QuillCRM_Pro\Managers\Deal_Manager' )
					? 'qcrm.config.setDealPriorities( ' . wp_json_encode( \QuillCRM_Pro\Managers\Deal_Manager::instance()->get_deal_priorities() ) . ');'
					: 'qcrm.config.setDealPriorities( [] );' ) .
				'qcrm.config.setQuillSMTPInfo( ' . wp_json_encode( $quillsmtp_info ) . ');'
		);
	}

	/**
	 * Get QuillSMTP connection information
	 *
	 * @since 1.8.0
	 *
	 * @return array QuillSMTP connection info including verified senders
	 */
	private static function get_quillsmtp_connection_info() {
		// Check if QuillSMTP is installed and active
		if ( ! defined( 'QUILLSMTP_PLUGIN_FILE' ) ) {
			return array(
				'configured' => false,
				'plugin_url' => admin_url( 'plugin-install.php?s=quillsmtp&tab=search' ),
			);
		}

		// Get QuillSMTP settings
		$settings    = get_option( 'quillsmtp_settings', array() );
		$connections = isset( $settings['connections'] ) && is_array( $settings['connections'] ) ? $settings['connections'] : array();

		// If no connections configured
		if ( empty( $connections ) ) {
			return array(
				'configured' => false,
				'config_url' => admin_url( 'admin.php?page=quillsmtp' ),
			);
		}

		// Extract verified senders from connections
		$verified_senders = array();
		foreach ( $connections as $connection_id => $connection ) {
			if ( ! empty( $connection['from_email'] ) && is_email( $connection['from_email'] ) ) {
				$verified_senders[] = array(
					'email'         => $connection['from_email'],
					'name'          => isset( $connection['from_name'] ) ? $connection['from_name'] : '',
					'connection_id' => $connection_id,
				);
			}
		}

		return array(
			'configured'       => true,
			'verified_senders' => $verified_senders,
			'config_url'       => admin_url( 'admin.php?page=quillsmtp' ),
		);
	}
}
