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
class Tracking_Table extends Migration
{

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'tracking';

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
		 * Unified Tracking Table Fields:
		 *
		 * id: BIGINT(20) NOT NULL AUTO_INCREMENT
		 * contact_id: BIGINT(20) NOT NULL
		 * template_id: BIGINT(20) NOT NULL
		 * hash_key: VARCHAR(255) NOT NULL
		 * mode: TINYINT(1) NOT NULL COMMENT '1=Email, 2=SMS, 3=WhatsApp'
		 * source_type: TINYINT(2) NOT NULL DEFAULT 1 COMMENT '1=Campaign, 2=Automation'
		 * source_id: BIGINT(20) NOT NULL DEFAULT 0 COMMENT 'ID of the source (campaign_id or automation_id)'
		 * recipient: VARCHAR(255) NOT NULL COMMENT 'Email address or phone number'
		 * opened: TINYINT(1) DEFAULT 0 COMMENT 'Only for emails'
		 * clicked: TINYINT(1) DEFAULT 0
		 * status: VARCHAR(255)
		 * sent_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 * opened_at: TIMESTAMP COMMENT 'Only for emails'
		 * clicked_at: TIMESTAMP
		 * created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 * updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            contact_id BIGINT(20) NOT NULL,
            template_id BIGINT(20) NOT NULL,
            hash_key VARCHAR(255) NOT NULL,
            mode TINYINT(1) NOT NULL COMMENT "1=Email, 2=SMS, 3=WhatsApp",
            source_type TINYINT(2) NOT NULL DEFAULT 1 COMMENT "1=Campaign, 2=Automation",
            source_id BIGINT(20) NOT NULL DEFAULT 0 COMMENT "ID of the source (campaign_id or automation_id)",
            recipient VARCHAR(255) NOT NULL COMMENT "Email address or phone number",
            opened TINYINT(1) DEFAULT 0 COMMENT "Only for emails",
            clicked TINYINT(1) DEFAULT 0,
            status VARCHAR(255),
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            opened_at TIMESTAMP NULL COMMENT "Only for emails",
            clicked_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY contact_id (contact_id),
            KEY template_id (template_id),
            KEY hash_key (hash_key),
            KEY mode (mode),
            KEY source_type (source_type),
            KEY source_id (source_id),
            KEY recipient (recipient),
            KEY status (status),
            KEY sent_at (sent_at)';

		return $query;
	}
}
