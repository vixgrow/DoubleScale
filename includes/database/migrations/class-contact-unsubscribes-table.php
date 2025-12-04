<?php
/**
 * Class Contact_Unsubscribes_Table
 * Table for tracking contact unsubscribe events with source tracking
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Contact_Unsubscribes_Table class
 */
class Contact_Unsubscribes_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'contact_unsubscribes';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		/**
		 * Contact Unsubscribes Table Fields:
		 *
		 * id: BIGINT(20) NOT NULL AUTO_INCREMENT
		 * contact_id: BIGINT(20) NOT NULL - FK to contacts
		 * mode: VARCHAR(20) NOT NULL - mode type (email, sms, whatsapp)
		 * reason: TEXT NULL - Reason for unsubscribe
		 * source_type: VARCHAR(20) NULL - Source type (campaign, automation)
		 * source_id: BIGINT(20) NULL - Campaign ID or Automation ID depending on source_type
		 * created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
			contact_id BIGINT(20) NOT NULL COMMENT "FK to contacts",
			mode VARCHAR(20) NOT NULL COMMENT "mode type: email, sms, whatsapp",
			reason TEXT NULL COMMENT "Reason for unsubscribe",
			source_type VARCHAR(20) NULL COMMENT "Source type: campaign, automation",
			source_id BIGINT(20) NULL COMMENT "Campaign ID or Automation ID depending on source_type",
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY contact_id (contact_id),
			KEY mode (mode),
			KEY source_type (source_type),
			KEY source_id (source_id),
			KEY composite_source (source_type, source_id),
			KEY composite_contact_mode (contact_id, mode)';

		return $query;
	}
}
