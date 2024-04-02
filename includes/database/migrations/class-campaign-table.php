<?php
/**
 * Class Campaign_Table
 * This class is responsible for handling the campaign table migration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Campaign_Table class
 */
class Campaign_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'campaign';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		/**
		 * Fields:
		 *
		 * id BIGINT(20) NOT NULL AUTO_INCREMENT,
		 * name VARCHAR(255) NOT NULL,
		 * description TEXT,
		 * status VARCHAR(255) NOT NULL DEFAULT "inactive",
		 * settings TEXT,
		 * parent_id BIGINT(20) NOT NULL DEFAULT 0,
		 * count INT(11) NOT NULL DEFAULT 0,
		 * execute_at TIMESTAMP,
		 * created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		 * updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(255) NOT NULL DEFAULT "inactive",
            settings TEXT,
            parent_id BIGINT(20) NOT NULL DEFAULT 0,
            count INT(11) NOT NULL DEFAULT 0,
            execute_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)';

		return $query;
	}
}

