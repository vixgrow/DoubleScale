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
use QuillCRM\Database\Migrations\Custom_Field_Relationship_Table;
use QuillCRM\Database\Migrations\Contact_List_Relationship_Table;
use QuillCRM\Database\Migrations\Contact_Tag_Relationship_Table;
use QuillCRM\Database\Migrations\Contact_Notes_Table;
use QuillCRM\Database\Migrations\Contacts_Table;
use QuillCRM\Database\Migrations\Custom_Fields_Groups_Table;
use QuillCRM\Database\Migrations\Custom_Fields_Table;
use QuillCRM\Database\Migrations\Lists_Table;
use QuillCRM\Database\Migrations\Tags_Table;
use QuillCRM\Database\Migrations\Campaigns_Table;
use QuillCRM\Database\Migrations\Templates_Table;
use QuillCRM\Database\Migrations\Task_Meta_Table;
use QuillCRM\Database\Migrations\Campaign_Emails_Table;
use QuillCRM\Database\Migrations\Forms_Table;
use QuillCRM\Database\Migrations\Automation_Contact_Processes_Table;
use QuillCRM\Database\Migrations\Link_Triggers_Table;
use QuillCRM\Database\Migrations\Abandoned_Carts_Table;
use QuillCRM\Database\Migrations\Logs_Table;
use QuillCRM\Database\Migrations\Pipelines_Table;
use QuillCRM\Database\Migrations\Pipeline_Stages_Table;
use QuillCRM\Database\Migrations\Deals_Table;
use QuillCRM\Database\Migrations\Deal_Activities_Table;
use QuillCRM\Database\Migrations\Activity_Comments_Table;
use QuillCRM\User_Roles\User_Roles;

/**
 * Install class
 */
class Install {



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
				'custom_field_relationship'    => Custom_Field_Relationship_Table::class,
				'contact_list_relationship'    => Contact_List_Relationship_Table::class,
				'contact_tag_relationship'     => Contact_Tag_Relationship_Table::class,
				'custom_fields'                => Custom_Fields_Table::class,
				'custom_fields_groups'         => Custom_Fields_Groups_Table::class,
				'lists'                        => Lists_Table::class,
				'tags'                         => Tags_Table::class,
				'contact_notes'                => Contact_Notes_Table::class,
				'campaigns'                    => Campaigns_Table::class,
				'templates'                    => Templates_Table::class,
				'automations'                  => Automations_Table::class,
				'automation_steps'             => Automation_Steps_Table::class,
				'automation_contacts'          => Automation_Contacts_Table::class,
				'task_meta'                    => Task_Meta_Table::class,
				'campaign_emails'              => Campaign_Emails_Table::class,
				'forms'                        => Forms_Table::class,
				'automation_contact_processes' => Automation_Contact_Processes_Table::class,
				'link_triggers'                => Link_Triggers_Table::class,
				'abandoned_carts'              => Abandoned_Carts_Table::class,
				'logs'                         => Logs_Table::class,
				'pipelines'                    => Pipelines_Table::class,
				'pipeline_stages'              => Pipeline_Stages_Table::class,
				'deals'                        => Deals_Table::class,
				'deal_activities'              => Deal_Activities_Table::class,
				'activity_comments'            => Activity_Comments_Table::class,
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
		do_action( 'quillcrm_installed' );
	}
}
