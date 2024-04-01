<?php
/**
 * Class Contact_List_Relationship_Table
 * This class is responsible for handling the Contact_List_Relationship_Table table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Contact_List_Relationship_Table class
 */
class Contact_List_Relationship_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'contact_list_relationship';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
			contact_id BIGINT(20) UNSIGNED NOT NULL,
			list_id BIGINT(20) UNSIGNED NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id)';

		return $query;
	}
}
