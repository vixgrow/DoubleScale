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
			'qcrm.config.setSiteUrl( "' . site_url() . '" );' .
			'qcrm.config.setMergeTags( ' . wp_json_encode( Merge_Tags_Manager::instance()->get_groups() ) . ');'
		);
	}
}
