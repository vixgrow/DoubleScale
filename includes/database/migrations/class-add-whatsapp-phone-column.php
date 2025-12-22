<?php
/**
 * Class Add_WhatsApp_Phone_Column
 * Migration to add WhatsApp columns to contacts table
 *
 * This is a separate migration for existing installations where the
 * contacts table already exists without the WhatsApp-related columns.
 *
 * Adds:
 * - whatsapp_phone: Separate phone number for WhatsApp (HubSpot-style architecture)
 * - whatsapp_status: Channel-specific subscription status
 * - Indexes for query performance
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
	 * Adds WhatsApp columns to contacts table if they don't exist.
	 *
	 * @since 1.1.0
	 */
	public function run() {
		$this->add_whatsapp_phone_column();
		$this->add_whatsapp_status_column();
		$this->add_indexes();
	}

	/**
	 * Add whatsapp_phone column if it doesn't exist
	 *
	 * @since 1.1.0
	 */
	private function add_whatsapp_phone_column() {
		global $wpdb;

		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'whatsapp_phone'",
				DB_NAME,
				$this->table_name
			)
		);

		if ( empty( $column_exists ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
			$wpdb->query(
				"ALTER TABLE {$this->table_name} ADD COLUMN whatsapp_phone VARCHAR(255) DEFAULT NULL AFTER phone"
			);
		}
	}

	/**
	 * Add whatsapp_status column if it doesn't exist
	 *
	 * @since 1.1.0
	 */
	private function add_whatsapp_status_column() {
		global $wpdb;

		$column_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = 'whatsapp_status'",
				DB_NAME,
				$this->table_name
			)
		);

		if ( empty( $column_exists ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
			$wpdb->query(
				"ALTER TABLE {$this->table_name} ADD COLUMN whatsapp_status VARCHAR(50) NOT NULL DEFAULT 'subscribed' AFTER sms_status"
			);
		}
	}

	/**
	 * Add indexes for WhatsApp columns if they don't exist
	 *
	 * @since 1.1.0
	 */
	private function add_indexes() {
		global $wpdb;

		// Check and add whatsapp_phone index.
		$phone_index_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND INDEX_NAME = 'whatsapp_phone'",
				DB_NAME,
				$this->table_name
			)
		);

		if ( empty( $phone_index_exists ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
			$wpdb->query(
				"ALTER TABLE {$this->table_name} ADD INDEX whatsapp_phone (whatsapp_phone)"
			);
		}

		// Check and add whatsapp_status index.
		$status_index_exists = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND INDEX_NAME = 'whatsapp_status'",
				DB_NAME,
				$this->table_name
			)
		);

		if ( empty( $status_index_exists ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
			$wpdb->query(
				"ALTER TABLE {$this->table_name} ADD INDEX whatsapp_status (whatsapp_status)"
			);
		}
	}
}

