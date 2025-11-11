<?php
/**
 * Class Contacts_Table
 * This class is responsible for handling the Contacts table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Contacts Table class
 */
class Contacts_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'contacts';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			hash_id VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL,
			first_name VARCHAR(255),
			last_name VARCHAR(255),
			phone VARCHAR(255),
			address_1 VARCHAR(255),
			address_2 VARCHAR(255),
			city VARCHAR(255),
			state VARCHAR(255),
			country VARCHAR(255),
			zip VARCHAR(255),
			status VARCHAR(255) DEFAULT "subscribed",
			source VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY  (email),
			KEY status (status)';

		return $query;
	}
}
