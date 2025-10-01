<?php
/**
 * Class Campaign_Messages_Table
 * Unified table for all campaign message types (Email, SMS, WhatsApp)
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Campaign Messages Table class
 */
class Campaign_Messages_Table extends Migration
{

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'campaign_messages';

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
		 * Unified Campaign Messages Table Fields:
		 *
		 * id: BIGINT(20) NOT NULL AUTO_INCREMENT
		 * campaign_id: BIGINT(20) NOT NULL
		 * contact_id: BIGINT(20) NOT NULL
		 * template_id: BIGINT(20) NOT NULL
		 * hash_key: VARCHAR(255) NOT NULL
		 * mode: TINYINT(1) NOT NULL COMMENT '1=Email, 2=SMS, 3=WhatsApp'
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
            campaign_id BIGINT(20) NOT NULL,
            contact_id BIGINT(20) NOT NULL,
            template_id BIGINT(20) NOT NULL,
            hash_key VARCHAR(255) NOT NULL,
            mode TINYINT(1) NOT NULL COMMENT "1=Email, 2=SMS, 3=WhatsApp",
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
            KEY campaign_id (campaign_id),
            KEY contact_id (contact_id),
            KEY template_id (template_id),
            KEY hash_key (hash_key),
            KEY mode (mode),
            KEY recipient (recipient),
            KEY status (status),
            KEY sent_at (sent_at)';

		return $query;
	}
}
