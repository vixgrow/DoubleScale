<?php
/**
 * Class Contact_Custom_Field_Relationship_Table
 * This class is responsible for handling the contact custom field relationship table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Contact_Custom_Field_Relationship_Table class
 */
class Contact_Custom_Field_Relationship_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'contact_custom_field_relationship';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            contact_id BIGINT(20) UNSIGNED NOT NULL,
            custom_field_id BIGINT(20) UNSIGNED NOT NULL,
            value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)';

		return $query;
	}
}
