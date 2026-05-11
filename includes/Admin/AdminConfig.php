<?php

/**
 * Builds `window.doublescaleConfig` for the React admin shell.
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Admin;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Settings\Settings;
use DoubleScale\Modules\Contacts\Filters\FiltersManager;
use DoubleScale\Managers\IntegrationsManager;
use DoubleScale\Core\Utils\Utils;
use DoubleScale\Modules\Automations\Services\TriggersManager;
use DoubleScale\Modules\Automations\Services\ActionsManager;
use DoubleScale\Modules\Automations\Services\GoalsManager;
use DoubleScale\Modules\Automations\Services\RulesManager;
use DoubleScale\Managers\MergeTagsManager;
use DoubleScale\Modules\Contacts\ImportExport\Importers\Manager as Importers_Manager;
use DoubleScale\UserRoles\Permissions;
use DoubleScale\Site\License;
// use DoubleScale\Modules\Deals\Services\PipelineManager; // Moved to Pro
// use DoubleScale\Modules\Deals\Services\DealManager; // Moved to Pro

/**
 * Admin SPA configuration emitter.
 *
 * @since 1.0.0
 */
final class AdminConfig {

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
		$nonce       = wp_create_nonce( 'doublescale-admin' );

		// Get current user capabilities for role-based access control.
		//
		// Two buckets are exposed to the SPA:
		//
		//   1. CRM role flags — used by `useCapabilities()` for role-based UI
		//      (sidebar grouping, settings tab gating, etc.). These already
		//      collapse Administrator into CRM Manager — see
		//      {@see Permissions::is_crm_manager()}.
		//   2. Booking module caps — every cap from
		//      {@see BookingCapabilities::get_all_capabilities()} resolved via
		//      WP's `current_user_can()`. Lets `requiredCapability:` arrays in
		//      `registerAdminPage` reference booking caps directly.
		$user_capabilities = array(
			'doublescale_crm_manager'   => Permissions::is_crm_manager(),
			'doublescale_sales_manager' => Permissions::is_sales_manager(),
			'doublescale_sales_rep'     => Permissions::is_sales_rep(),
		);

		if ( class_exists( \DoubleScale\Modules\Booking\Capabilities::class ) ) {
			foreach ( \DoubleScale\Modules\Booking\Capabilities::get_all_capabilities() as $booking_cap ) {
				$user_capabilities[ $booking_cap ] = current_user_can( $booking_cap );
			}
		}

		$current_wp_user = wp_get_current_user();
		$current_user    = array(
			'id'           => $current_wp_user->ID,
			'display_name' => $current_wp_user->display_name,
			'email'        => $current_wp_user->user_email,
		);

		$url_doublescale_pro = DOUBLESCALE_PRO_PRICE_URL;

		// Get smtp connection info
		$smtp_info = self::get_smtp_connection_info();

		// Get license info
		$license_info = License::instance()->get_license_info();

		// Get pro plugin data
		$pro_plugin_data = self::get_pro_plugin_data();

		$config = apply_filters(
			'doublescale_admin_config',
			array(
				'blogName'            => get_bloginfo( 'name' ),
				'adminUrl'            => admin_url(),
				'menuSlug'            => apply_filters( 'doublescale_admin_menu_slug', 'doublescale'),
				'adminEmail'          => $admin_email,
				'ajaxUrl'             => $ajax_url,
				'nonce'               => $nonce,
				'pluginDirUrl'        => DOUBLESCALE_PLUGIN_URL,
				'siteUrl'             => site_url(),
				'forms'               => class_exists( '\DoubleScale\Modules\Forms\Services\FormsManager' )
					? \DoubleScale\Modules\Forms\Services\FormsManager::instance()->get_options()
					: array(),
				'filtersGroups'       => FiltersManager::instance()->get_groups(),
				'customFieldsTypes'   => class_exists( \DoubleScale\Core\CustomFields\CustomFieldsManager::class ) ? \DoubleScale\Core\CustomFields\CustomFieldsManager::instance()->get_options() : array(),
				'contactFieldsGroups' => Utils::get_contact_fields(),
				'integrations'        => IntegrationsManager::instance()->get_options(),
				'automationTriggers'  => TriggersManager::instance()->get_sources(),
				'automationActions'   => ActionsManager::instance()->get_sources(),
				'automationGoals'     => GoalsManager::instance()->get_sources(),
				'automationRules'     => class_exists( 'DoubleScale\Modules\Automations\Services\RulesManager' ) ? RulesManager::instance()->get_groups() : array(),
				'isWoocommerceActive' => (bool) doublescale_is_plugin_active( 'woocommerce/woocommerce.php' ),
				'isEddActive'         => defined( 'EDD_PLUGIN_FILE' ),
				'isSurecartActive'    => defined( 'SURECART_PLUGIN_FILE' ),
				'isLmsActive'           => (bool) ( doublescale_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ) || doublescale_is_plugin_active( 'tutor/tutor.php' ) || doublescale_is_plugin_active( 'lifterlms/lifterlms.php' ) || doublescale_is_plugin_active( 'learnpress/learnpress.php' ) ),
				'isMemberpressActive'   => defined( 'MEPR_PLUGIN_NAME' ),
				'isPmproActive'         => defined( 'PMPRO_VERSION' ),
				'mergeTags'           => MergeTagsManager::instance()->get_groups(),
				'importers'           => Importers_Manager::instance()->get_options(),
				'userCapabilities'    => $user_capabilities,
				'currentUser'         => $current_user,
				'defaultStages'       => class_exists( 'DoubleScale\Modules\Deals\Services\PipelineManager' ) ? \DoubleScale\Modules\Deals\Services\PipelineManager::instance()->get_default_stages() : array(),
				'dealPriorities'      => class_exists( 'DoubleScale\Modules\Deals\Services\DealManager' ) ? \DoubleScale\Modules\Deals\Services\DealManager::instance()->get_deal_priorities() : array(),
				'smtpInfo'       => $smtp_info,
				'currency'            => Settings::get_currency(),
				'urlDoubleScalePro' => $url_doublescale_pro,
				'license'             => $license_info ? $license_info : false,
				'planLevels'          => self::get_plan_levels(),
				'proPluginData'       => $pro_plugin_data,
				'addons'              => self::get_addons_status(),
				'storeNonce'          => wp_create_nonce( 'doublescale-admin' ),
			'aiConfigured'        => self::is_ai_configured(),
			'aiAssistantEnabled'  => false,
			'modules'             => self::get_modules_config(),
			)
		);

		wp_add_inline_script(
			'doublescale-admin',
			'window.doublescaleConfig = ' . wp_json_encode( $config ) . ';',
			'before'
		);
	}

	/**
	 * Get plan levels keyed by plan slug.
	 *
	 * @since 1.5.0
	 *
	 * @return array<string, array{label: string, level: int}>
	 */
	private static function get_plan_levels() {
		$plans  = \DoubleScale\Site\License::instance()->get_plans();
		$result = array();
		foreach ( $plans as $slug => $plan ) {
			$result[ $slug ] = array(
				'label' => $plan['label'],
				'level' => $plan['level'],
			);
		}
		return $result;
	}

	/**
	 * Get addon plugins status.
	 *
	 * @since 1.7.0
	 *
	 * @return array<string, array{slug: string, label: string, description: string, is_installed: bool, is_active: bool, plugin_file: string}>
	 */
	private static function get_addons_status() {
		$store_addons = \DoubleScale\Site\Store::instance()->get_all_addons();
		$result       = array();

		foreach ( $store_addons as $slug => $addon ) {
			$result[ $slug ] = array(
				'slug'         => $slug,
				'label'        => $addon['name'],
				'description'  => $addon['description'],
				'plugin_file'  => $addon['plugin_file'],
				'image'        => $addon['image'],
				'plan'         => $addon['plan'] ?? 'basic',
				'is_installed' => $addon['is_installed'],
				'is_active'    => $addon['is_active'],
			);
		}

		return $result;
	}

	/**
	 * Build module metadata for the frontend config.
	 *
	 * @since 2.0.0
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private static function get_modules_config() {
		$registry = \DoubleScale\Core\PluginKernel::instance()->get_module_registry();
		$all      = $registry->all();
		$stored   = get_option( 'doublescale_enabled_modules', array() );
		$result   = array();

		foreach ( $all as $slug => $module ) {
			$deps = array_filter(
				$module->dependencies(),
				static function ( $d ) {
					return 'core' !== $d;
				}
			);

			$enabled = $module->is_toggleable()
				? ( ! isset( $stored[ $slug ] ) || (bool) $stored[ $slug ] )
				: true;

			$result[] = array(
				'slug'          => $slug,
				'label'         => $module->label(),
				'description'   => $module->description(),
				'enabled'       => $enabled,
				'is_toggleable' => $module->is_toggleable(),
				'dependencies'  => array_values( $deps ),
			);
		}

		return $result;
	}

	/**
	 * Check whether the AI provider is configured.
	 *
	 * @since 1.9.0
	 *
	 * @return bool True when a provider and Api key (or custom provider) are set.
	 */
	private static function is_ai_configured() {
		$ai = Settings::get( 'ai', array() );
		return ! empty( $ai['provider'] )
			&& ( 'custom' === $ai['provider'] || ! empty( $ai['api_key'] ) );
	}

	/**
	 * Get pro plugin data
	 *
	 * @since 1.8.0
	 *
	 * @return array Pro plugin data including installation and activation status
	 */
	private static function get_pro_plugin_data() {
		if ( ! function_exists( 'is_plugin_active' ) || ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		// base dir of plugins (with trailing slash) instead of WP_PLUGIN_DIR.
		$plugins_dir      = trailingslashit( dirname( dirname( DOUBLESCALE_PLUGIN_FILE ) ) );
		$plugin_file      = 'DoubleScale-Pro/doublescale-pro.php';
		$full_plugin_file = $plugins_dir . $plugin_file;
		$plugin_exists    = file_exists( $full_plugin_file );

		return array(
			'is_installed' => $plugin_exists,
			'is_active'    => is_plugin_active( $plugin_file ),
		);
	}

	/**
	 * Get smtp connection information
	 *
	 * @since 1.8.0
	 *
	 * @return array smtp connection info including verified senders
	 */
	private static function get_smtp_connection_info() {
		$email_oauth_class = 'DoubleScale\\Modules\\Inbox\\Oauth\\EmailOauth';
		if ( ! class_exists( $email_oauth_class, false ) ) {
			return array(
				'configured' => false,
				'plugin_url' => admin_url( 'plugin-install.php?s=smtp&tab=search' ),
			);
		}

		if ( ! call_user_func( array( $email_oauth_class, 'smtp_oauth_storage_available' ) ) ) {
			return array(
				'configured' => false,
				'plugin_url' => admin_url( 'plugin-install.php?s=smtp&tab=search' ),
			);
		}

		$settings    = get_option( call_user_func( array( $email_oauth_class, 'smtp_routing_option_name' ) ), array() );
		$connections = isset( $settings['connections'] ) && is_array( $settings['connections'] ) ? $settings['connections'] : array();

		// If no connections configured
		if ( empty( $connections ) ) {
			return array(
				'configured' => false,
				'config_url' => admin_url( 'admin.php?page=smtp' ),
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
			'config_url'       => admin_url( 'admin.php?page=smtp' ),
		);
	}
}
