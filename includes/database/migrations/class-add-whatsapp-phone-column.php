<?php
/**
 * Class Add_WhatsApp_Phone_Column
 * Migration to add whatsapp_phone column to contacts table
 *
 * This is a separate migration for existing installations where the
 * contacts table already exists without the whatsapp_phone column.
 *
 * @since 1.1.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Add_WhatsApp_Phone_Column class
 */
class Add_WhatsApp_Phone_Column {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.1.0
	 */
	public $table_name;

	/**
	 * Constructor
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		global $wpdb;
		$this->table_name = $wpdb->prefix . 'quillcrm_contacts';
	}

	/**
	 * Run the migration
	 *
	 * Adds whatsapp_phone column to contacts table if it doesn't exist.
	 *
	 * @since 1.1.0
	 */
	public function run() {
		global $wpdb;

		// Check if column already exists
		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'whatsapp_phone'",
				DB_NAME,
				$this->table_name
			)
		);

		// Only add column if it doesn't exist
		if ( empty( $column_exists ) ) {
			// Add whatsapp_phone column after phone column
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
			$wpdb->query(
				"ALTER TABLE {$this->table_name} ADD COLUMN whatsapp_phone VARCHAR(255) DEFAULT NULL AFTER phone"
			);
		}
	}
}

