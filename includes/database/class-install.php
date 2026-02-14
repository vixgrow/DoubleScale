<?php

/**
 * Class Install
 * This class is responsible for handling the database installation
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use QuillCRM\Database\Migrations\Automation_Contacts_Table;
use QuillCRM\Database\Migrations\Automation_Steps_Table;
use QuillCRM\Database\Migrations\Automations_Table;
use QuillCRM\Database\Migrations\Contact_List_Relationship_Table;
use QuillCRM\Database\Migrations\Contact_Tag_Relationship_Table;
use QuillCRM\Database\Migrations\Contact_Unsubscribes_Table;
use QuillCRM\Database\Migrations\Contact_Meta_Table;
use QuillCRM\Database\Migrations\Contacts_Table;
use QuillCRM\Database\Migrations\Lists_Table;
use QuillCRM\Database\Migrations\Tags_Table;
use QuillCRM\Database\Migrations\Campaigns_Table;
use QuillCRM\Database\Migrations\Templates_Table;
use QuillCRM\Database\Migrations\Communication_Tracking_Meta_Table;
use QuillCRM\Database\Migrations\Task_Meta_Table;
use QuillCRM\Database\Migrations\Communication_Tracking_Table;
use QuillCRM\Database\Migrations\Activities_Table;
use QuillCRM\Database\Migrations\Activity_Comments_Table;
use QuillCRM\Database\Migrations\Automation_Contact_Processes_Table;
use QuillCRM\Database\Migrations\Abandoned_Carts_Table;
use QuillCRM\Database\Migrations\Logs_Table;
use QuillCRM\Database\Migrations\Forms_Table;
use QuillCRM\Database\Migrations\Form_Submissions_Table;
use QuillCRM\Database\Migrations\Activity_Associations_Table;
use QuillCRM\User_Roles\User_Roles;

/**
 * Install class
 */
class Install {



	/**
	 * Init
	 *
	 * @since 1.0.0
	 */
	public static function init() {
		 add_action( 'init', array( __CLASS__, 'check_version' ), 5 );
	}

	/**
	 * Check QuillCRM version and run the updater if required.
	 *
	 * This check is done on all requests and runs if the versions do not match.
	 */
	public static function check_version() {
		$current_version = get_option( 'quillcrm_version' );
		$plugin_version  = QUILLCRM_VERSION;

		if ( version_compare( $current_version, $plugin_version, '<' ) ) {
			self::install();
			do_action( 'quillcrm_updated' );
		}
	}

	/**
	 * Multisite activation
	 *
	 * Activates the plugin on all sites in a multisite network
	 *
	 * @since 1.0.0
	 *
	 * @param bool $network_wide Whether the plugin is being network activated.
	 */
	public static function multisite_activate( $network_wide ) {
		global $wpdb;

		if ( is_multisite() && $network_wide ) {
			// Get all blog IDs.
			$blog_ids = $wpdb->get_col( "SELECT blog_id FROM $wpdb->blogs" );

			foreach ( $blog_ids as $blog_id ) {
				switch_to_blog( $blog_id );
				self::install();
				restore_current_blog();
			}
		} else {
			self::install();
		}
	}

	/**
	 * Activate plugin on a new site in a multisite network
	 *
	 * @since 1.0.0
	 *
	 * @param int $blog_id Blog ID of the new site.
	 */
	public static function activate_new_site( $blog_id ) {
		if ( is_plugin_active_for_network( plugin_basename( QUILLCRM_PLUGIN_FILE ) ) ) {
			switch_to_blog( $blog_id );
			self::install();
			restore_current_blog();
		}
	}

	/**
	 * Install
	 *
	 * @since 1.0.0
	 */
	public static function install() {
		// Check if we are not already running this routine.
		if ( 'yes' === get_transient( 'quillcrm_installing' ) ) {
			return;
		}

		// If we made it till here nothing is running yet, lets set the transient now.
		set_transient( 'quillcrm_installing', 'yes', MINUTE_IN_SECONDS * 10 );

		$tables = apply_filters(
			'quillcrm_database_tables',
			array(
				'contacts'                     => Contacts_Table::class,
				'contact_meta'                 => Contact_Meta_Table::class,
				'contact_list_relationship'    => Contact_List_Relationship_Table::class,
				'contact_tag_relationship'     => Contact_Tag_Relationship_Table::class,
				'lists'                        => Lists_Table::class,
				'tags'                         => Tags_Table::class,
				'contact_unsubscribes'         => Contact_Unsubscribes_Table::class,
				'campaigns'                    => Campaigns_Table::class,
				'templates'                    => Templates_Table::class,
				'automations'                  => Automations_Table::class,
				'automation_steps'             => Automation_Steps_Table::class,
				'automation_contacts'          => Automation_Contacts_Table::class,
				'task_meta'                    => Task_Meta_Table::class,
				'activities'                   => Activities_Table::class,
				'activity_comments'            => Activity_Comments_Table::class,
				'communication_tracking'       => Communication_Tracking_Table::class,
				'automation_contact_processes' => Automation_Contact_Processes_Table::class,
				'abandoned_carts'              => Abandoned_Carts_Table::class,
				'logs'                         => Logs_Table::class,
				'communication_tracking_meta'  => Communication_Tracking_Meta_Table::class,
				'forms'                        => Forms_Table::class,
				'form_submissions'             => Form_Submissions_Table::class,
				'activity_associations'        => Activity_Associations_Table::class,
			)
		);

		foreach ( $tables as $class ) {
			if ( ! class_exists( $class ) ) {
				continue;
			}

			/**
			 * Migration instance.
			 *
			 * @var \QuillCRM\Database\Migrations\Migration $migration
			 */
			$migration = new $class();
			$migration->run();
		}

		// Run version-specific migrations for existing installations.
		// This must run BEFORE updating the version so failed migrations retry.
		self::run_version_migrations();

		User_Roles::add_roles_and_capabilities();

		// Update version AFTER all migrations complete successfully.
		self::update_quillcrm_version();

		delete_transient( 'quillcrm_installing' );
	}

	/**
	 * Update QuillCRM version to current.
	 *
	 * @since 1.0.0
	 */
	private static function update_quillcrm_version() {
		 update_option( 'quillcrm_version', QUILLCRM_VERSION );
	}

	/**
	 * Run version-specific migrations.
	 *
	 * These migrations run ONCE when upgrading from older versions.
	 * Each migration checks the stored version and only runs if needed.
	 *
	 * IMPORTANT: Migrations must be listed in ascending version order.
	 * The version number represents when the migration was introduced,
	 * not the current plugin version.
	 *
	 * @since 1.1.0
	 */
	private static function run_version_migrations() {
		$current_version = get_option( 'quillcrm_version' );

		// Skip for fresh installations - tables already have all columns.
		// Fresh installs have no stored version yet.
		if ( ! $current_version ) {
			return;
		}

		// Version 1.1.0: Add WhatsApp columns to contacts table.
		self::version_1_1_0_migration( $current_version );

		// Version 1.1.9: Add created_by columns to campaigns and automations tables.
		self::version_1_1_9_migration( $current_version );

		// Version 1.2.5: Add activity_date column and backfill from JSON data.
		self::version_1_2_5_migration( $current_version );

		// Future migrations go here in version order.

		/**
		 * Action hook for Pro or third-party version migrations.
		 *
		 * @since 1.1.0
		 *
		 * @param string $current_version The currently installed version before upgrade.
		 */
		do_action( 'quillcrm_run_version_migrations', $current_version );
	}

	/**
	 * Version 1.1.0 migration.
	 *
	 * Adds WhatsApp columns to the contacts table:
	 * - whatsapp_phone: Separate phone number for WhatsApp messaging
	 * - whatsapp_status: Channel-specific subscription status
	 * - Indexes for query performance
	 *
	 * @since 1.1.0
	 *
	 * @param string $current_version The currently installed version.
	 */
	private static function version_1_1_0_migration( $current_version ) {
		global $wpdb;

		// Only run if upgrading from version < 1.1.0.
		if ( version_compare( $current_version, '1.1.0', '>=' ) ) {
			return;
		}

		$table_name = $wpdb->prefix . 'quillcrm_contacts';

		// Verify table exists before attempting migration.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name ) ) !== $table_name ) {
			return;
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		// Add whatsapp_phone column after phone.
		$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN whatsapp_phone VARCHAR(255) DEFAULT NULL AFTER phone" );

		// Add whatsapp_status column after sms_status.
		$wpdb->query( "ALTER TABLE {$table_name} ADD COLUMN whatsapp_status VARCHAR(50) NOT NULL DEFAULT 'subscribed' AFTER sms_status" );

		// Add indexes for WhatsApp columns.
		$wpdb->query( "ALTER TABLE {$table_name} ADD INDEX whatsapp_phone (whatsapp_phone)" );
		$wpdb->query( "ALTER TABLE {$table_name} ADD INDEX whatsapp_status (whatsapp_status)" );

		// phpcs:enable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	}

	/**
	 * Version 1.1.9 migration.
	 *
	 * Adds created_by columns to campaigns and automations tables:
	 * - created_by: WordPress user ID who created the record
	 * - Indexes for query performance
	 *
	 * @since 1.1.9
	 *
	 * @param string $current_version The currently installed version.
	 */
	private static function version_1_1_9_migration( $current_version ) {
		global $wpdb;

		// Only run if upgrading from version < 1.1.9.
		if ( version_compare( $current_version, '1.1.9', '>=' ) ) {
			return;
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		// Add created_by column to campaigns table.
		$campaigns_table = $wpdb->prefix . 'quillcrm_campaigns';

		// Verify table exists before attempting migration.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $campaigns_table ) ) === $campaigns_table ) {
			// Check if column already exists to prevent duplicate column errors.
			$column_exists = $wpdb->get_results( "SHOW COLUMNS FROM {$campaigns_table} LIKE 'created_by'" );

			if ( empty( $column_exists ) ) {
				$wpdb->query( "ALTER TABLE {$campaigns_table} ADD COLUMN created_by BIGINT(20) UNSIGNED DEFAULT NULL COMMENT 'WordPress user ID who created this campaign' AFTER execute_at" );
				$wpdb->query( "ALTER TABLE {$campaigns_table} ADD INDEX idx_created_by (created_by)" );
			}
		}

		// Add created_by column to automations table.
		$automations_table = $wpdb->prefix . 'quillcrm_automations';

		// Verify table exists before attempting migration.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $automations_table ) ) === $automations_table ) {
			// Check if column already exists to prevent duplicate column errors.
			$column_exists = $wpdb->get_results( "SHOW COLUMNS FROM {$automations_table} LIKE 'created_by'" );

			if ( empty( $column_exists ) ) {
				$wpdb->query( "ALTER TABLE {$automations_table} ADD COLUMN created_by BIGINT(20) UNSIGNED DEFAULT NULL COMMENT 'WordPress user ID who created this automation' AFTER settings" );
				$wpdb->query( "ALTER TABLE {$automations_table} ADD INDEX idx_created_by (created_by)" );
			}
		}

		// phpcs:enable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	}

	/**
	 * Version 1.2.5 migration.
	 *
	 * Adds activity_date column to activities table and backfills it from
	 * the JSON data column (called_at, sent_at, scheduled_at fields),
	 * falling back to created_at.
	 *
	 * @since 1.2.5
	 *
	 * @param string $current_version The currently installed version.
	 */
	private static function version_1_2_5_migration( $current_version ) {
		global $wpdb;

		// Only run if upgrading from version < 1.2.5.
		if ( version_compare( $current_version, '1.2.5', '>=' ) ) {
			return;
		}

		$table_name = $wpdb->prefix . 'quillcrm_activities';

		// Verify table exists before attempting migration.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_name ) ) !== $table_name ) {
			return;
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		// Check if column already exists to prevent duplicate column errors.
		$column_exists = $wpdb->get_results( "SHOW COLUMNS FROM {$table_name} LIKE 'activity_date'" );

		if ( empty( $column_exists ) ) {
			$wpdb->query(
				"ALTER TABLE {$table_name}
				ADD COLUMN activity_date DATETIME NULL
				COMMENT 'When the activity occurred (called_at, sent_at, scheduled_at, or created_at)'
				AFTER user_id"
			);
			$wpdb->query( "ALTER TABLE {$table_name} ADD INDEX activity_date (activity_date)" );
			$wpdb->query( "ALTER TABLE {$table_name} ADD INDEX composite_contact_activity_date (contact_id, activity_date)" );
		}

		// Backfill activity_date from JSON data for existing rows.
		// Uses the same COALESCE logic as was previously in queries.
		$wpdb->query(
			"UPDATE {$table_name}
			SET activity_date = COALESCE(
				JSON_UNQUOTE(JSON_EXTRACT(data, '$.called_at')),
				JSON_UNQUOTE(JSON_EXTRACT(data, '$.sent_at')),
				JSON_UNQUOTE(JSON_EXTRACT(data, '$.scheduled_at')),
				created_at
			)
			WHERE activity_date IS NULL"
		);

		// phpcs:enable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	}
}
