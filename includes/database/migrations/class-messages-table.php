<?php
/**
 * Class Messages_Table
 * Stores actual message content for audit trail and compliance
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Messages Table class
 *
 * This table stores the actual content (subject + body) of all sent messages.
 * It's separate from the tracking table to maintain clean separation between:
 * - Message content (what was sent)
 * - Message metadata (who, when, delivery status, engagement)
 */
class Messages_Table extends Migration
{

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'messages';

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
		 * Messages Table Fields:
		 *
		 * id: BIGINT(20) NOT NULL AUTO_INCREMENT
		 * tracking_id: BIGINT(20) NOT NULL - Foreign key to quillcrm_tracking table
		 * subject: TEXT NULL - Email subject (NULL for SMS/WhatsApp)
		 * body: LONGTEXT NOT NULL - Message body (all channels)
		 * created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 * updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            tracking_id BIGINT(20) NOT NULL COMMENT "Foreign key to tracking table",
            subject TEXT NULL COMMENT "Email subject (NULL for SMS/WhatsApp)",
            body LONGTEXT NOT NULL COMMENT "Message body (all channels)",
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY tracking_id (tracking_id),
            FULLTEXT KEY search_content (subject, body)';

		return $query;
	}
}
