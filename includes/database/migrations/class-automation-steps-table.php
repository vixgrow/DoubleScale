<?php
/**
 * Class Automation_Steps_Table
 * This class is responsible for handling the Automation_Steps_Table table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Automation_Steps_Table Table class
 */
class Automation_Steps_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'automation_steps';

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
		 * id: Primary key
		 * automation_id: Automation ID
		 * action: Action of the step
		 * type: Type of the step
		 * status: Status of the step
		 * settings: Settings of the step
		 * created_at: Created at timestamp
		 * updated_at: Updated at timestamp
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            automation_id BIGINT(20) UNSIGNED NOT NULL,
            action VARCHAR(255) NOT NULL,
            type VARCHAR(255) NOT NULL,
            status VARCHAR(255) NOT NULL,
            settings TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)';

		return $query;
	}
}
