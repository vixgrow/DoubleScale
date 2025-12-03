<?php
/**
 * Class Activities_Table
 * Unified table for all activity types (messages, notes, calls, meetings, system events)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Activities Table class
 */
class Activities_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'activities';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		/**
		 * Unified Activities Table Fields:
		 *
		 * id: BIGINT(20) NOT NULL AUTO_INCREMENT
		 * contact_id: BIGINT(20) NULL - FK to contacts (for quick filtering)
		 * deal_id: BIGINT(20) NULL - FK to deals (NULL for non-deal activities)
		 * activity_type: VARCHAR(50) NOT NULL - Type of activity (email_sent, sms_sent, note_added, etc.)
		 * data: JSON NULL - All activity-specific data including subject/body
		 * user_id: BIGINT(20) UNSIGNED NULL - User who performed action
		 * created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 * updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
			contact_id BIGINT(20) NULL COMMENT "FK to contacts for quick filtering",
			deal_id BIGINT(20) NULL COMMENT "FK to deals, NULL for non-deal activities",
			activity_type VARCHAR(50) NOT NULL COMMENT "email_sent, sms_sent, note_added, call_logged, meeting_scheduled, created, stage_changed, etc.",
			data JSON NULL COMMENT "Activity-specific data including subject, body, and other metadata",
			user_id BIGINT(20) UNSIGNED NULL COMMENT "User who performed action",
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY contact_id (contact_id),
			KEY deal_id (deal_id),
			KEY activity_type (activity_type),
			KEY user_id (user_id),
			KEY created_at (created_at),
			KEY composite_contact_type (contact_id, activity_type, created_at),
			KEY composite_deal_created (deal_id, created_at)';

		return $query;
	}
}
