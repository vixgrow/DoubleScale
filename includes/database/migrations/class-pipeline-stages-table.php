<?php
/**
 * Class Pipeline_Stages_Table
 * This class is responsible for handling the Pipeline Stages table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Pipeline_Stages Table class
 */
class Pipeline_Stages_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'pipeline_stages';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		$query = 'id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			pipeline_id BIGINT(20) UNSIGNED NOT NULL,
			name VARCHAR(255) NOT NULL,
			color VARCHAR(7) DEFAULT "#6d78d8",
			sort_order INT DEFAULT 0,
			win_probability DECIMAL(5,2) DEFAULT 0.00,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			INDEX idx_pipeline_id (pipeline_id),
			INDEX idx_sort_order (sort_order)';

		return $query;
	}
}