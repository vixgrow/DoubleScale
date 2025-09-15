<?php
/**
 * Class Deals_Table
 * This class is responsible for handling the Deals table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Deals Table class
 */
class Deals_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'deals';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			title VARCHAR(255) NOT NULL,
			contact_id BIGINT(20) UNSIGNED NOT NULL,
			pipeline_id BIGINT(20) UNSIGNED NOT NULL,
			stage_id BIGINT(20) UNSIGNED NOT NULL,
			value DECIMAL(10,2) DEFAULT 0.00,
			currency VARCHAR(3) DEFAULT "USD",
			expected_close_date DATE NULL,
			probability DECIMAL(5,2) NULL,
			status ENUM("open","won","lost") DEFAULT "open",
			owner_id BIGINT(20) UNSIGNED NULL,
			source VARCHAR(100),
			lost_reason TEXT NULL,
			won_time TIMESTAMP NULL,
			lost_time TIMESTAMP NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			INDEX idx_contact_id (contact_id),
			INDEX idx_pipeline_id (pipeline_id),
			INDEX idx_stage_id (stage_id),
			INDEX idx_owner_id (owner_id),
			INDEX idx_status (status),
			INDEX idx_expected_close_date (expected_close_date),
			CONSTRAINT fk_deals_contact_id FOREIGN KEY (contact_id) REFERENCES ' . $GLOBALS['wpdb']->prefix . 'quillcrm_contacts(id) ON DELETE CASCADE,
			CONSTRAINT fk_deals_pipeline_id FOREIGN KEY (pipeline_id) REFERENCES ' . $GLOBALS['wpdb']->prefix . 'quillcrm_pipelines(id) ON DELETE CASCADE,
			CONSTRAINT fk_deals_stage_id FOREIGN KEY (stage_id) REFERENCES ' . $GLOBALS['wpdb']->prefix . 'quillcrm_pipeline_stages(id) ON DELETE CASCADE';

		return $query;
	}
}