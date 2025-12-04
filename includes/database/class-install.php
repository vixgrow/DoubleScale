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
use QuillCRM\Database\Migrations\Automation_Contact_Processes_Table;
// use QuillCRM\Database\Migrations\Link_Triggers_Table; // Moved to Pro
use QuillCRM\Database\Migrations\Abandoned_Carts_Table;
use QuillCRM\Database\Migrations\Logs_Table;
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
	 * @param bool $network_wide Whether the plugin is being network activated
	 */
	public static function multisite_activate( $network_wide ) {
		global $wpdb;

		if ( is_multisite() && $network_wide ) {
			// Get all blog IDs
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
	 * @param int $blog_id Blog ID of the new site
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
				'communication_tracking'       => Communication_Tracking_Table::class,
				'automation_contact_processes' => Automation_Contact_Processes_Table::class,
				// 'link_triggers'                => Link_Triggers_Table::class, // Moved to Pro
				'abandoned_carts'              => Abandoned_Carts_Table::class,
				'logs'                         => Logs_Table::class,
				'communication_tracking_meta'  => Communication_Tracking_Meta_Table::class,
				// Pipeline, Link Triggers, and Custom Fields tables moved to Pro plugin
			)
		);

		foreach ( $tables as $table => $class ) {
			if ( ! class_exists( $class ) ) {
				continue;
			}

			/** @var \QuillCRM\Database\Migrations\Migration $migration */
			$migration = new $class();
			$migration->run();
		}

		// If we made it till here nothing is running yet, lets set the transient now.
		set_transient( 'quillcrm_installing', 'yes', MINUTE_IN_SECONDS * 10 );
		delete_transient( 'quillcrm_installing' );
		User_Roles::add_roles_and_capabilities();
		self::update_quillcrm_version();
	}

	/**
	 * Update QuillCRM version to current.
	 *
	 * @since 1.0.0
	 */
	private static function update_quillcrm_version() {
		 update_option( 'quillcrm_version', QUILLCRM_VERSION );
	}
}
