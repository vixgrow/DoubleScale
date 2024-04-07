<?php
/**
 * Class Task_Meta_Table
 * This class is responsible for handling the task meta table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

use QuillCRM\Database\Migrations\Migration;

/**
 * Task_Meta_Table class
 */
class Task_Meta_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'task_meta';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'ID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				action_id BIGINT UNSIGNED,
				hook varchar(255) NOT NULL,
				group_slug varchar(255) NOT NULL,
				value longtext NOT NULL,
				date_created datetime NOT NULL,
				PRIMARY KEY  (ID),
				KEY action_id (action_id)';

		return $query;
	}
}
