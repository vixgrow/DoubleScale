<?php
/**
 * Core module — admin shell, DB lifecycle, roles, logging, and general REST.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core;

defined( 'ABSPATH' ) || exit;

final class CoreModule extends AbstractModule {

	public function slug(): string {
		return 'core';
	}

	public function label(): string {
		return __( 'Core', 'doublescale' );
	}

	public function description(): string {
		return __( 'Essential platform infrastructure: admin UI, database, user roles, and settings.', 'doublescale' );
	}

	public function is_toggleable(): bool {
		return false;
	}

	public function version(): string {
		return '1.0.0';
	}

	public function dependencies(): array {
		return array();
	}

	public function migrations(): array {
		if ( ! defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
			return array();
		}
		$base = DOUBLESCALE_PLUGIN_DIR;
		$logger = (array) glob( $base . 'includes/Core/Logger/Migrations/*.php' );
		sort( $logger );
		$custom_fields = array(
			$base . 'includes/Core/CustomFields/Migrations/CustomFieldsGroupsTable.php',
			$base . 'includes/Core/CustomFields/Migrations/CustomFieldsTable.php',
			$base . 'includes/Core/CustomFields/Migrations/CustomFieldRelationshipTable.php',
		);
		$task_meta = $base . 'includes/Core/Database/Migrations/TaskMetaTable.php';
		return array_merge( $custom_fields, array( $task_meta ), $logger );
	}

	public function register( Container $container ): void {
		$container->singleton(
			\DoubleScale\Modules\Automations\Services\MergeTagsManager::class,
			static function () {
				return \DoubleScale\Modules\Automations\Services\MergeTagsManager::instance();
			}
		);

		$container->singleton( Events\EventDispatcher::class );
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestGeneralController::class,
			Rest\Controllers\RestModulesController::class,
			Rest\Controllers\RestPluginsController::class,
			Rest\Controllers\RestSiteVerificationController::class,
			Settings\Rest\RestSettingsController::class,
			Settings\Rest\RestSettingsControllerPro::class,
			Logger\Rest\RestLogController::class,
			UserRoles\Rest\RestUserManagementController::class,
		);
	}

	public function boot( Container $container ): void {
		parent::boot( $container );

		\DoubleScale\Admin\Admin::instance();
		\DoubleScale\Admin\AdminLoader::instance();
		\DoubleScale\SubscriptionManage\SubscriptionManage::instance();
		\DoubleScale\Modules\Contacts\CustomMetabox::get_instance();
		\DoubleScale\UserRoles\UserRoles::instance();
		\DoubleScale\UserRoles\LoginRedirect::instance();
		\DoubleScale\Database\Install::init();
		\DoubleScale\Site\Site::instance();

		if ( is_multisite() ) {
			add_filter( 'user_has_cap', array( $this, 'grant_super_admin_caps' ), 10, 4 );
		}
		add_filter( 'doublescale_register_log_handlers', array( $this, 'register_log_handlers' ) );
		add_action( 'init', array( $this, 'register_contact_meta_table' ) );
		add_action( 'init', array( $this, 'register_cron_schedules' ) );

		add_action(
			'rest_api_init',
			array( Rest\Controllers\RestNotificationShimController::class, 'register_late_shims' ),
			999
		);

		add_action( 'doublescale_daily_doublescale_daily3', array( \DoubleScale\Core\Tasks::class, 'cleanup_old_tasks' ) );
	}

	/**
	 * @param mixed $handlers
	 * @return mixed
	 */
	public function register_log_handlers( $handlers ) {
		$handlers   = is_array( $handlers ) ? $handlers : array();
		$handlers[] = new Logger\LogHandlerDb();
		return $handlers;
	}

	public function register_contact_meta_table(): void {
		global $wpdb;
		$wpdb->contactmeta = $wpdb->prefix . 'doublescale_contact_meta';

		add_filter(
			'get_meta_table',
			static function ( $table, $meta_type ) {
				global $wpdb;
				if ( 'contact' === $meta_type ) {
					return $wpdb->contactmeta;
				}
				return $table;
			},
			10,
			2
		);
	}

	/**
	 * @param array<string, bool> $allcaps
	 * @param string[]            $caps
	 * @param array<int, mixed>   $args
	 * @param \WP_User            $user
	 * @return array<string, bool>
	 */
	public function grant_super_admin_caps( $allcaps, $caps, $args, $user ) {
		if ( is_super_admin( $user->ID ) ) {
			$crm_caps = \DoubleScale\UserRoles\UserRoles::get_all_caps();
			foreach ( $crm_caps as $cap => $grant ) {
				$allcaps[ $cap ] = true;
			}
		}
		return $allcaps;
	}

	public function register_cron_schedules(): void {
		if ( get_transient( 'doublescale_register_tasks_lock_daily' ) ) {
			return;
		}
		set_transient( 'doublescale_register_tasks_lock_daily', 1, MINUTE_IN_SECONDS );

		$daily = new \DoubleScale\Core\Tasks( 'doublescale_daily' );

		if ( $daily->get_next_timestamp( 'doublescale_daily3' ) === false ) {
			$daily->schedule_recurring( time(), DAY_IN_SECONDS, 'doublescale_daily3' );
		}
		if ( $daily->get_next_timestamp( 'doublescale_daily4' ) === false ) {
			$daily->schedule_recurring( time(), DAY_IN_SECONDS, 'doublescale_daily4' );
		}
		if ( $daily->get_next_timestamp( 'doublescale_cleanup_page_visits' ) === false ) {
			$daily->schedule_recurring( time(), DAY_IN_SECONDS, 'doublescale_cleanup_page_visits' );
		}
	}
}
