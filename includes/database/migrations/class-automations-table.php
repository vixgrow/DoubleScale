<?php
/**
 * Class Automations_Table
 * This class is responsible for handling the Automations table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Automations Table class
 */
class Automations_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'automations';

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
		 * name: Name of the automation
		 * trigger_name: Trigger of the automation
		 * status: Status of the automation
		 * settings: Settings of the automation
		 * created_at: Created at timestamp
		 * updated_at: Updated at timestamp
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            `trigger` VARCHAR(255) NOT NULL,
            status VARCHAR(255) NOT NULL,
            settings TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)';

		return $query;
	}
}
