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
		$base   = DOUBLESCALE_PLUGIN_DIR;
		$logger = (array) glob( $base . 'includes/Core/Logger/Migrations/*.php' );
		sort( $logger );
		$task_meta = $base . 'includes/Core/Database/Migrations/TaskMetaTable.php';
		return array_merge( array( $task_meta ), $logger );
	}

	public function register( Container $container ): void {
		$container->singleton(
			\DoubleScale\Core\MergeTags\MergeTagsManager::class,
			static function () {
				return \DoubleScale\Core\MergeTags\MergeTagsManager::instance();
			}
		);

		$container->singleton( Events\EventDispatcher::class );
	}

	public function restControllers(): array {
		return array(
			Rest\Controllers\RestGeneralController::class,
			Rest\Controllers\RestCalendarController::class,
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
		\DoubleScale\Modules\Contacts\Services\SubscriptionManager::instance();
		\DoubleScale\Modules\Contacts\CustomMetabox::get_instance();
		\DoubleScale\Core\UserRoles\UserRoles::instance();
		\DoubleScale\Core\UserRoles\UserRoles::register_woocommerce_bypass();
		\DoubleScale\Core\UserRoles\UserRoles::register_enforcement_hooks();
		\DoubleScale\Core\UserRoles\UserRoles::ensure_provisioned();
		\DoubleScale\Core\UserRoles\LoginRedirect::instance();
		\DoubleScale\Core\UserRoles\WooCommerceCompat::instance();
		\DoubleScale\Database\Install::init();
		\DoubleScale\Website\Site::instance();

		// The DoubleScale top-level admin menu and every CRM REST route check the
		// `doublescale_access` capability. Historically this cap was granted as a
		// side-effect of Booking module boot. Booking now installs on explicit
		// opt-in only, so grant the base access cap here (Core) to keep the admin
		// usable on fresh installs.
		$this->ensure_base_access_capability();

		if ( is_multisite() ) {
			add_filter( 'user_has_cap', array( $this, 'grant_super_admin_caps' ), 10, 4 );
		}
		add_filter( 'doublescale_log_handler_register', array( $this, 'register_log_handlers' ) );
		add_action( 'init', array( $this, 'register_contact_meta_table' ) );
		add_action( 'init', array( $this, 'register_cron_schedules' ) );

		add_action( 'doublescale_daily_doublescale_daily3', array( \DoubleScale\Core\Tasks::class, 'cleanup_old_tasks' ) );

		foreach ( glob( DOUBLESCALE_PLUGIN_DIR . 'includes/Core/Fields/Types/*.php' ) ?: array() as $f ) {
			require_once $f;
		}
	}

	private function ensure_base_access_capability(): void {
		if ( ! function_exists( 'get_role' ) ) {
			return;
		}

		$roles = array_merge(
			array( 'administrator' ),
			\DoubleScale\Core\UserRoles\UserRoles::get_known_role_slugs()
		);

		foreach ( array_unique( $roles ) as $role_slug ) {
			$role = get_role( $role_slug );
			if ( $role && ! $role->has_cap( 'doublescale_access' ) ) {
				$role->add_cap( 'doublescale_access' );
			}
		}
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
			$crm_caps = \DoubleScale\Core\UserRoles\UserRoles::get_all_caps();
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
