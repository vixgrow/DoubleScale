<?php
/**
 * Customer comments on proposals.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Migrations;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Database\Migration;

/**
 * SalesProposalCommentsTable migration.
 */
class SalesProposalCommentsTable extends Migration {

	/**
	 * @var string
	 */
	public $table_name = 'sales_proposal_comments';

	/**
	 * @return string
	 */
	public function get_query() {
		return "id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			proposal_id BIGINT(20) UNSIGNED NOT NULL,
			author_name VARCHAR(255) NOT NULL,
			content TEXT NOT NULL,
			is_customer TINYINT(1) NOT NULL DEFAULT 1,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			KEY idx_proposal (proposal_id)";
	}
}
