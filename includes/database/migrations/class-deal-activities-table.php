<?php
/**
 * Class Deal_Activities_Table
 * This class is responsible for handling the Deal Activities table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Deal_Activities Table class
 */
class Deal_Activities_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'deal_activities';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			deal_id BIGINT(20) UNSIGNED NOT NULL,
			activity_type ENUM("created","stage_changed","value_changed","status_changed","note_added","email_sent","call_logged","meeting_scheduled") NOT NULL,
			data JSON,
			user_id BIGINT(20) UNSIGNED NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			INDEX idx_deal_id (deal_id),
			INDEX idx_activity_type (activity_type),
			INDEX idx_user_id (user_id),
			INDEX idx_created_at (created_at)';

		return $query;
	}
}