<?php
/**
 * Class Automation_Contacts_Table
 * This class is responsible for handling the Automation_Contacts_Table table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Automation_Contacts_Table Table class
 */
class Automation_Contacts_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'automation_contacts';

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
		 * id PRIMARY KEY
		 * contact_id BIGINT(20) UNSIGNED NOT NULL
		 * automation_id BIGINT(20) UNSIGNED NOT NULL
		 * execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 * event VARCHAR(255) NOT NULL
		 * status VARCHAR(255) NOT NULL
		 * step_id BIGINT(20) UNSIGNED NOT NULL
		 * data TEXT
		 * created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 * updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            contact_id BIGINT(20) UNSIGNED NOT NULL,
            automation_id BIGINT(20) UNSIGNED NOT NULL,
            execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            event VARCHAR(255) NOT NULL,
            status VARCHAR(255) NOT NULL,
            step_id BIGINT(20) UNSIGNED NOT NULL,
            data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)';

		return $query;
	}
}
