<?php

/**
 * Class Custom_Field_Relationship_Table
 * This class is responsible for handling the custom field relationship table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Custom_Field_Relationship_Table class
 */
class Custom_Field_Relationship_Table extends Migration {


	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'custom_field_relationship';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            entity_id BIGINT(20) UNSIGNED NOT NULL,
            entity_type VARCHAR(255) NOT NULL,
            custom_field_id BIGINT(20) UNSIGNED NOT NULL,
            value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)';

		return $query;
	}
}
