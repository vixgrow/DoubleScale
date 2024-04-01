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

use QuillCRM\Database\Migrations\Contact_List_Relationship_Table;
use QuillCRM\Database\Migrations\Contact_Tag_Relationship_Table;
use QuillCRM\Database\Migrations\Contacts_Table;
use QuillCRM\Database\Migrations\Custom_Fields_Groups_Table;
use QuillCRM\Database\Migrations\Custom_Fields_Table;
use QuillCRM\Database\Migrations\Lists_Table;
use QuillCRM\Database\Migrations\Tags_Table;

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
				'contacts'                  => Contacts_Table::class,
				'contact_list_relationship' => Contact_List_Relationship_Table::class,
				'contact_tag_relationship'  => Contact_Tag_Relationship_Table::class,
				'custom_fields'             => Custom_Fields_Table::class,
				'custom_fields_groups'      => Custom_Fields_Groups_Table::class,
				'lists'                     => Lists_Table::class,
				'tags'                      => Tags_Table::class,
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
	}
}
