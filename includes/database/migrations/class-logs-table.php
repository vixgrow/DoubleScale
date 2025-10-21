<?php
/**
 * Class Logs_Table file.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Logs Table class
 */
class Logs_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'logs';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            timestamp datetime NOT NULL,
            level smallint(4) NOT NULL,
            source varchar(200) NOT NULL,
            message longtext NOT NULL,
            context longtext NULL,
            PRIMARY KEY (id),
            KEY level (level),
            KEY idx_timestamp (timestamp),
            KEY idx_source (source(50)),
            KEY idx_timestamp_level (timestamp, level)';

		return $query;
	}
}
