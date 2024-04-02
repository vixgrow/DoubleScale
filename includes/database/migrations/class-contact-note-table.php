<?php
/**
 * Class Contact_Note_Table
 * This class is responsible for handling the contact note table migration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Contact_Note_Table class
 */
class Contact_Note_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'contact_note';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		return 'id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                contact_id BIGINT(20) UNSIGNED NOT NULL,
                note TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)';
	}
}
