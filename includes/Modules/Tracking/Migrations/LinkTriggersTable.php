<?php
/**
 * Class Link Triggers Table
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Tracking\Migrations;


use DoubleScale\Core\Database\Migration;
/**
 * Link Triggers Table class
 */
class LinkTriggersTable extends Migration {

	/**
	 * Table Name
	 *
	 * @var string
	 */
	public $table_name = 'link_triggers';

	/**
	 * Get Query
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
		 * name: Name of the link trigger
		 * hash: Hash of the link trigger
		 * status: Status of the link trigger
		 * settings: Settings of the link trigger
		 * click_count: Click count of the link trigger
		 * created_at: Created at timestamp
		 * updated_at: Updated at timestamp
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
			name VARCHAR(255) NOT NULL,
            hash VARCHAR(191) NOT NULL,
            status VARCHAR(255) NOT NULL DEFAULT "inactive",
            settings TEXT,
			click_count BIGINT(20) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY hash (hash)';

		return $query;
	}
}
