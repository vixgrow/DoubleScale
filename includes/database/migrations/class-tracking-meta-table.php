<?php
/**
 * Class Tracking_Table
 * Unified table for tracking message delivery, opens, clicks across all channels
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Tracking Table class
 */
class Tracking_Meta_Table extends Migration
{

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'tracking_meta';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query()
	{
	/**
	 * Unified Tracking Meta Table Fields:
	 *
	 * id: BIGINT(20) NOT NULL AUTO_INCREMENT
	 * tracking_id: BIGINT(20) NOT NULL
	 * merge_tags: LONGTEXT NOT NULL
	 * created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	 * updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            tracking_id BIGINT(20) NOT NULL,
            merge_tags LONGTEXT,
						sections_ids LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY tracking_id (tracking_id)';
		return $query;
	}
}
