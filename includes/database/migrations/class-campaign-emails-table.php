<?php
/**
 * Class Campaign_Emails_Table
 * This class is responsible for handling the Campaign Emails table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

use QuillCRM\Database\Migrations\Migration;

/**
 * Campaign Emails Table class
 */
class Campaign_Emails_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'campaign_emails';

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
		 * id: BIGINT(20) NOT NULL AUTO_INCREMENT
		 * campaign_id: BIGINT(20) NOT NULL
		 * contact_id: BIGINT(20) NOT NULL
		 * template_id: BIGINT(20) NOT NULL
		 * hash_key: VARCHAR(255) NOT NULL
		 * email: VARCHAR(255) NOT NULL
		 * opened: TINYINT(1) NOT NULL DEFAULT 0
		 * clicked: TINYINT(1) NOT NULL DEFAULT 0
		 * status: VARCHAR(255)
		 * sent_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 * opened_at: TIMESTAMP
		 * clicked_at: TIMESTAMP
		 * created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 * updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            campaign_id BIGINT(20) NOT NULL,
            contact_id BIGINT(20) NOT NULL,
            template_id BIGINT(20) NOT NULL,
            hash_key VARCHAR(255) NOT NULL,
            email TEXT NOT NULL,
            opened TINYINT(1) DEFAULT 0,
            clicked TINYINT(1) DEFAULT 0,
            status VARCHAR(255),
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            opened_at TIMESTAMP,
            clicked_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY campaign_id (campaign_id),
            KEY contact_id (contact_id),
            KEY template_id (template_id),
            KEY hash_key (hash_key)';

		return $query;
	}
}
